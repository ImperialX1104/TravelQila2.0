import {
    supabase,
    authPageUrl,
    setAuthMessage,
    clearAuthMessage
} from "./auth-client.js";

"use strict";

const page = document.body.dataset.authPage;
const form = document.querySelector("[data-auth-form]");
const message = document.querySelector("[data-auth-message]");

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_BYTES = 72;

function showMessage(text, type = "info") {
    setAuthMessage(message, text, type);
}

function getField(name) {
    return form?.elements.namedItem(name);
}

function getPasswordBytes(password) {
    return new TextEncoder().encode(password).length;
}

function validatePassword(password) {
    if (password.length < MIN_PASSWORD_LENGTH) {
        return "Password must contain at least 12 characters.";
    }
    if (getPasswordBytes(password) > MAX_PASSWORD_BYTES) {
        return "Password is too long. Use a shorter password.";
    }
    if (!/[A-Z]/.test(password)) {
        return "Include at least one uppercase letter.";
    }
    if (!/[a-z]/.test(password)) {
        return "Include at least one lowercase letter.";
    }
    if (!/[0-9]/.test(password)) {
        return "Include at least one number.";
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return "Include at least one special character.";
    }
    return null;
}

// Never display arbitrary provider/server messages to end users.
function getSafeError(error) {
    const code = error?.code || error?.name || "";
    const messageText = error?.message || "";

    const knownErrors = {
        invalid_credentials: "Incorrect email or password.",
        email_not_confirmed: "Please verify your email address before signing in.",
        user_not_found: "Incorrect email or password.",
        weak_password: "Your password does not meet the security requirements.",
        over_email_send_rate_limit: "Too many email requests. Please try again later.",
        over_request_rate_limit: "Too many attempts. Please wait before trying again.",
        otp_expired: "This password reset link has expired. Request a new one.",
        flow_state_expired: "This password reset link has expired. Request a new one.",
        validation_failed: "Please check your details and try again."
    };

    if (knownErrors[code]) return knownErrors[code];
    if (/invalid login credentials/i.test(messageText)) return "Incorrect email or password.";
    if (/email not confirmed/i.test(messageText)) return "Please verify your email address before signing in.";
    if (/expired|invalid.*(token|code)|token.*(expired|invalid)/i.test(messageText)) {
        return "This link is invalid or has expired. Please request a new one.";
    }
    return "We couldn't complete your request. Please try again.";
}

function setSubmitting(isSubmitting) {
    if (!form) return;
    const button = form.querySelector('button[type="submit"]');
    if (!button) return;

    if (isSubmitting) {
        button.dataset.originalText = button.innerHTML;
        button.disabled = true;
        button.textContent = "Please wait...";
        form.setAttribute("aria-busy", "true");
    } else {
        button.disabled = false;
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
            delete button.dataset.originalText;
        }
        form.removeAttribute("aria-busy");
    }
}

async function handleLogin(event) {
    event.preventDefault();
    clearAuthMessage(message);

    const email = getField("email")?.value.trim();
    const password = getField("password")?.value;
    if (!email || !password) {
        showMessage("Please enter your email and password.", "error");
        return;
    }

    setSubmitting(true);
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.session || !data.user) throw new Error("Authentication could not be completed.");

        window.location.replace(authPageUrl("dashboard.html"));
    } catch (error) {
        showMessage(getSafeError(error), "error");
    } finally {
        setSubmitting(false);
    }
}

const SOCIAL_PROVIDERS = new Set(["google", "apple"]);

async function handleSocialLogin(event) {
    const button = event.currentTarget;
    const provider = button.dataset.socialLogin;
    if (!SOCIAL_PROVIDERS.has(provider)) return;

    clearAuthMessage(message);
    const originalContent = button.innerHTML;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = provider === "google" ? "Connecting to Google..." : "Connecting to Apple...";

    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: authPageUrl("dashboard.html") }
        });
        if (error) throw error;
        // Supabase owns the OAuth redirect.
    } catch (error) {
        showMessage(getSafeError(error), "error");
        button.disabled = false;
        button.removeAttribute("aria-busy");
        button.innerHTML = originalContent;
    }
}

async function handleRegistration(event) {
    event.preventDefault();
    clearAuthMessage(message);

    const fullName = getField("full_name")?.value.trim();
    const email = getField("email")?.value.trim();
    const phone = getField("phone")?.value.trim() || "";
    const password = getField("password")?.value;
    const confirmPassword = getField("confirm_password")?.value;
    const termsAccepted = getField("terms")?.checked;

    if (!fullName || fullName.length < 2) {
        showMessage("Please enter your full name.", "error");
        return;
    }
    if (!email || !password) {
        showMessage("Please complete all required fields.", "error");
        return;
    }
    if (password !== confirmPassword) {
        showMessage("Your passwords do not match.", "error");
        return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
        showMessage(passwordError, "error");
        return;
    }
    if (!termsAccepted) {
        showMessage("Please accept the Terms and Privacy Policy.", "error");
        return;
    }

    setSubmitting(true);
    try {
        const verificationUrl = new URL(authPageUrl("login.html"));
        verificationUrl.searchParams.set("verified", "1");

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: verificationUrl.href,
                data: { full_name: fullName, phone }
            }
        });
        if (error) throw error;

        if (data.session) {
            showMessage("Your account has been created successfully.", "success");
            window.location.replace(authPageUrl("dashboard.html"));
            return;
        }

        showMessage(
            "If registration was successful, a verification email will arrive shortly. Check your inbox and spam folder.",
            "success"
        );
        form.reset();
    } catch (error) {
        showMessage(getSafeError(error), "error");
    } finally {
        setSubmitting(false);
    }
}

async function handleForgotPassword(event) {
    event.preventDefault();
    clearAuthMessage(message);

    const email = getField("email")?.value.trim();
    if (!email) {
        showMessage("Enter the email address linked to your account.", "error");
        return;
    }

    setSubmitting(true);
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: authPageUrl("reset-password.html")
        });
        if (error) throw error;

        // Keep the response generic to avoid disclosing whether an account exists.
        showMessage(
            "If an account exists for that email, a password reset link will arrive shortly. Check your inbox and spam folder.",
            "success"
        );
        form.reset();
    } catch (error) {
        showMessage(getSafeError(error), "error");
    } finally {
        setSubmitting(false);
    }
}

async function initializePasswordReset() {
    setSubmitting(true);
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!data.session) {
            showMessage(
                "This reset link is invalid or has expired. Request a new password reset link.",
                "error"
            );
            return false;
        }
        return true;
    } catch (error) {
        showMessage(getSafeError(error), "error");
        return false;
    } finally {
        setSubmitting(false);
    }
}

async function handlePasswordReset(event) {
    event.preventDefault();
    clearAuthMessage(message);

    const password = getField("password")?.value;
    const confirmPassword = getField("confirm_password")?.value;

    if (!password || password !== confirmPassword) {
        showMessage("Your passwords do not match.", "error");
        return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
        showMessage(passwordError, "error");
        return;
    }

    setSubmitting(true);
    try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) {
            throw new Error("The password reset session is missing or expired.");
        }

        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;

        showMessage("Your password has been updated. You can now sign in with your new password.", "success");
        form.reset();

        // End the recovery session after a successful password change.
        await supabase.auth.signOut();
        window.setTimeout(() => {
            window.location.replace(authPageUrl("login.html"));
        }, 1200);
    } catch (error) {
        showMessage(getSafeError(error), "error");
    } finally {
        setSubmitting(false);
    }
}

function handleVerificationMessage() {
    if (page !== "login") return;
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.get("verified") !== "1") return;

    showMessage("Email verification completed. You can now sign in.", "success");
    currentUrl.searchParams.delete("verified");
    window.history.replaceState({}, document.title, currentUrl.pathname + currentUrl.search + currentUrl.hash);
}

if (form && page === "login") form.addEventListener("submit", handleLogin);
if (form && page === "register") form.addEventListener("submit", handleRegistration);
if (form && page === "forgot") form.addEventListener("submit", handleForgotPassword);
if (form && page === "reset") {
    form.addEventListener("submit", handlePasswordReset);
    initializePasswordReset();
}

if (page === "login") {
    document.querySelectorAll("[data-social-login]").forEach((button) => {
        button.addEventListener("click", handleSocialLogin);
    });
}

handleVerificationMessage();
