/*
 * Travel Qila public authentication configuration.
 * Replace the two placeholders with values from Supabase > Project Settings > API.
 * The publishable/anon key is intended for browser use. NEVER put a secret/service_role key here.
 */
 //window.TRAVELQILA_AUTH_CONFIG = Object.freeze({
   // supabaseUrl: "https://stjhubpzshzyjqkscjty.supabase.co",
   // supabasePublishableKey: "sb_publishable_MHOsXjYvXj5Ah6_WFEl6HQ_ObHg8bro",
    // Set to your canonical deployed origin, without a trailing slash.
    // Local example: http://127.0.0.1:5500
   // siteUrl: window.location.origin

    const siteUrl =
    window.location.hostname === "imperialx1104.github.io"
        ? `${window.location.origin}/TravelQila2.0`
        : window.location.origin;

window.TRAVELQILA_AUTH_CONFIG = Object.freeze({
    supabaseUrl: "https://stjhubpzshzyjqkscjty.supabase.co",
    supabasePublishableKey: "YOUR_EXISTING_PUBLISHABLE_KEY",
    siteUrl: siteUrl
});
});
