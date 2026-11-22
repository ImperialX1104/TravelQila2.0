import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

function validateHttpsUrl(value, label) {
  let url;
  try { url = new URL(value); } catch { throw new Error(`${label} must be a valid URL.`); }
  const local = ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    throw new Error(`${label} must use HTTPS.`);
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error(`${label} must not contain credentials, query parameters, or fragments.`);
  }
  return url.href.replace(/\/+$/, "");
}

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
}

export const supabase = createClient(
  validateHttpsUrl(supabaseUrl, "Supabase URL"),
  supabasePublishableKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce"
    }
  }
);

const allowedAuthRoutes = new Set([
  "/login", "/register", "/forgot-password", "/reset-password",
  "/dashboard", "/auth/callback"
]);

const basePath = import.meta.env.BASE_URL || "/";
export function authRouteUrl(route) {
  if (!allowedAuthRoutes.has(route)) throw new Error("Invalid authentication destination.");
  return new URL(route.replace(/^\//, ""), new URL(basePath, window.location.origin)).href;
}
