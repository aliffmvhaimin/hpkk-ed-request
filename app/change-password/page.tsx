import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { requirePasswordChangeProfile } from "@/lib/auth/session";

export default async function ChangePasswordPage() {
  const { profile } = await requirePasswordChangeProfile();

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="change-password-title">
        <p className="eyebrow">First login</p>
        <h1 id="change-password-title">Change your temporary password</h1>
        <p className="auth-copy">
          Signed in as {profile.display_name}. Choose a new password before opening the request calendar.
        </p>
        <ChangePasswordForm />
      </section>
    </main>
  );
}
