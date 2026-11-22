import AuthForm from "@/components/auth-form";
import "../auth.css";
export const metadata = { title: "Forgot Password", description: "Request a password reset for your Travel Qila account.", robots: { index: false, follow: true } };
export default function ForgotPasswordPage() { return <main className="auth-page-main"><AuthForm mode="forgot" /></main>; }
