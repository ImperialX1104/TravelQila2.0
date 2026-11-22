import AuthForm from "@/components/auth-form";
import "../auth.css";
export const metadata = { title: "Sign In", description: "Sign in to your Travel Qila account.", robots: { index: false, follow: true } };
export default function LoginPage() { return <main className="auth-page-main"><AuthForm mode="login" /></main>; }
