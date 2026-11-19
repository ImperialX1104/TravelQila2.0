
import {
    supabase,
    authPageUrl,
    safeReturnTo,
    setAuthMessage,
    clearAuthMessage
} from "./auth-client.js";

/*
 * TRAVEL QILA — AUTHENTICATION CONTROLLER
 *
 * Compatible with the existing data-auth-page and data-auth-form
 * HTML integration.
 *
 * Security boundaries:
 * - Supabase Auth validates identities and credentials.
 * - Database RLS controls profile access.
 * - Never expose a service-role or secret key in browser code.
 */

"use strict";

// ============================================================
// CONFIGURATION
// ============================================================

const page = document.body?.dataset?.authPage || "";
const form = document.querySelector("[data-auth-form]");
const message = document.querySelector("[data-auth-message]");
const submitButton = form?.querySelector('[type="submit"]');

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 25;

const ORIGINAL_SUBMIT_LABEL =
    submitButton?.textContent?.trim() || "Continue";

let isBusy = false;
let recoverySession = false;
let savingProfile = false;

const originalDisabledStates = new WeakMap();

// ============================================================
// SAFE ERROR HANDLING
// ============================================================

function logSafeError(context, error) {
    console.error(`[Travel Qila] ${context}`, {
        name: error?.name || "UnknownError",
        message: error?.message || String(error ?? "Unknown error"),
        code: error?.code ?? null,
        status: error?.status ?? error?.statusCode ?? null
    });
}

function showError(text) {
    setAuthMessage(
        message,
        text || "We couldn't complete that request. Please try again.",
        "error"
    );
}

function showSuccess(text) {
    setAuthMessage(message, text, "success");
}

// ============================================================
// FORM UTILITIES
// ============================================================

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

function shouldLockControls() {
    return isBusy || (page === "reset" && !recoverySession);
}

function updateFormLock() {
    if (!form) return;

    const locked = shouldLockControls();

    form.querySelectorAll(
        "input, select, textarea, button"
    ).forEach((control) => {
        if (!originalDisabledStates.has(control)) {
            originalDisabledStates.set(
                control,
                control.disabled
            );
        }

        control.disabled =
            locked || originalDisabledStates.get(control);
    });

    form.setAttribute("aria-busy", String(isBusy));
}

function setBusy(busy, label = "Please wait…") {
    isBusy = busy;

    if (submitButton) {
        submitButton.textContent = busy
            ? label
            : ORIGINAL_SUBMIT_LABEL;
    }

    updateFormLock();
}

function showFormError(text) {
    showError(text);
}

function clearFormMessage() {
    clearAuthMessage(message);
}

// ============================================================
// VALIDATION
// ============================================================

function validEmail(email) {
    return (
        typeof email === "string" &&
        email.length <= 254 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );
}

function validName(name) {
    return (
        typeof name === "string" &&
        name.length >= 2 &&
        name.length <= MAX_NAME_LENGTH &&
        !/[\u0000-\u001F\u007F]/.test(name)
    );
}

function validPhone(phone) {
    return (
        typeof phone === "string" &&
        phone.length <= MAX_PHONE_LENGTH &&
        /^[+\d()\-\s.]*$/.test(phone)
    );
}

function validPassword(password) {
    return (
        typeof password === "string" &&
        password.length >= MIN_PASSWORD_LENGTH &&
        password.length <= MAX_PASSWORD_LENGTH &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /\d/.test(password) &&
        /[^A-Za-z0-9]/.test(password)
    );
}

function passwordRequirementsMessage() {
    return "Use 12–128 characters with uppercase, lowercase, a number and a symbol.";
}

// ============================================================
// AUTH STATE LISTENER
// ============================================================

const {
    data: { subscription }
} = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" && session?.user) {
        recoverySession = true;

        if (page === "reset") {
            updateFormLock();
            clearFormMessage();
        }
    }

    if (event === "SIGNED_OUT") {
        recoverySession = false;

        if (page === "reset") {
            updateFormLock();
        }
    }
});

// ============================================================
// SESSION HELPERS
// ============================================================

/*
 * Never call getUser() without first establishing that a
 * session exists. A missing session is a normal logged-out state.
 */
async function getVerifiedUser() {
    const {
        data: sessionData,
        error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
        throw sessionError;
    }

    if (!sessionData?.session) {
        return null;
    }

    const {
        data: userData,
        error: userError
    } = await supabase.auth.getUser();

    if (userError) {
        throw userError;
    }

    return userData?.user || null;
}

/*
 * A local session is sufficient to decide whether to redirect
 * away from login/register. The dashboard independently verifies
 * the identity with getUser().
 */
async function redirectIfAuthenticated() {
    if (!["login", "register"].includes(page)) {
        return;
    }

    try {
        const {
            data,
            error
        } = await supabase.auth.getSession();

        if (error) {
            throw error;
        }

        if (data?.session?.user) {
            window.location.replace("dashboard.html");
        }
    } catch (error) {
        logSafeError(
            "Existing-session check failed",
            error
        );
    }
}

// ============================================================
// LOGIN
// ============================================================

function handleLogin() {
    const params = new URLSearchParams(
        window.location.search
    );

    if (params.get("verified") === "1") {
        showSuccess(
            "Your email has been confirmed. You can now sign in."
        );
    } else if (params.get("password_updated") === "1") {
        showSuccess(
            "Your password has been updated. Please sign in."
        );
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (isBusy) return;

        clearFormMessage();

        const email = trimmedValue("email").toLowerCase();
        const password = rawValue("password");

        if (
            !validEmail(email) ||
            !password ||
            password.length > MAX_PASSWORD_LENGTH
        ) {
            showFormError(
                "Enter a valid email address and password."
            );
            return;
        }

        setBusy(true, "Signing in…");

        try {
            const {
                data,
                error
            } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                throw error;
            }

            if (!data?.session || !data?.user) {
                throw new globalThis.Error(
                    "Supabase returned no authenticated session after sign-in."
                );
            }

            const destination = safeReturnTo(
                params.get("next") || "dashboard.html"
            );

            window.location.replace(destination);

        } catch (error) {
            logSafeError("Sign-in failed", error);

            showFormError(
                "We couldn't sign you in. Check your credentials, verify your email, or reset your password."
            );

        } finally {
            setBusy(false);
        }
    });
}

// ============================================================
// REGISTRATION
// ============================================================

function handleRegistration() {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (isBusy) return;

        clearFormMessage();

        const fullName = trimmedValue("full_name");
        const email = trimmedValue("email").toLowerCase();
        const phone = trimmedValue("phone");

        const password = rawValue("password");
        const confirmPassword = rawValue("confirm_password");

        const terms = field("terms");

        if (!validName(fullName)) {
            showFormError(
                "Enter a valid name (2–100 characters)."
            );
            return;
        }

        if (!validEmail(email)) {
            showFormError("Enter a valid email address.");
            return;
        }

        if (!validPhone(phone)) {
            showFormError("Enter a valid phone number.");
            return;
        }

        if (!validPassword(password)) {
            showFormError(passwordRequirementsMessage());
            return;
        }

        if (password !== confirmPassword) {
            showFormError("Your passwords do not match.");
            return;
        }

        if (!terms?.checked) {
            showFormError(
                "Please accept the Terms and Privacy Policy to continue."
            );
            return;
        }

        setBusy(true, "Creating account…");

        try {
            const {
                data,
                error
            } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: authPageUrl(
                        "login.html?verified=1"
                    ),
                    data: {
                        full_name: fullName,
                        phone: phone || null
                    }
                }
            });

            if (error) {
                throw error;
            }

            if (!data?.user) {
                throw new globalThis.Error(
                    "Registration returned no user and no Auth error."
                );
            }

            /*
             * Signup has two legitimate success outcomes:
             *
             * A. Session returned:
             *    Email confirmation is not required, or the user
             *    was authenticated immediately.
             *
             * B. No session returned:
             *    Email confirmation is required.
             *
             * Neither outcome requires an immediate getUser() call.
             */

            if (data.session) {
                window.location.replace("dashboard.html");
                return;
            }

            form.reset();

            showSuccess(
                "Your account has been created. Please check your email for the verification link before signing in."
            );

        } catch (error) {
            logSafeError(
                "Registration request failed",
                error
            );

            showFormError(
                "We couldn't create your account. Please check your details and try again."
            );

        } finally {
            setBusy(false);
        }
    });
}

// ============================================================
// FORGOT PASSWORD
// ============================================================

function handleForgotPassword() {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (isBusy) return;

        clearFormMessage();

        const email = trimmedValue("email").toLowerCase();

        if (!validEmail(email)) {
            showFormError("Enter a valid email address.");
            return;
        }

        setBusy(true, "Sending link…");

        try {
            const {
                error
            } = await supabase.auth.resetPasswordForEmail(
                email,
                {
                    redirectTo: authPageUrl(
                        "reset-password.html"
                    )
                }
            );

            if (error) {
                throw error;
            }

            form.reset();

            showSuccess(
                "If an account matches that email, a password-reset link will arrive shortly. Check your inbox and spam folder."
            );

        } catch (error) {
            logSafeError(
                "Password recovery request failed",
                error
            );

            showFormError(
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

function handlePasswordReset() {
    /*
     * Supabase processes the recovery callback and emits
     * PASSWORD_RECOVERY. A normal logged-in session is not enough.
     */

    if (!recoverySession) {
        updateFormLock();

        showFormError(
            "This password-reset link is invalid or has expired. Request a new link to continue."
        );
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (isBusy) return;

        clearFormMessage();

        if (!recoverySession) {
            showFormError(
                "Request a fresh password-reset link before continuing."
            );
            return;
        }

        const password = rawValue("password");
        const confirmPassword = rawValue("confirm_password");

        if (!validPassword(password)) {
            showFormError(passwordRequirementsMessage());
            return;
        }

        if (password !== confirmPassword) {
            showFormError("Your passwords do not match.");
            return;
        }

        setBusy(true, "Updating password…");

        try {
            const {
                error
            } = await supabase.auth.updateUser({
                password
            });

            if (error) {
                throw error;
            }

            recoverySession = false;

            const {
                error: signOutError
            } = await supabase.auth.signOut({
                scope: "local"
            });

            if (signOutError) {
                logSafeError(
                    "Post-reset local sign-out failed",
                    signOutError
                );
            }

            window.location.replace(
                "login.html?password_updated=1"
            );

        } catch (error) {
            logSafeError(
                "Password update failed",
                error
            );

            showFormError(
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

function getProfileControl(name) {
    return document.querySelector(
        `[data-profile-${name}]`
    );
}

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

    let user = null;

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
        const {
            data,
            error
        } = await supabase
            .from("profiles")
            .select("full_name, phone, created_at")
            .eq("id", user.id)
            .maybeSingle();

        if (error) {
            throw error;
        }

        profile = data;

    } catch (error) {
        logSafeError("Profile fetch failed", error);

        setAuthMessage(
            dashboardMessage,
            "You're signed in, but your profile details could not be loaded.",
            "error"
        );
    }

    if (nameNode) {
        nameNode.textContent =
            profile?.full_name || "Travel Qila traveller";
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

        const saveButton = profileForm.querySelector(
            '[type="submit"]'
        );

        if (nameInput) {
            nameInput.value = profile?.full_name || "";
        }

        if (phoneInput) {
            phoneInput.value = profile?.phone || "";
        }

        profileForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (savingProfile) return;

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

            savingProfile = true;

            const wasDisabled = saveButton?.disabled;

            if (saveButton) {
                saveButton.disabled = true;
            }

            try {
                const currentUser = await getVerifiedUser();

                if (
                    !currentUser ||
                    currentUser.id !== user.id
                ) {
                    throw new globalThis.Error(
                        "Authenticated identity changed during profile update."
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

                if (error) {
                    throw error;
                }

                if (!updated) {
                    throw new globalThis.Error(
                        "No profile row was updated. Check profile creation and RLS."
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
                savingProfile = false;

                if (saveButton) {
                    saveButton.disabled =
                        Boolean(wasDisabled);
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
            const {
                error
            } = await supabase.auth.signOut({
                scope: "local"
            });

            if (error) {
                throw error;
            }

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
// PAGE INITIALIZATION
// ============================================================

async function initializeAuthPage() {
    if (!page) {
        console.error(
            "[Travel Qila] Missing data-auth-page attribute."
        );
        return;
    }

    if (
        ["login", "register", "forgot", "reset"].includes(page) &&
        !form
    ) {
        console.error(
            `[Travel Qila] Authentication form not found on ${page}.`
        );
        return;
    }

    if (["login", "register"].includes(page)) {
        await redirectIfAuthenticated();
    }

    switch (page) {
        case "login":
            handleLogin();
            break;

        case "register":
            handleRegistration();
            break;

        case "forgot":
            handleForgotPassword();
            break;

        case "reset":
            /*
             * Force Auth URL/session initialization before deciding
             * whether the recovery form should be available.
             */
            try {
                const {
                    error
                } = await supabase.auth.getSession();

                if (error) {
                    throw error;
                }
            } catch (error) {
                logSafeError(
                    "Recovery session initialization failed",
                    error
                );
            }

            handlePasswordReset();
            break;

        case "dashboard":
            await handleDashboard();
            break;

        default:
            console.warn(
                `[Travel Qila] Unknown authentication page: ${page}`
            );
    }
}

try {
    await initializeAuthPage();
} catch (error) {
    logSafeError(
        "Authentication page initialization failed",
        error
    );

    if (message) {
        showError(
            "This page could not initialize correctly. Please refresh and try again."
        );
    }
}

// Keep the auth subscription active for this page's lifetime.
void subscription;
