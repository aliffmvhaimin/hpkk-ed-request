"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/auth/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <form action={formAction} className="auth-form">
      <label>
        Username
        <input name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required aria-invalid={Boolean(state.message)} aria-describedby={state.message ? "login-error" : undefined} />
      </label>

      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required aria-invalid={Boolean(state.message)} aria-describedby={state.message ? "login-error" : undefined} />
      </label>

      {state.message ? <p id="login-error" className="form-error" role="alert">{state.message}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
