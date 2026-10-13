"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/lib/auth/actions";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, {});

  return (
    <form action={formAction} className="auth-form">
      <label>
        New password
        <input name="password" type="password" autoComplete="new-password" required minLength={8} aria-invalid={Boolean(state.message)} aria-describedby={state.message ? "change-password-error" : undefined} />
      </label>

      <label>
        Confirm new password
        <input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} aria-invalid={Boolean(state.message)} aria-describedby={state.message ? "change-password-error" : undefined} />
      </label>

      {state.message ? <p id="change-password-error" className="form-error" role="alert">{state.message}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Change password"}
      </button>
    </form>
  );
}
