
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

const hotelWishlist = document.querySelector('[data-hotel-wishlist]');
const hotelBookings = document.querySelector('[data-hotel-bookings]');

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
        await loadHotelActivity();

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
    const logoutButton = document.querySelector("[data-logout]");

    if (logoutButton) {
        logoutButton.disabled = true;
        logoutButton.textContent = "Signing out...";
    }

    try {
        const { error } = await supabase.auth.signOut();

        if (error) throw error;

        window.location.replace(authPageUrl("login.html"));

    } catch (error) {
        console.error("[Travel Qila] Logout failed:", error);

        showMessage("Unable to sign out. Please try again.", "error");

        if (logoutButton) {
            logoutButton.disabled = false;
            logoutButton.textContent = "Sign Out";
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


function escapeHotelHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
}
function hotelMoney(value) {
    return new Intl.NumberFormat("en-IN", {style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(value) || 0);
}
function hotelDate(value) {
    if (!value) return "Dates not selected";
    const date = new Date(value + "T00:00:00");
    return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
}
function renderHotelWishlist(rows) {
    if (!hotelWishlist) return;
    if (!rows.length) {
        hotelWishlist.innerHTML = '<div class="hotel-dashboard-empty">You have not saved any hotels yet. <a href="hotels.html">Explore stays</a> and tap “Save to wishlist”.</div>';
        return;
    }
    hotelWishlist.innerHTML = rows.map(row =>
        '<article class="hotel-dashboard-row"><img src="' + escapeHotelHtml(row.image_url || "img/destination-1.jpg") + '" alt="' + escapeHotelHtml(row.hotel_name) + '" loading="lazy"><div><h3>' + escapeHotelHtml(row.hotel_name) + '</h3><p><i class="fas fa-map-marker-alt me-1"></i>' + escapeHotelHtml(row.destination) + ' · ' + Number(row.star_rating || 0) + '-star</p><p>' + hotelDate(row.check_in) + ' – ' + hotelDate(row.check_out) + ' · ' + Number(row.guests || 2) + ' guests</p><div class="hotel-dashboard-price">' + hotelMoney(row.total_price) + ' <small class="text-muted fw-normal">estimated total incl. taxes</small></div></div><button class="hotel-dashboard-action" type="button" data-remove-hotel="' + escapeHotelHtml(row.id) + '"><i class="fas fa-trash-alt me-1"></i>Remove</button></article>'
    ).join("");
}
function renderHotelBookings(rows) {
    if (!hotelBookings) return;
    if (!rows.length) {
        hotelBookings.innerHTML = '<div class="hotel-dashboard-empty">No hotel booking requests yet. Your submitted hotel enquiries will appear here.</div>';
        return;
    }
    hotelBookings.innerHTML = rows.map(row =>
        '<article class="hotel-dashboard-row"><div class="feature-icon"><i class="fas fa-hotel"></i></div><div><h3>' + escapeHotelHtml(row.hotel_name) + '</h3><p>' + escapeHotelHtml(row.destination) + ' · ' + hotelDate(row.check_in) + ' – ' + hotelDate(row.check_out) + ' · ' + Number(row.guests || 1) + ' guests</p><p>Request #' + escapeHotelHtml(String(row.id).slice(0,8).toUpperCase()) + ' · Submitted ' + hotelDate(String(row.created_at || "").slice(0,10)) + '</p><div class="hotel-dashboard-price">' + hotelMoney(row.total_price) + ' <small class="text-muted fw-normal">estimated incl. taxes</small></div></div><span class="hotel-dashboard-status">' + escapeHotelHtml(String(row.status || "enquiry received").replace(/_/g," ")) + '</span></article>'
    ).join("");
}
async function loadHotelActivity() {
    if (!currentUser || (!hotelWishlist && !hotelBookings)) return;
    try {
        const results = await Promise.all([
            supabase.from("hotel_wishlists").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:false}),
            supabase.from("hotel_booking_requests").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:false})
        ]);
        if (results[0].error) throw results[0].error;
        if (results[1].error) throw results[1].error;
        renderHotelWishlist(results[0].data || []);
        renderHotelBookings(results[1].data || []);
    } catch (error) {
        console.error("[Travel Qila] Hotel dashboard data could not be loaded:",error.message);
        if (hotelWishlist) hotelWishlist.innerHTML = '<div class="hotel-dashboard-empty">Hotel wishlist is temporarily unavailable. Please refresh or try again later.</div>';
        if (hotelBookings) hotelBookings.innerHTML = '<div class="hotel-dashboard-empty">Hotel requests are temporarily unavailable. Please refresh or try again later.</div>';
    }
}
hotelWishlist?.addEventListener("click",async event => {
    const button = event.target.closest("[data-remove-hotel]");
    if (!button || !currentUser) return;
    button.disabled = true;
    const {error} = await supabase.from("hotel_wishlists").delete().eq("id",button.dataset.removeHotel).eq("user_id",currentUser.id);
    if (error) {
        button.disabled = false;
        showMessage("Unable to remove this hotel from your wishlist. Please try again.","error");
        return;
    }
    showMessage("Hotel removed from your wishlist.","success");
    await loadHotelActivity();
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
