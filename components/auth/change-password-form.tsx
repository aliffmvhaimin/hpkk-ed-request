"use client";

import { useActionState, useState } from "react";
import { changePasswordAction } from "@/lib/auth/actions";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, {});
  const [visible, setVisible] = useState(false);
  const [password, setPassword] = useState("");
  const strength = password.length < 8 ? 0 : [password.length >= 12, /[A-Z]/.test(password), /[0-9]/.test(password), /[^a-zA-Z0-9]/.test(password)].filter(Boolean).length;
  const strengthLabel = !password ? "Minimum 8 characters" : password.length < 8 ? "Too short" : strength < 2 ? "Weak" : strength < 3 ? "Good" : "Strong";

  return (
    <form action={formAction} className="auth-form">
      <label>
        <span className="label-line">New password<button className="password-visibility" type="button" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? "Hide password" : "Show password"}</button></span>
        <input name="password" type={visible ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter at least 8 characters" autoComplete="new-password" required minLength={8} aria-invalid={Boolean(state.message)} aria-describedby={state.message ? "change-password-error" : undefined} />
      </label>

      <label>
        Confirm new password
        <input name="confirmPassword" type={visible ? "text" : "password"} placeholder="Re-enter new password" autoComplete="new-password" required minLength={8} aria-invalid={Boolean(state.message)} aria-describedby={state.message ? "change-password-error" : undefined} />
      </label>

      <div className="password-strength"><div><span>Password strength</span><strong aria-live="polite">{strengthLabel}</strong></div><div className="strength-track"><span style={{ width: password ? `${password.length < 8 ? 15 : 25 + strength * 18.75}%` : "0%", background: password.length < 8 || strength < 2 ? "#e59637" : "#0f766e" }} /></div></div>
      {state.message ? <p id="change-password-error" className="form-error" role="alert">{state.message}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Change password"}
      </button>
    </form>
  );
}
