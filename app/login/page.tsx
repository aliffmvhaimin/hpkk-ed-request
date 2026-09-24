import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionProfile } from "@/lib/auth/session";

export default async function LoginPage() {
  const session = await getSessionProfile();
  if (session?.profile.must_change_password) redirect("/change-password");
  if (session) redirect("/dashboard");

  return (
    <main className="auth-page">
      <section className="auth-layout" aria-labelledby="login-title">
        <aside className="auth-brand-panel">
          <div className="auth-brand-lockup"><span className="auth-brand-icon" aria-hidden="true">ED</span><div><p>HPKK</p><strong>Emergency Department</strong></div></div>
          <div className="auth-brand-copy"><p className="eyebrow">Staff request workspace</p><h2>Plan requests with clarity.</h2><p>One secure place for the department to review monthly requests, weekly notes, and availability.</p></div>
          <div className="auth-calendar-motif" aria-hidden="true">{Array.from({ length: 14 }, (_, index) => <span className={index === 4 || index === 10 ? "active" : ""} key={index} />)}</div>
          <p className="auth-brand-footnote">Private access for authorised HPKK ED staff</p>
        </aside>
        <div className="auth-panel">
          <span className="auth-mobile-mark" aria-hidden="true">ED</span>
          <p className="eyebrow">Welcome back</p>
          <h1 id="login-title">Sign in</h1>
          <p className="auth-copy">Enter the username and password assigned by your administrator.</p>
          <LoginForm />
          <p className="auth-help">First time here? You will be asked to replace your temporary password after signing in.</p>
        </div>
      </section>
    </main>
  );
}
