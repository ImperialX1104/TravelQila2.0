/*
 * Travel Qila public authentication configuration.
 * Replace the two placeholders with values from Supabase > Project Settings > API.
 * The publishable/anon key is intended for browser use. NEVER put a secret/service_role key here.
 */
window.TRAVELQILA_AUTH_CONFIG = Object.freeze({
    supabaseUrl: "https://YOUR_PROJECT_REF.supabase.co",
    supabasePublishableKey: "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY",
    // Set to your canonical deployed origin, without a trailing slash.
    // Local example: http://127.0.0.1:5500
    siteUrl: window.location.origin
});
