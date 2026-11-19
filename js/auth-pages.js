
import {
    supabase,
    authPageUrl,
    safeReturnTo,
    setAuthMessage,
    clearAuthMessage
} from "./auth-client.js";

/*
 * Travel Qila — Authentication Controller
 *
 * Browser-side validation improves UX; it is not an authorization boundary.
 * Supabase Auth enforces identity and password policy.
 * RLS enforces all database authorization.
 * Never expose a service-role or secret key in browser code.
 */

const page = document.body?.dataset?.authPage || "";
const form = document.querySelector("[data-auth-form]");
const message = document.querySelector("[data-auth-message]");
const submitButton = form?.querySelector('[type="submit"]');

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 25;

const GENERIC_AUTH_ERROR =
    "We couldn't complete that request. Please try again later.";

let isBusy = false;
let recoverySession = false;

const originalDisabledState = new WeakMap();
const originalSubmitLabel = submitButton?.textContent?.trim() || "Continue";

// ------------------------------------------------------------
// SAFE DIAGNOSTICS
// ------------------------------------------------------------

function logSafeError(context, error) {
    // Never log passwords, tokens, session objects, or form contents.
    console.error(`[Travel Qila] ${context}`, {
        name: error?.name || "Error",
        message: error?.message || "No error message supplied",
        code: error?.code || null,
        status: error?.status || error?.statusCode || null
    });
}

function showError(text = GENERIC_AUTH_ERROR) {
    setAuthMessage(message, text, "error");
}

function showSuccess(text) {
    setAuthMessage(message, text, "success");
}

// ------------------------------------------------------------
// FORM HELPERS
// ------------------------------------------------------------

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

function controlsShouldBeDisabled() {
    return isBusy || (page === "reset" && !recoverySession);
}

function setFormControlsDisabled() {
    if (!form) return;

    const disabled = controlsShouldBeDisabled();

    form.querySelectorAll("input, select, textarea, button").forEach((control) => {
        if (!originalDisabledState.has(control)) {
            originalDisabledState.set(control, control.disabled);
        }

        control.disabled =
            disabled || originalDisabledState.get(control);
    });
}

function setBusy(busy, label = "Please wait…") {
    isBusy = busy;

    if (submitButton) {
        submitButton.textContent = busy
            ? label
            : originalSubmitLabel;
    }

    form?.setAttribute("aria-busy", String(busy));
    setFormControlsDisabled();
}

function disableRecoveryForm() {
    recoverySession = false;
    setFormControlsDisabled();
}

// ------------------------------------------------------------
// VALIDATION
// ------------------------------------------------------------

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

function passwordIsAcceptable(password) {
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

function passwordErrorMessage() {
    return "Use 12–128 characters with uppercase, lowercase, a number and a symbol.";
}

// ------------------------------------------------------------
// AUTH STATE EVENTS
// ------------------------------------------------------------

// Register before page initialization so URL recovery processing
// cannot emit PASSWORD_RECOVERY before our listener exists.
const {
    data: { subscription }
} = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" && session?.user) {
        recoverySession = true;

        if (page === "reset") {
            setFormControlsDisabled();
            clearAuthMessage(message);
        }
    }

    if (event === "SIGNED_OUT") {
        recoverySession = false;

        if (page === "reset") {
            setFormControlsDisabled();
        }
    }
});

// ------------------------------------------------------------
// AUTHENTICATED USER CHECK
// ------------------------------------------------------------

async function getVerifiedUser() {
    const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

    if (sessionError) {
        throw sessionError;
    }

    if (!sessionData?.session) {
        return null;
    }

    const { data, error } = await supabase.auth.getUser();

    if (error) {
        throw error;
    }

    return data?.user || null;
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
        logSafeError("Existing-session verification failed", error);
    }
}

// ------------------------------------------------------------
// LOGIN
// ------------------------------------------------------------

function handleLogin() {
    const params = new URLSearchParams(window.location.search);

    if (params.get("verified") === "1") {
        showSuccess("Your email has been confirmed. You can now sign in.");
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
            const { data, error } =
                await supabase.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) throw error;

            // The Auth response itself must contain a valid session.
            if (!data?.session || !data?.user) {
                throw new Error(
                    "Authentication succeeded without a usable session."
                );
            }

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

// ------------------------------------------------------------
// REGISTRATION
// ------------------------------------------------------------

function handleRegistration() {
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
                throw new Error(
                    "Supabase returned no user after registration."
                );
            }

            /*
             * IMPORTANT:
             *
             * A successful signup may return:
             * - user + session: immediate authenticated signup
             * - user + no session: email confirmation required
             *
             * Both are successful signup outcomes.
             * Do not call getUser() to decide whether signup succeeded.
             */

            if (data.session) {
                window.location.replace("dashboard.html");
                return;
            }

            form.reset();

            showSuccess(
                "Your account request has been received. Please check your email for the verification link before signing in."
            );

        } catch (error) {
            logSafeError("Registration request failed", error);

            showError(
                "We couldn't create your account. Please check your details and try again."
            );

        } finally {
            setBusy(false);
        }
    });
}

// ------------------------------------------------------------
// FORGOT PASSWORD
// ------------------------------------------------------------

function handleForgotPassword() {
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
            const { error } =
                await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: authPageUrl("reset-password.html")
                });

            if (error) throw error;

            form.reset();

            showSuccess(
                "If an account matches that email, a password-reset link will arrive shortly. Check your inbox and spam folder."
            );

        } catch (error) {
            logSafeError("Password recovery request failed", error);

            showError(
                "We couldn't process that request right now. Please try again later."
            );

        } finally {
            setBusy(false);
        }
    });
}

// ------------------------------------------------------------
// RESET PASSWORD
// ------------------------------------------------------------

function handlePasswordReset() {
    // A normal authenticated session does not unlock this page.
    // Only the PASSWORD_RECOVERY event establishes recovery state.

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
            const { error } = await supabase.auth.updateUser({
                password
            });

            if (error) throw error;

            recoverySession = false;

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

// ------------------------------------------------------------
// DASHBOARD
// ------------------------------------------------------------

function getProfileControl(name) {
    return document.querySelector(`[data-profile-${name}]`);
}

async function handleDashboard() {
    const nameNode = getProfileControl("name");
    const emailNode = getProfileControl("email");
    const createdNode = getProfileControl("created");

    const profileForm = document.querySelector("[data-profile-form]");
    const dashboardMessage = document.querySelector(
        "[data-dashboard-message]"
    );
    const logoutButton = document.querySelector("[data-logout]");

    let user;

    try {
        user = await getVerifiedUser();
    } catch (error) {
        logSafeError("Dashboard identity verification failed", error);
    }

    if (!user) {
        window.location.replace(
            `login.html?next=${encodeURIComponent("dashboard.html")}`
        );
        return;
    }

    let profile = null;

    try {
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

        if (nameInput) {
            nameInput.value = profile?.full_name || "";
        }

        if (phoneInput) {
            phoneInput.value = profile?.phone || "";
        }

        let savingProfile = false;

        profileForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (savingProfile) return;

            clearAuthMessage(dashboardMessage);

            const fullName = String(nameInput?.value || "").trim();
            const phone = String(phoneInput?.value || "").trim();

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

            const saveButton = profileForm.querySelector(
                '[type="submit"]'
            );

            if (saveButton) saveButton.disabled = true;

            try {
                const currentUser = await getVerifiedUser();

                if (!currentUser || currentUser.id !== user.id) {
                    throw new Error(
                        "Authenticated identity changed during profile update."
                    );
                }

                const { data: updated, error } = await supabase
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
                        "No profile row was updated. Check profile creation and RLS."
                    );
                }

                if (nameNode) {
                    nameNode.textContent =
                        updated.full_name || fullName;
                }

                showDashboardMessage(
                    dashboardMessage,
                    "Your profile has been saved.",
                    "success"
                );

            } catch (error) {
                logSafeError("Profile update failed", error);

                setAuthMessage(
                    dashboardMessage,
                    "We couldn't save your profile. Please try again.",
                    "error"
                );

            } finally {
                savingProfile = false;

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

function showDashboardMessage(target, text, type) {
    setAuthMessage(target, text, type);
}

// ------------------------------------------------------------
// INITIALIZATION
// ------------------------------------------------------------

async function initializeAuthPage() {
    if (!page) {
        console.warn(
            "[Travel Qila] Missing data-auth-page attribute."
        );
        return;
    }

    if (["login", "register", "forgot", "reset"].includes(page) && !form) {
        console.error(
            `[Travel Qila] Missing authentication form on ${page} page.`
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
    logSafeError("Authentication page initialization failed", error);

    if (message) {
        showError();
    }
}

// Retain the subscription for the lifetime of this page.
void subscription;
