
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.1";

// =====================================================
// 1. CONFIGURATION VALIDATION
// =====================================================

const config = window.TRAVELQILA_AUTH_CONFIG;

if (
    !config ||
    typeof config.supabaseUrl !== "string" ||
    typeof config.supabasePublishableKey !== "string" ||
    !config.supabaseUrl.trim() ||
    !config.supabasePublishableKey.trim() ||
    config.supabaseUrl.includes("YOUR_PROJECT_REF") ||
    config.supabasePublishableKey.includes("YOUR_SUPABASE_")
) {
    throw new Error(
        "Travel Qila authentication is not configured. Check js/auth-config.js."
    );
}

function validateUrl(value, label, allowLocalHttp = false) {
    let url;

    try {
        url = new URL(value);
    } catch {
        throw new Error(`${label} must be a valid URL.`);
    }

    const isLocalhost =
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1";

    if (
        url.protocol !== "https:" &&
        !(allowLocalHttp && isLocalhost && url.protocol === "http:")
    ) {
        throw new Error(`${label} must use HTTPS.`);
    }

    if (url.username || url.password) {
        throw new Error(`${label} must not contain credentials.`);
    }

    return url;
}

const supabaseUrl = validateUrl(
    config.supabaseUrl.trim(),
    "Supabase URL",
    true
);

if (supabaseUrl.search || supabaseUrl.hash) {
    throw new Error(
        "Supabase URL must not contain query parameters or fragments."
    );
}

const siteUrl = validateUrl(
    config.siteUrl || window.location.origin,
    "Site URL",
    true
);

if (siteUrl.search || siteUrl.hash) {
    throw new Error(
        "Site URL must not contain query parameters or fragments."
    );
}

const normalizedSiteUrl = siteUrl.href.replace(/\/+$/, "");

// =====================================================
// 2. APPROVED PAGE DESTINATIONS
// =====================================================

const ALLOWED_PAGES = new Set([
    "index.html",
    "booking.html",
    "packages.html",
    "dashboard.html",
    "about.html",
    "services.html",
    "contact.html",
    "login.html",
    "register.html",
    "forgot-password.html",
    "reset-password.html"
]);

const ALLOWED_MESSAGE_TYPES = new Set([
    "info",
    "error",
    "success",
    "warning"
]);

// =====================================================
// 3. SUPABASE CLIENT
// =====================================================

export const supabase = createClient(
    supabaseUrl.href.replace(/\/+$/, ""),
    config.supabasePublishableKey.trim(),
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            flowType: "implicit"
        }
    }
);

// =====================================================
// 4. SAFE INTERNAL PAGE URL
// =====================================================

export function authPageUrl(fileName) {
    if (
        typeof fileName !== "string" ||
        !ALLOWED_PAGES.has(fileName)
    ) {
        throw new Error(
            "Invalid authentication page destination."
        );
    }

    const baseUrl = new URL(`${normalizedSiteUrl}/`);
    const destination = new URL(fileName, baseUrl);

    const expectedPath =
        `${baseUrl.pathname}${fileName}`;

    if (
        destination.origin !== baseUrl.origin ||
        destination.pathname !== expectedPath ||
        destination.search ||
        destination.hash
    ) {
        throw new Error(
            "Unsafe authentication redirect destination."
        );
    }

    return destination.href;
}

// =====================================================
// 5. SAFE RETURN DESTINATION
// =====================================================

export function safeReturnTo(value) {
    if (
        typeof value !== "string" ||
        !ALLOWED_PAGES.has(value)
    ) {
        return "dashboard.html";
    }

    return value;
}

// =====================================================
// 6. AUTHENTICATION MESSAGE HANDLING
// =====================================================

export function setAuthMessage(element, message, kind = "info") {
    if (!element) return;

    const safeKind = ALLOWED_MESSAGE_TYPES.has(kind)
        ? kind
        : "info";

    element.textContent = String(message ?? "");
    element.className = `auth-message is-visible is-${safeKind}`;

    element.setAttribute(
        "role",
        safeKind === "error" ? "alert" : "status"
    );

    element.setAttribute("aria-live", "polite");
}

export function clearAuthMessage(element) {
    if (!element) return;

    element.textContent = "";
    element.className = "auth-message";

    element.removeAttribute("aria-live");
    element.removeAttribute("role");
}
