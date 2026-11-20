
import {
    supabase,
    authPageUrl,
    setAuthMessage,
    clearAuthMessage
} from "./auth-client.js";

"use strict";

// =====================================================
// 1. ELEMENT REFERENCES
// =====================================================

const message = document.querySelector("[data-dashboard-message]");
const profileForm = document.querySelector("[data-profile-form]");
const logoutButton = document.querySelector("[data-logout]");

const nameDisplay = document.querySelector("[data-profile-name]");
const emailDisplay = document.querySelector("[data-profile-email]");
const createdDisplay = document.querySelector("[data-profile-created]");

let currentUser = null;
let isSaving = false;
let isSigningOut = false;

// =====================================================
// 2. MESSAGE HANDLING
// =====================================================

function showMessage(text, type = "info") {
    setAuthMessage(message, text, type);
}

function clearMessage() {
    clearAuthMessage(message);
}

function getSafeError(error) {
    const code = error?.code;

    const knownErrors = {
        invalid_credentials: "Your session is no longer valid. Please sign in again.",
        session_not_found: "Your session has expired. Please sign in again.",
        user_not_found: "Your account could not be found."
    };

    if (code && knownErrors[code]) {
        return knownErrors[code];
    }

    return "Something went wrong. Please try again.";
}

// =====================================================
// 3. DASHBOARD REDIRECTION
// =====================================================

function redirectToLogin() {
    window.location.replace(authPageUrl("login.html"));
}

// =====================================================
// 4. PROFILE DISPLAY
// =====================================================

function formatMemberDate(createdAt) {
    if (!createdAt) return "Not available";

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function populateProfile(user) {
    const metadata = user.user_metadata || {};

    const fullName =
        metadata.full_name ||
        metadata.name ||
        "Traveller";

    const phone = metadata.phone || "";

    if (nameDisplay) {
        nameDisplay.textContent = fullName;
    }

    if (emailDisplay) {
        emailDisplay.textContent = user.email || "Not available";
    }

    if (createdDisplay) {
        createdDisplay.textContent =
            formatMemberDate(user.created_at);
    }

    if (profileForm) {
        const nameInput =
            profileForm.elements.namedItem("full_name");

        const phoneInput =
            profileForm.elements.namedItem("phone");

        if (nameInput) {
            nameInput.value =
                metadata.full_name || metadata.name || "";
        }

        if (phoneInput) {
            phoneInput.value = phone;
        }
    }
}

// =====================================================
// 5. SESSION VERIFICATION
// =====================================================

async function initializeDashboard() {
    try {
        // Check whether a session exists.
        const { data: sessionData, error: sessionError } =
            await supabase.auth.getSession();

        if (sessionError || !sessionData.session) {
            redirectToLogin();
            return;
        }

        // Validate the authenticated user with Supabase.
        const { data: userData, error: userError } =
            await supabase.auth.getUser();

        if (userError || !userData.user) {
            redirectToLogin();
            return;
        }

        currentUser = userData.user;

        populateProfile(currentUser);

    } catch (error) {
        console.error("[Travel Qila] Dashboard initialization failed.");

        showMessage(
            "Unable to verify your account. Please sign in again.",
            "error"
        );

        redirectToLogin();
    }
}

// =====================================================
// 6. PROFILE UPDATE
// =====================================================

async function handleProfileUpdate(event) {
    event.preventDefault();

    if (!currentUser || isSaving) {
        return;
    }

    clearMessage();

    const nameInput =
        profileForm.elements.namedItem("full_name");

    const phoneInput =
        profileForm.elements.namedItem("phone");

    const fullName = nameInput?.value.trim() || "";
    const phone = phoneInput?.value.trim() || "";

    if (fullName.length < 2) {
        showMessage(
            "Please enter a valid full name.",
            "error"
        );

        nameInput?.focus();
        return;
    }

    if (fullName.length > 100 || phone.length > 30) {
        showMessage(
            "Please check the length of your profile details.",
            "error"
        );

        return;
    }

    isSaving = true;

    const saveButton =
        profileForm.querySelector('button[type="submit"]');

    const originalButtonText = saveButton?.innerHTML;

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
    }

    try {
        const existingMetadata =
            currentUser.user_metadata || {};

        const { data, error } =
            await supabase.auth.updateUser({
                data: {
                    ...existingMetadata,
                    full_name: fullName,
                    phone
                }
            });

        if (error) {
            throw error;
        }

        if (!data.user) {
            throw new Error("Profile update could not be confirmed.");
        }

        currentUser = data.user;

        populateProfile(currentUser);

        showMessage(
            "Your profile has been updated successfully.",
            "success"
        );

    } catch (error) {
        console.error("[Travel Qila] Profile update failed.");

        showMessage(
            getSafeError(error),
            "error"
        );

    } finally {
        isSaving = false;

        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML = originalButtonText;
        }
    }
}

// =====================================================
// 7. SIGN OUT
// =====================================================

async function handleLogout() {
    if (isSigningOut) return;

    clearMessage();

    isSigningOut = true;

    if (logoutButton) {
        logoutButton.disabled = true;
        logoutButton.textContent = "Signing out...";
    }

    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            throw error;
        }

        window.location.replace(
            authPageUrl("login.html")
        );

    } catch (error) {
        console.error("[Travel Qila] Sign-out failed.");

        showMessage(
            "Unable to sign out. Please try again.",
            "error"
        );

        isSigningOut = false;

        if (logoutButton) {
            logoutButton.disabled = false;
            logoutButton.innerHTML =
                '<i class="fas fa-sign-out-alt me-2"></i>Sign Out';
        }
    }
}

// =====================================================
// 8. AUTHENTICATION STATE MONITOR
// =====================================================

supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT" && !isSigningOut) {
        redirectToLogin();
    }
});

// =====================================================
// 9. EVENT REGISTRATION
// =====================================================

if (profileForm) {
    profileForm.addEventListener(
        "submit",
        handleProfileUpdate
    );
}

if (logoutButton) {
    logoutButton.addEventListener(
        "click",
        handleLogout
    );
}

// =====================================================
// 10. START DASHBOARD
// =====================================================

initializeDashboard();
