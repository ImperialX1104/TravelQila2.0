import { supabase } from "./auth-client.js";

function normalizedText(anchor) {
    return (anchor.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function findAnchors(test) {
    return [...document.querySelectorAll("a")].filter((anchor) => test(normalizedText(anchor)));
}

function setVisible(anchor, visible) {
    anchor.hidden = !visible;
    if (visible) anchor.removeAttribute("aria-hidden");
    else anchor.setAttribute("aria-hidden", "true");
}

async function updateAuthNavigation() {
    const { data, error } = await supabase.auth.getSession();
    if (error) console.warn("Travel Qila auth navigation could not read session:", error);
    const signedIn = Boolean(data?.session);

    const registerLinks = findAnchors((text) => text === "register");
    const loginLinks = findAnchors((text) => text === "login");
    const dashboardLinks = findAnchors((text) => text.includes("my dashboard"));
    const logoutLinks = findAnchors((text) => text === "log out" || text === "logout");

    registerLinks.forEach((link) => {
        link.href = "register.html";
        setVisible(link, !signedIn);
    });
    loginLinks.forEach((link) => {
        link.href = "login.html";
        setVisible(link, !signedIn);
    });
    dashboardLinks.forEach((link) => {
        link.href = "dashboard.html";
        setVisible(link, signedIn);
    });

    logoutLinks.forEach((link) => {
        link.href = "login.html";
        setVisible(link, signedIn);
        link.addEventListener("click", async (event) => {
            event.preventDefault();
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) {
                console.error("Travel Qila sign-out failed:", signOutError);
                window.alert("We couldn't sign you out. Please try again.");
                return;
            }
            window.location.assign("index.html");
        }, { once: true });
    });

    // Existing template dropdown items that have no implemented destination are hidden.
    findAnchors((text) => ["inbox", "notifications"].includes(text)).forEach((link) => {
        link.hidden = true;
    });
}

updateAuthNavigation();
supabase.auth.onAuthStateChange(() => {
    // Defer DOM work out of the auth callback to avoid re-entrant Supabase calls.
    window.setTimeout(updateAuthNavigation, 0);
});
