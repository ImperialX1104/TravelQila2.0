import AuthForm from "@/components/auth-form";
import "../auth.css";
export const metadata = { title: "Reset Password", description: "Choose a new password for your Travel Qila account.", robots: { index: false, follow: true } };
export default function ResetPasswordPage() { return <main className="auth-page-main"><AuthForm mode="reset" /></main>; }
