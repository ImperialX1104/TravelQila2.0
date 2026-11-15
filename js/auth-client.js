import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.1";

const config = window.TRAVELQILA_AUTH_CONFIG;

if (!config?.supabaseUrl || !config?.supabasePublishableKey ||
    config.supabaseUrl.includes("YOUR_PROJECT_REF") ||
    config.supabasePublishableKey.includes("YOUR_SUPABASE_")) {
    throw new Error("Travel Qila authentication is not configured. Edit js/auth-config.js first.");
}

const normalizedSiteUrl = (config.siteUrl || window.location.origin).replace(/\/+$/, "");

export const supabase = createClient(
    config.supabaseUrl,
    config.supabasePublishableKey,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            flowType: "implicit"
        }
    }
);

export function authPageUrl(fileName) {
    return `${normalizedSiteUrl}/${String(fileName).replace(/^\/+/, "")}`;
}

export function safeReturnTo(value) {
    // Only allow local HTML paths. Do not accept arbitrary redirect URLs.
    const allowed = new Set([
        "index.html", "booking.html", "packages.html", "dashboard.html",
        "about.html", "services.html", "contact.html"
    ]);
    return allowed.has(value) ? value : "dashboard.html";
}

export function setAuthMessage(element, message, kind = "info") {
    if (!element) return;
    element.textContent = message;
    element.className = `auth-message is-visible is-${kind}`;
    element.setAttribute("role", kind === "error" ? "alert" : "status");
}

export function clearAuthMessage(element) {
    if (!element) return;
    element.textContent = "";
    element.className = "auth-message";
}
