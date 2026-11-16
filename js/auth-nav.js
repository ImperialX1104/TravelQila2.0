import { supabase, authPageUrl } from "./auth-client.js";

function normalizedText(anchor) {
    return (anchor.textContent || "").replace(/\\s+/g, " ").trim().toLowerCase();
}

function findAnchors(test) {
    return [...document.querySelectorAll("a")].filter((anchor) => test(normalizedText(anchor)));
}

function setVisible(anchor, visible) {
    anchor.hidden = !visible;
    if (visible) {
        anchor.removeAttribute("aria-hidden");
    } else {
        anchor.setAttribute("aria-hidden", "true");
    }
}

async function handleSignOut(event) {
    event.preventDefault();
    const link = event.currentTarget;
    link.setAttribute("aria-disabled", "true");
    link.classList.add("disabled");

    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.assign(authPageUrl("index.html"));
    } catch (error) {
        console.error("Travel Qila sign-out failed:", error);
        link.removeAttribute("aria-disabled");
        link.classList.remove("disabled");
        window.alert("We couldn't sign you out. Please try again.");
    }
}

async function updateAuthNavigation() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.warn("Travel Qila auth navigation could not read session:", error);
    }

    const signedIn = Boolean(data?.session);
    const registerLinks = findAnchors((text) => text === "register");
    const loginLinks = findAnchors((text) => text === "login");
    const dashboardLinks = findAnchors((text) => text.includes("my dashboard"));
    const logoutLinks = findAnchors((text) => text === "log out" || text === "logout");

    registerLinks.forEach((link) => {
        link.href = authPageUrl("register.html");
        setVisible(link, !signedIn);
    });

    loginLinks.forEach((link) => {
        link.href = authPageUrl("login.html");
        setVisible(link, !signedIn);
    });

    dashboardLinks.forEach((link) => {
        link.href = authPageUrl("dashboard.html");
        setVisible(link, signedIn);
    });

    logoutLinks.forEach((link) => {
        link.href = authPageUrl("index.html");
        setVisible(link, signedIn);
        if (link.dataset.travelQilaLogoutBound !== "true") {
            link.addEventListener("click", handleSignOut);
            link.dataset.travelQilaLogoutBound = "true";
        }
    });

    // Hide template-only destinations until those features are implemented.
    findAnchors((text) => ["inbox", "notifications"].includes(text)).forEach((link) => {
        setVisible(link, false);
    });
}

updateAuthNavigation();

supabase.auth.onAuthStateChange(() => {
    // Defer DOM work out of the auth callback to avoid re-entrant Supabase calls.
    window.setTimeout(updateAuthNavigation, 0);
});
