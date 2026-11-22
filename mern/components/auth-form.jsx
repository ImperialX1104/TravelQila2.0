"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const ROUTES = new Set(["/","/trip-enquiry.html","/packages.html","/dashboard.html","/about.html","/services.html","/hotels.html","/visa.html","/contact.html","/login.html","/register.html","/forgot-password.html","/reset-password.html"]);
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_BYTES = 72;

function passwordError(password) {
  if (password.length < MIN_PASSWORD_LENGTH) return "Password must contain at least 12 characters.";
  if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) return "Password is too long. Use a shorter password.";
  if (!/[A-Z]/.test(password)) return "Include at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Include at least one lowercase letter.";
  if (!/[0-9]/.test(password)) return "Include at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Include at least one special character.";
  return null;
}

function safeError(error) {
  const code = error?.code || error?.name || "";
  const message = error?.message || "";
  const known = {
    invalid_credentials: "Incorrect email or password.",
    email_not_confirmed: "Please verify your email address before signing in.",
    user_not_found: "Incorrect email or password.",
    weak_password: "Your password does not meet the security requirements.",
    over_email_send_rate_limit: "Too many email requests. Please try again later.",
    over_request_rate_limit: "Too many attempts. Please wait before trying again.",
    otp_expired: "This password reset link has expired. Request a new one.",
    flow_state_expired: "This password reset link has expired. Request a new one.",
    validation_failed: "Please check your details and try again.",
    provider_disabled: "This sign-in option is not configured yet. Please use email sign-in or contact support."
  };
  if (known[code]) return known[code];
  if (/unsupported provider|provider.{0,40}(not enabled|disabled)/i.test(message)) return "This sign-in option is not configured yet. Please use email sign-in or contact support.";
  if (/invalid login credentials/i.test(message)) return "Incorrect email or password.";
  if (/email not confirmed/i.test(message)) return "Please verify your email address before signing in.";
  if (/expired|invalid.*(token|code)|token.*(expired|invalid)/i.test(message)) return "This link is invalid or has expired. Please request a new one.";
  return "We couldn't complete your request. Please try again.";
}

function returnTo() {
  if (typeof window === "undefined") return "/dashboard.html";
  const candidate = new URLSearchParams(window.location.search).get("returnTo");
  return ROUTES.has(candidate) ? candidate : "/dashboard.html";
}

export default function AuthForm({ mode }) {
  const router = useRouter();
  const [values, setValues] = useState({ full_name: "", phone: "", email: "", password: "", confirm_password: "", terms: false });
  const [message, setMessage] = useState({ text: "", kind: "info" });
  const [busy, setBusy] = useState(false);
  const [resetReady, setResetReady] = useState(mode !== "reset");

  useEffect(() => {
    if (mode !== "reset") return;
    let active = true;
    Promise.resolve().then(() => getSupabaseBrowserClient().auth.getSession()).then(({ data, error }) => {
      if (!active) return;
      if (error || !data.session) {
        setResetReady(false);
        setMessage({ text: "This reset link is invalid or has expired. Request a new password reset link.", kind: "error" });
      } else setResetReady(true);
    }).catch(() => {
      if (active) {
        setResetReady(false);
        setMessage({ text: "We couldn't verify this reset link. Request a new one.", kind: "error" });
      }
    });
    return () => { active = false; };
  }, [mode]);

  function change(event) {
    const { name, value, checked, type } = event.target;
    setValues(current => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage({ text: "", kind: "info" });
    const supabase = getSupabaseBrowserClient();
    setBusy(true);
    try {
      if (mode === "login") {
        if (!values.email.trim() || !values.password) throw new Error("Please enter your email and password.");
        const { data, error } = await supabase.auth.signInWithPassword({ email: values.email.trim(), password: values.password });
        if (error) throw error;
        if (!data.session || !data.user) throw new Error("Authentication could not be completed.");
        router.replace(returnTo());
        router.refresh();
      } else if (mode === "register") {
        if (values.full_name.trim().length < 2) throw new Error("Please enter your full name.");
        if (!values.email.trim() || !values.password) throw new Error("Please complete all required fields.");
        if (values.password !== values.confirm_password) throw new Error("Your passwords do not match.");
        const invalid = passwordError(values.password);
        if (invalid) throw new Error(invalid);
        if (!values.terms) throw new Error("Please accept the Terms and Privacy Policy.");
        const callback = new URL("/auth/callback", window.location.origin); callback.searchParams.set("next", "/login.html?verified=1");
        const redirect = callback.href;
        const { data, error } = await supabase.auth.signUp({
          email: values.email.trim(), password: values.password,
          options: { emailRedirectTo: redirect, data: { full_name: values.full_name.trim(), phone: values.phone.trim() } }
        });
        if (error) throw error;
        if (data.session) {
          setMessage({ text: "Your account has been created successfully.", kind: "success" });
          router.replace("/dashboard.html");
          router.refresh();
        } else {
          setMessage({ text: "If registration was successful, a verification email will arrive shortly. Check your inbox and spam folder.", kind: "success" });
          setValues(current => ({ ...current, password: "", confirm_password: "" }));
        }
      } else if (mode === "forgot") {
        if (!values.email.trim()) throw new Error("Enter the email address linked to your account.");
        const { error } = await supabase.auth.resetPasswordForEmail(values.email.trim(), { redirectTo: (() => { const callback = new URL("/auth/callback", window.location.origin); callback.searchParams.set("next", "/reset-password.html"); return callback.href; })() });
        if (error) throw error;
        setMessage({ text: "If an account exists for that email, a password reset link will arrive shortly. Check your inbox and spam folder.", kind: "success" });
        setValues(current => ({ ...current, email: "" }));
      } else if (mode === "reset") {
        if (!resetReady) throw new Error("This reset link is invalid or has expired. Request a new one.");
        if (!values.password || values.password !== values.confirm_password) throw new Error("Your passwords do not match.");
        const invalid = passwordError(values.password);
        if (invalid) throw new Error(invalid);
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) throw new Error("The password reset session is missing or expired.");
        const { error } = await supabase.auth.updateUser({ password: values.password });
        if (error) throw error;
        await supabase.auth.signOut();
        setMessage({ text: "Your password has been updated. Please sign in with your new password.", kind: "success" });
        setValues(current => ({ ...current, password: "", confirm_password: "" }));
      }
    } catch (error) {
      setMessage({ text: error.message?.startsWith("Please ") || error.message?.startsWith("Your ") || error.message?.startsWith("Password ") || error.message?.startsWith("Include ") || error.message?.startsWith("Enter ") || error.message?.startsWith("This ") || error.message?.startsWith("The ") ? error.message : safeError(error), kind: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function social(provider) {
    setBusy(true);
    setMessage({ text: "", kind: "info" });
    try {
      const { error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
        provider,
        options: { redirectTo: (() => { const callback = new URL("/auth/callback", window.location.origin); callback.searchParams.set("next", returnTo()); return callback.href; })() }
      });
      if (error) throw error;
    } catch (error) {
      setMessage({ text: safeError(error), kind: "error" });
      setBusy(false);
    }
  }

  const titles = { login: "Welcome back", register: "Create your account", forgot: "Reset your password", reset: "Choose a new password" };
  const descriptions = { login: "Sign in to manage your travel plans.", register: "Join Travel Qila and keep your journeys together.", forgot: "Enter your email and we’ll send a reset link if an account exists.", reset: "Choose a strong password for your account." };

  return (
    <section className="auth-layout">
      <div className="auth-panel">
        <p className="eyebrow eyebrow-blue">Travel Qila account</p>
        <h1>{titles[mode]}</h1>
        <p className="auth-description">{descriptions[mode]}</p>
        {message.text && <div className={`auth-message is-${message.kind}`} role={message.kind === "error" ? "alert" : "status"} aria-live="polite">{message.text}</div>}
        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && <>
            <label>Full name<input name="full_name" autoComplete="name" value={values.full_name} onChange={change} required minLength={2} maxLength={100} /></label>
            <label>Phone number <span className="optional-label">Optional</span><input name="phone" autoComplete="tel" value={values.phone} onChange={change} maxLength={30} /></label>
          </>}
          {mode !== "reset" && <label>Email address<input type="email" name="email" autoComplete="email" value={values.email} onChange={change} required /></label>}
          {(mode === "login" || mode === "register" || mode === "reset") && <label>Password<input type="password" name="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={values.password} onChange={change} required minLength={mode === "login" ? 1 : 12} /></label>}
          {(mode === "register" || mode === "reset") && <label>Confirm password<input type="password" name="confirm_password" autoComplete="new-password" value={values.confirm_password} onChange={change} required /></label>}
          {mode === "register" && <label className="terms-check"><input type="checkbox" name="terms" checked={values.terms} onChange={change} required /><span>I agree to the <Link href="/terms.html">Terms</Link> and <Link href="/privacy.html">Privacy Policy</Link>.</span></label>}
          <button className="button auth-submit" type="submit" disabled={busy || (mode === "reset" && !resetReady)}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : mode === "forgot" ? "Send reset link" : "Update password"}</button>
        </form>
        {mode === "login" && <div className="auth-social"><span>Or continue with</span><div><button type="button" onClick={() => social("google")} disabled={busy}>Google</button><button type="button" onClick={() => social("apple")} disabled={busy}>Apple</button></div></div>}
        <div className="auth-links">
          {mode === "login" && <><Link href="/forgot-password.html">Forgot password?</Link><p>New to Travel Qila? <Link href="/register.html">Create an account</Link></p></>}
          {mode === "register" && <p>Already have an account? <Link href="/login.html">Sign in</Link></p>}
          {mode === "forgot" && <p>Remembered your password? <Link href="/login.html">Sign in</Link></p>}
          {mode === "reset" && <p><Link href="/forgot-password.html">Request a new reset link</Link></p>}
        </div>
      </div>
      <aside className="auth-aside">
        <span className="auth-aside-mark">TQ</span>
        <p className="eyebrow">Travel begins here</p>
        <h2>Every journey<br /><em>has a story.</em></h2>
        <p>Sign in to keep your profile, travel requests and saved ideas together.</p>
      </aside>
    </section>
  );
}
