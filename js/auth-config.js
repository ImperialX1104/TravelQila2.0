
/*
 * Travel Qila 2.0
 * Public Authentication Configuration
 *
 * IMPORTANT:
 * Only Supabase publishable/anon keys belong here.
 * NEVER expose service_role keys or private secrets.
 */

(() => {
    "use strict";

    const PRODUCTION_HOST = "imperialx1104.github.io";
    const PROJECT_PATH = "/TravelQila2.0";

    // Determine canonical application URL.
    const siteUrl =
        window.location.hostname === PRODUCTION_HOST
            ? `${window.location.origin}${PROJECT_PATH}`
            : window.location.origin;

    // Public Supabase configuration.
    const config = {
        supabaseUrl: "https://stjhubpzshzyjqkscjty.supabase.co",

        supabasePublishableKey:
            "sb_publishable_MHOsXjYvXj5Ah6_WFEl6HQ_ObHg8bro",

        siteUrl: siteUrl
    };

    // Expose immutable configuration.
    window.TRAVELQILA_AUTH_CONFIG = Object.freeze(config);

})();
