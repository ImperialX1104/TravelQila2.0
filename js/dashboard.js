
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

const bookingsList = document.querySelector("[data-bookings-list]");
const bookingsCount = document.querySelector("[data-bookings-count]");
function escapeBookingText(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function bookingDate(value) {
    if (!value) return "Date to be confirmed";
    const date = new Date(value + (String(value).length === 10 ? "T12:00:00" : ""));
    return Number.isNaN(date.getTime()) ? "Date to be confirmed" : date.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
}
async function loadCustomerBookings() {
    if (!bookingsList || !currentUser) return;
    const {data,error} = await supabase.from("flight_bookings")
        .select("id,booking_reference,origin,destination,origin_code,destination_code,trip_type,departure_date,return_date,adults,children,infants,cabin_class,airline,flight_number,status,created_at")
        .eq("user_id",currentUser.id).order("created_at",{ascending:false});
    if (error) {
        console.error("[Travel Qila] Booking list load failed:",error.code || "unknown");
        bookingsList.innerHTML = '<div class="alert alert-warning mb-0">Your bookings could not be loaded. Ask the site administrator to apply supabase/flight-bookings.sql, then refresh.</div>';
        return;
    }
    const rows = data || [];
    if (bookingsCount) bookingsCount.textContent = String(rows.length);
    if (!rows.length) {
        bookingsList.innerHTML = '<div class="dashboard-bookings-empty"><div class="empty-icon"><i class="fas fa-plane"></i></div><h3>Your travel plans will appear here</h3><p>Save a flight booking request and track its reference and status here.</p><a href="services.html" class="btn btn-primary rounded-pill px-4 py-2">Search flights</a></div>';
        return;
    }
    bookingsList.innerHTML = rows.map(row => {
        const status = row.status || "pending_confirmation";
        const label = status === "confirmed" ? "Confirmed" : status === "cancelled" ? "Cancelled" : "Pending confirmation";
        const cls = status === "confirmed" ? "is-confirmed" : status === "cancelled" ? "is-cancelled" : "";
        const returnText = row.trip_type === "Round trip" && row.return_date ? " · Return " + bookingDate(row.return_date) : " · One way";
        return '<article class="dashboard-booking-card"><div class="dashboard-booking-top"><div><div class="dashboard-booking-ref">'+escapeBookingText(row.booking_reference)+'</div><div class="dashboard-booking-airline">'+escapeBookingText(row.airline)+' · '+escapeBookingText(row.flight_number)+'</div></div><span class="dashboard-booking-status '+cls+'">'+label+'</span></div><div class="dashboard-booking-route"><div><div class="dashboard-booking-city">'+escapeBookingText(row.origin)+'</div><div class="dashboard-booking-code">'+escapeBookingText(row.origin_code || "")+'</div></div><div class="dashboard-booking-arrow"><i class="fas fa-long-arrow-alt-right"></i></div><div class="text-end"><div class="dashboard-booking-city">'+escapeBookingText(row.destination)+'</div><div class="dashboard-booking-code">'+escapeBookingText(row.destination_code || "")+'</div></div></div><div class="dashboard-booking-meta"><span><i class="far fa-calendar"></i>'+bookingDate(row.departure_date)+returnText+'</span><span><i class="fas fa-users"></i>'+Number(row.adults)+' adult(s), '+Number(row.children)+' child(ren), '+Number(row.infants)+' infant(s)</span><span><i class="fas fa-chair"></i>'+escapeBookingText(row.cabin_class)+'</span><span><i class="far fa-clock"></i>Requested '+bookingDate(row.created_at)+'</span></div></article>';
    }).join("");
}

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
        await loadCustomerBookings();

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
