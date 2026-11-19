
(() => {
    "use strict";

    const PRODUCTION_HOST = "imperialx1104.github.io";
    const PROJECT_PATH = "/TravelQila2.0";

    const siteUrl =
        window.location.hostname === PRODUCTION_HOST
            ? `${window.location.origin}${PROJECT_PATH}`
            : window.location.origin;

    window.TRAVELQILA_AUTH_CONFIG = Object.freeze({
        supabaseUrl: "https://stjhubpzshzyjqkscjty.supabase.co",
        supabasePublishableKey: "sb_publishable_MHOsXjYvXj5Ah6_WFEl6HQ_ObHg8bro",
        siteUrl
    });

})();
