import {
    supabase,
    authPageUrl,
    safeReturnTo,
    setAuthMessage,
    clearAuthMessage
} from "./auth-client.js";

/*
 * Travel Qila — authentication pages
 *
 * Security notes:
 * - This file is a browser-side control layer, not an authorization boundary.
 * - Supabase Auth must enforce password policy and rate limits.
 * - RLS must enforce every profiles-table read/write.
 * - Never put a Supabase service-role/secret key in browser code.
 * - Keep authorization/roles out of user-editable user_metadata.
 */

const page = document.body?.dataset?.authPage || "";
const form = document.querySelector("[data-auth-form]");
const message = document.querySelector("[data-auth-message]");
const submitButton = form?.querySelector('[type="submit"]');

const ALLOWED_PROFILE_NAME_LENGTH = 100;
const ALLOWED_PHONE_LENGTH = 25;
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;
const GENERIC_AUTH_ERROR =
    "We couldn't complete that request. Check your details or try again later.";

let isBusy = false;
let recoverySession = false;

// Register immediately so a PASSWORD_RECOVERY event emitted during URL
// processing is not missed. Never perform async work inside this callback.
const authSubscription = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" && session?.user) {
        recoverySession = true;

        if (page === "reset" && form) {
            setFormControlsDisabled(false);
            clearAuthMessage(message);
        }
    }

    if (event === "SIGNED_OUT") {
        recoverySession = false;
    }
});

function field(name) {
    return form?.elements?.namedItem(name) ?? null;
}

function rawValue(name) {
    const control = field(name);

    return typeof control?.value === "string"
        ? control.value
        : "";
}

function trimmedValue(name) {
    return rawValue(name).trim();
}

function setFormControlsDisabled(disabled) {
    if (!form) return;

    form.querySelectorAll("input, select, textarea, button").forEach((control) => {
        if (control === submitButton && isBusy) return;

        control.disabled = disabled;
    });
}

function setBusy(busy, label = "Please wait…") {
    isBusy = busy;

    if (submitButton) {
        if (!submitButton.dataset.originalLabel) {
            submitButton.dataset.originalLabel =
                submitButton.textContent?.trim() || "Continue";
        }

        submitButton.disabled = busy;

        submitButton.textContent = busy
            ? label
            : submitButton.dataset.originalLabel;
    }

    form?.setAttribute("aria-busy", String(busy));
}

function showError(text = GENERIC_AUTH_ERROR) {
    setAuthMessage(message, text, "error");
}

function logSafeError(context, error) {
    // Avoid dumping tokens, user objects, email addresses, or form values.
    console.error(`[Travel Qila] ${context}`, {
        name: error?.name || "Error",
        code: error?.code || error?.status || "unknown"
    });
}

function validEmail(email) {
    // Basic client-side hygiene only; Supabase performs authoritative checks.
    return email.length <= 254 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validName(name) {
    return name.length >= 2 &&
        name.length <= ALLOWED_PROFILE_NAME_LENGTH &&
        !/[\u0000-\u001F\u007F]/.test(name);
}

function validPhone(phone) {
    return phone.length <= ALLOWED_PHONE_LENGTH &&
        /^[+\d()\-\s.]*$/.test(phone);
}

function passwordIsAcceptable(password) {
    // Enforce this policy in Supabase Auth as well.
    return typeof password === "string" &&
        password.length >= MIN_PASSWORD_LENGTH &&
        password.length <= MAX_PASSWORD_LENGTH &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /\d/.test(password) &&
        /[^A-Za-z0-9]/.test(password);
}

function passwordErrorMessage() {
    return "Use 12–128 characters with uppercase, lowercase, a number and a symbol.";
}

function disableRecoveryForm() {
    setFormControlsDisabled(true);

    if (submitButton) {
        submitButton.disabled = true;
    }
}

async function getVerifiedUser() {
    // getUser() asks the Auth server to validate the current user.
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
        return null;
    }

    return data.user;
}

async function redirectIfAuthenticated() {
    if (!["login", "register"].includes(page)) {
        return;
    }

    try {
        const user = await getVerifiedUser();

        if (user) {
            window.location.replace("dashboard.html");
        }
    } catch (error) {
        logSafeError("Existing-session check failed", error);
    }
}

function getProfileControl(name) {
    return document.querySelector(`[data-profile-${name}]`);
}

// ============================================================
// LOGIN
// ============================================================

async function handleLogin() {
    const params = new URLSearchParams(window.location.search);

    if (params.get("verified") === "1") {
        setAuthMessage(
            message,
            "Your email has been confirmed. You can now sign in.",
            "success"
        );
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (isBusy) return;

        clearAuthMessage(message);

        const email = trimmedValue("email").toLowerCase();
        const password = rawValue("password");

        if (
            !validEmail(email) ||
            !password ||
            password.length > MAX_PASSWORD_LENGTH
        ) {
            showError("Enter a valid email address and password.");
            return;
        }

        setBusy(true, "Signing in…");

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // Confirm identity against Supabase Auth before navigating.
            const user = await getVerifiedUser();

            if (!user) {
                throw new Error("Authenticated user could not be verified.");
            }

            // safeReturnTo must remain a strict local-path allowlist.
            const destination = safeReturnTo(
                params.get("next") || "dashboard.html"
            );

            window.location.replace(destination);

        } catch (error) {
            logSafeError("Sign-in failed", error);

            showError(
                "We couldn't sign you in. Check your details, verify your email, or reset your password."
            );

        } finally {
            setBusy(false);
        }
    });
}

// ============================================================
// REGISTRATION
// ============================================================

async function handleRegistration() {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (isBusy) return;

        clearAuthMessage(message);

        const fullName = trimmedValue("full_name");
        const email = trimmedValue("email").toLowerCase();
        const phone = trimmedValue("phone");

        const password = rawValue("password");
        const confirmPassword = rawValue("confirm_password");

        const terms = field("terms");

        if (!validName(fullName)) {
            showError("Enter a valid name (2–100 characters).");
            return;
        }

        if (!validEmail(email)) {
            showError("Enter a valid email address.");
            return;
        }

        if (!validPhone(phone)) {
            showError("Enter a valid phone number.");
            return;
        }

        if (!passwordIsAcceptable(password)) {
            showError(passwordErrorMessage());
            return;
        }

        if (password !== confirmPassword) {
            showError("Your passwords do not match.");
            return;
        }

        if (!terms?.checked) {
            showError(
                "Please accept the Terms and Privacy Policy to continue."
            );
            return;
        }

        setBusy(true, "Creating account…");

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,

                options: {
                    emailRedirectTo: authPageUrl("login.html?verified=1"),

                    // These fields are profile hints only.
                    // Never use user_metadata for roles, permissions,
                    // account status, or authorization.
                    data: {
                        full_name: fullName,
                        phone: phone || null
                    }
                }
            });

            if (error) throw error;

            if (data?.session) {
                const user = await getVerifiedUser();

                if (!user) {
                    throw new Error(
                        "New account session could not be verified."
                    );
                }

                window.location.replace("dashboard.html");
                return;
            }

            form.reset();

            setAuthMessage(
                message,
                "Account request received. If the address is eligible, a verification email will arrive shortly.",
                "success"
            );

        } catch (error) {
            logSafeError("Registration failed", error);

            showError(
                "We couldn't create your account. Check your details and try again."
            );

        } finally {
            setBusy(false);
        }
    });
}

// ============================================================
// FORGOT PASSWORD
// ============================================================

async function handleForgotPassword() {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (isBusy) return;

        clearAuthMessage(message);

        const email = trimmedValue("email").toLowerCase();

        if (!validEmail(email)) {
            showError("Enter a valid email address.");
            return;
        }

        setBusy(true, "Sending link…");

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(
                email,
                {
                    redirectTo: authPageUrl("reset-password.html")
                }
            );

            if (error) throw error;

            form.reset();

            // Do not disclose whether an account exists.
            setAuthMessage(
                message,
                "If an account matches that email, a password-reset link will arrive shortly. Check your inbox and spam folder.",
                "success"
            );

        } catch (error) {
            logSafeError(
                "Password recovery request failed",
                error
            );

            showError(
                "We couldn't process that request right now. Please try again later."
            );

        } finally {
            setBusy(false);
        }
    });
}

// ============================================================
// RESET PASSWORD
// ============================================================

async function handlePasswordReset() {
    // A normal logged-in session is NOT proof of a recovery flow.
    // Only PASSWORD_RECOVERY emitted by Supabase unlocks this form.

    if (!recoverySession) {
        disableRecoveryForm();

        showError(
            "This password-reset link is invalid or has expired. Request a new link to continue."
        );
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (isBusy) return;

        clearAuthMessage(message);

        if (!recoverySession) {
            disableRecoveryForm();

            showError(
                "Request a fresh password-reset link before continuing."
            );

            return;
        }

        const password = rawValue("password");
        const confirmPassword = rawValue("confirm_password");

        if (!passwordIsAcceptable(password)) {
            showError(passwordErrorMessage());
            return;
        }

        if (password !== confirmPassword) {
            showError("Your passwords do not match.");
            return;
        }

        setBusy(true, "Updating password…");

        try {
            // Supabase validates the recovery session and enforces
            // its configured password policy.
            const { error } = await supabase.auth.updateUser({
                password
            });

            if (error) throw error;

            recoverySession = false;

            setAuthMessage(
                message,
                "Your password has been updated. Please sign in again.",
                "success"
            );

            // End the recovery session locally.
            const { error: signOutError } =
                await supabase.auth.signOut({
                    scope: "local"
                });

            if (signOutError) {
                logSafeError(
                    "Post-reset local sign-out failed",
                    signOutError
                );
            }

            window.location.replace("login.html");

        } catch (error) {
            logSafeError("Password update failed", error);

            showError(
                "We couldn't update your password. The reset link may have expired; request a fresh one and try again."
            );

        } finally {
            setBusy(false);
        }
    });
}

// ============================================================
// DASHBOARD
// ============================================================

async function handleDashboard() {
    const nameNode = getProfileControl("name");
    const emailNode = getProfileControl("email");
    const createdNode = getProfileControl("created");

    const profileForm = document.querySelector(
        "[data-profile-form]"
    );

    const dashboardMessage = document.querySelector(
        "[data-dashboard-message]"
    );

    const logoutButton = document.querySelector(
        "[data-logout]"
    );

    let user;

    try {
        user = await getVerifiedUser();

    } catch (error) {
        logSafeError(
            "Dashboard identity verification failed",
            error
        );
    }

    if (!user) {
        window.location.replace(
            `login.html?next=${encodeURIComponent("dashboard.html")}`
        );

        return;
    }

    let profile = null;

    try {
        // Safe only when profiles RLS restricts access to auth.uid().
        const { data, error } = await supabase
            .from("profiles")
            .select("full_name, phone, created_at")
            .eq("id", user.id)
            .maybeSingle();

        if (error) throw error;

        profile = data;

    } catch (error) {
        logSafeError("Profile fetch failed", error);

        setAuthMessage(
            dashboardMessage,
            "You're signed in, but profile details could not be loaded.",
            "error"
        );
    }

    const profileName =
        profile?.full_name || "Travel Qila traveller";

    if (nameNode) {
        nameNode.textContent = profileName;
    }

    if (emailNode) {
        emailNode.textContent = user.email || "";
    }

    if (createdNode) {
        createdNode.textContent = profile?.created_at
            ? new Date(profile.created_at).toLocaleDateString(
                undefined,
                {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            )
            : "—";
    }

    // --------------------------------------------------------
    // PROFILE UPDATE
    // --------------------------------------------------------

    if (profileForm) {
        const nameInput =
            profileForm.elements.namedItem("full_name");

        const phoneInput =
            profileForm.elements.namedItem("phone");

        if (nameInput) {
            nameInput.value = profile?.full_name || "";
        }

        if (phoneInput) {
            phoneInput.value = profile?.phone || "";
        }

        profileForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const saveButton = profileForm.querySelector(
                '[type="submit"]'
            );

            if (saveButton?.disabled) return;

            clearAuthMessage(dashboardMessage);

            const fullName = String(
                nameInput?.value || ""
            ).trim();

            const phone = String(
                phoneInput?.value || ""
            ).trim();

            if (!validName(fullName)) {
                setAuthMessage(
                    dashboardMessage,
                    "Enter a valid name (2–100 characters).",
                    "error"
                );

                return;
            }

            if (!validPhone(phone)) {
                setAuthMessage(
                    dashboardMessage,
                    "Enter a valid phone number.",
                    "error"
                );

                return;
            }

            if (saveButton) {
                saveButton.disabled = true;
            }

            try {
                // Re-check authenticated identity immediately before writing.
                const currentUser = await getVerifiedUser();

                if (
                    !currentUser ||
                    currentUser.id !== user.id
                ) {
                    throw new Error(
                        "The authenticated account changed."
                    );
                }

                const {
                    data: updated,
                    error
                } = await supabase
                    .from("profiles")
                    .update({
                        full_name: fullName,
                        phone: phone || null
                    })
                    .eq("id", currentUser.id)
                    .select("id, full_name, phone")
                    .maybeSingle();

                if (error) throw error;

                if (!updated) {
                    throw new Error(
                        "No profile row was updated; verify the profile trigger and RLS policy."
                    );
                }

                if (nameNode) {
                    nameNode.textContent =
                        updated.full_name || fullName;
                }

                setAuthMessage(
                    dashboardMessage,
                    "Your profile has been saved.",
                    "success"
                );

            } catch (error) {
                logSafeError(
                    "Profile update failed",
                    error
                );

                setAuthMessage(
                    dashboardMessage,
                    "We couldn't save your profile. Please try again.",
                    "error"
                );

            } finally {
                if (saveButton) {
                    saveButton.disabled = false;
                }
            }
        });
    }

    // --------------------------------------------------------
    // LOGOUT
    // --------------------------------------------------------

    logoutButton?.addEventListener("click", async () => {
        if (logoutButton.disabled) return;

        logoutButton.disabled = true;

        try {
            const { error } = await supabase.auth.signOut({
                scope: "local"
            });

            if (error) throw error;

            window.location.replace("login.html");

        } catch (error) {
            logSafeError("Sign-out failed", error);

            setAuthMessage(
                dashboardMessage,
                "Sign out failed. Please try again.",
                "error"
            );

            logoutButton.disabled = false;
        }
    });
}

// ============================================================
// INITIALIZATION
// ============================================================

try {
    if (["login", "register"].includes(page)) {
        await redirectIfAuthenticated();
    }

    if (page === "login" && form) {
        await handleLogin();
    }

    if (page === "register" && form) {
        await handleRegistration();
    }

    if (page === "forgot" && form) {
        await handleForgotPassword();
    }

    if (page === "reset" && form) {
        await handlePasswordReset();
    }

    if (page === "dashboard") {
        await handleDashboard();
    }

} catch (error) {
    logSafeError(
        "Authentication page initialization failed",
        error
    );

    if (message) {
        showError();
    }
}

// Retain a reference to the subscription for debuggability.
// Full-page navigation naturally tears it down.
void authSubscription;
