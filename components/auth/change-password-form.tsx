"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/lib/auth/actions";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, {});

  return (
    <form action={formAction} className="auth-form">
      <label>
        New password
        <input name="password" type="password" autoComplete="new-password" required minLength={8} />
      </label>

      <label>
        Confirm new password
        <input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} />
      </label>

      {state.message ? <p className="form-error">{state.message}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Change password"}
      </button>
    </form>
  );
}
