import AuthForm from "@/components/auth-form";
import "../auth.css";
export const metadata = { title: "Create an Account", description: "Create a Travel Qila account.", robots: { index: false, follow: true } };
export default function RegisterPage() { return <main className="auth-page-main"><AuthForm mode="register" /></main>; }
