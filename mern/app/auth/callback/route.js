import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SAFE_DESTINATIONS = new Set(["/","/dashboard.html","/services.html","/hotels.html","/visa.html","/packages.html","/trip-enquiry.html"]);

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requested = requestUrl.searchParams.get("next");
  const destination = SAFE_DESTINATIONS.has(requested) ? requested : "/dashboard.html";
  if (!code) return NextResponse.redirect(new URL("/login.html?auth=callback_error", requestUrl.origin));

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: values => values.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
    } }
  );
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login.html?auth=callback_error", requestUrl.origin));
  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}
