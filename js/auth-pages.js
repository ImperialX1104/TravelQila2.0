import { supabase, authPageUrl, safeReturnTo, setAuthMessage, clearAuthMessage } from "./auth-client.js";

const page = document.body.dataset.authPage;
const form = document.querySelector("[data-auth-form]");
const message = document.querySelector("[data-auth-message]");
const submitButton = form?.querySelector('[type="submit"]');

function setBusy(busy, label) {
    if (!submitButton) return;
    submitButton.disabled = busy;
    submitButton.dataset.originalLabel ||= submitButton.textContent.trim();
    submitButton.textContent = busy ? label : submitButton.dataset.originalLabel;
    form?.setAttribute("aria-busy", String(busy));
}

function passwordIsStrong(password) {
    return password.length >= 12 &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /\d/.test(password) &&
        /[^A-Za-z0-9]/.test(password);
}

function value(name) {
    return String(form?.elements.namedItem(name)?.value || "").trim();
}

async function redirectIfSignedIn() {
    const { data, error } = await supabase.auth.getSession();
    if (!error && data.session && ["login", "register"].includes(page)) {
        window.location.replace("dashboard.html");
    }
}

if (["login", "register"].includes(page)) {
    await redirectIfSignedIn();
}

if (page === "login" && form) {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "1") {
        setAuthMessage(message, "Your email has been confirmed. You can now sign in.", "success");
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearAuthMessage(message);
        const email = value("email").toLowerCase();
        const password = form.elements.namedItem("password").value;

        if (!email || !password) {
            setAuthMessage(message, "Enter your email address and password.", "error");
            return;
        }

        setBusy(true, "Signing in…");
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            const requested = safeReturnTo(params.get("next") || "dashboard.html");
            window.location.replace(requested);
        } catch (error) {
            console.error("Travel Qila sign-in failed:", error);
            setAuthMessage(message, "We couldn't sign you in. Check your details, verify your email, or reset your password.", "error");
        } finally {
            setBusy(false);
        }
    });
}

if (page === "register" && form) {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearAuthMessage(message);

        const fullName = value("full_name");
        const email = value("email").toLowerCase();
        const phone = value("phone");
        const password = form.elements.namedItem("password").value;
        const confirmPassword = form.elements.namedItem("confirm_password").value;
        const accepted = form.elements.namedItem("terms").checked;

        if (fullName.length < 2) {
            setAuthMessage(message, "Please enter your full name.", "error");
            return;
        }
        if (!passwordIsStrong(password)) {
            setAuthMessage(message, "Use at least 12 characters with uppercase, lowercase, a number and a symbol.", "error");
            return;
        }
        if (password !== confirmPassword) {
            setAuthMessage(message, "Your passwords do not match.", "error");
            return;
        }
        if (!accepted) {
            setAuthMessage(message, "Please accept the Terms and Privacy Policy to continue.", "error");
            return;
        }

        setBusy(true, "Creating account…");
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: authPageUrl("login.html?verified=1"),
                    data: { full_name: fullName, phone }
                }
            });
            if (error) throw error;

            if (data.session) {
                window.location.replace("dashboard.html");
                return;
            }
            form.reset();
            setAuthMessage(message, "Account request received. Check your inbox for the verification email before signing in.", "success");
        } catch (error) {
            console.error("Travel Qila registration failed:", error);
            setAuthMessage(message, "We couldn't create your account. Check your details and try again.", "error");
        } finally {
            setBusy(false);
        }
    });
}

if (page === "forgot" && form) {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearAuthMessage(message);
        const email = value("email").toLowerCase();

        if (!email) {
            setAuthMessage(message, "Enter the email address associated with your account.", "error");
            return;
        }

        setBusy(true, "Sending link…");
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: authPageUrl("reset-password.html")
            });
            if (error) throw error;

            form.reset();
            // Keep the response generic to avoid disclosing whether an account exists.
            setAuthMessage(message, "If an account matches that email, a password-reset link will arrive shortly. Please check your inbox and spam folder.", "success");
        } catch (error) {
            console.error("Travel Qila password recovery request failed:", error);
            setAuthMessage(message, "We couldn't process that request right now. Please try again later.", "error");
        } finally {
            setBusy(false);
        }
    });
}

if (page === "reset" && form) {
    const { data } = await supabase.auth.getSession();
    let recoveryReady = Boolean(data.session);

    if (!recoveryReady) {
        setAuthMessage(message, "This password-reset link is invalid or has expired. Request a new link to continue.", "error");
        form.querySelectorAll("input, button").forEach((control) => { control.disabled = true; });
    }

    supabase.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
            recoveryReady = true;
            form.querySelectorAll("input, button").forEach((control) => { control.disabled = false; });
            clearAuthMessage(message);
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearAuthMessage(message);
        if (!recoveryReady) {
            setAuthMessage(message, "Request a fresh password-reset link before continuing.", "error");
            return;
        }

        const password = form.elements.namedItem("password").value;
        const confirmPassword = form.elements.namedItem("confirm_password").value;
        if (!passwordIsStrong(password)) {
            setAuthMessage(message, "Use at least 12 characters with uppercase, lowercase, a number and a symbol.", "error");
            return;
        }
        if (password !== confirmPassword) {
            setAuthMessage(message, "Your passwords do not match.", "error");
            return;
        }

        setBusy(true, "Updating password…");
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setAuthMessage(message, "Your password has been updated. Redirecting to your account…", "success");
            window.setTimeout(() => window.location.replace("dashboard.html"), 900);
        } catch (error) {
            console.error("Travel Qila password update failed:", error);
            setAuthMessage(message, "We couldn't update your password. Request a fresh reset link and try again.", "error");
        } finally {
            setBusy(false);
        }
    });
}

if (page === "dashboard") {
    const nameNode = document.querySelector("[data-profile-name]");
    const emailNode = document.querySelector("[data-profile-email]");
    const createdNode = document.querySelector("[data-profile-created]");
    const profileForm = document.querySelector("[data-profile-form]");
    const dashboardMessage = document.querySelector("[data-dashboard-message]");
    const logoutButton = document.querySelector("[data-logout]");

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
        const next = encodeURIComponent("dashboard.html");
        window.location.replace(`login.html?next=${next}`);
    } else {
        const user = userData.user;
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("full_name, phone, created_at")
            .eq("id", user.id)
            .maybeSingle();

        nameNode && (nameNode.textContent = profile?.full_name || user.user_metadata?.full_name || "Travel Qila traveller");
        emailNode && (emailNode.textContent = user.email || "");
        createdNode && (createdNode.textContent = profile?.created_at
            ? new Date(profile.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
            : "—");

        if (profileError) {
            console.error("Travel Qila profile fetch failed:", profileError);
            setAuthMessage(dashboardMessage, "Your account is signed in, but profile details could not be loaded. Check that supabase/schema.sql has been applied.", "error");
        }

        if (profileForm) {
            profileForm.elements.namedItem("full_name").value = profile?.full_name || user.user_metadata?.full_name || "";
            profileForm.elements.namedItem("phone").value = profile?.phone || user.user_metadata?.phone || "";

            profileForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                clearAuthMessage(dashboardMessage);
                const fullName = String(profileForm.elements.namedItem("full_name").value).trim();
                const phone = String(profileForm.elements.namedItem("phone").value).trim();
                if (fullName.length < 2) {
                    setAuthMessage(dashboardMessage, "Please enter your full name.", "error");
                    return;
                }

                const save = profileForm.querySelector('[type="submit"]');
                save.disabled = true;
                try {
                    const { error } = await supabase.from("profiles").update({
                        full_name: fullName,
                        phone: phone || null
                    }).eq("id", user.id);
                    if (error) throw error;
                    const { error: metadataError } = await supabase.auth.updateUser({
                        data: { full_name: fullName, phone }
                    });
                    if (metadataError) console.warn("Profile metadata sync warning:", metadataError);
                    if (nameNode) nameNode.textContent = fullName;
                    setAuthMessage(dashboardMessage, "Your profile has been saved.", "success");
                } catch (error) {
                    console.error("Travel Qila profile update failed:", error);
                    setAuthMessage(dashboardMessage, "We couldn't save your profile. Confirm the database setup and try again.", "error");
                } finally {
                    save.disabled = false;
                }
            });
        }
    }

    logoutButton?.addEventListener("click", async () => {
        logoutButton.disabled = true;
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Travel Qila sign-out failed:", error);
            setAuthMessage(dashboardMessage, "Sign out failed. Please try again.", "error");
            logoutButton.disabled = false;
            return;
        }
        window.location.replace("login.html");
    });
}
