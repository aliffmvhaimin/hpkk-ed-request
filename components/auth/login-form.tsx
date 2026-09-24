"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/auth/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <form action={formAction} className="auth-form">
      <label>
        Username
        <input name="username" autoComplete="username" required />
      </label>

      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>

      {state.message ? <p className="form-error">{state.message}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
