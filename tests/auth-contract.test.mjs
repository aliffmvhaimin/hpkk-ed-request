import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const username = readFileSync("lib/auth/username.ts", "utf8");
const actions = readFileSync("lib/auth/actions.ts", "utf8");
const adminAccounts = readFileSync("lib/auth/admin-accounts.ts", "utf8");
const session = readFileSync("lib/auth/session.ts", "utf8");
const loginPage = readFileSync("app/login/page.tsx", "utf8");
const changePasswordPage = readFileSync("app/change-password/page.tsx", "utf8");
const dashboardPage = readFileSync("app/dashboard/page.tsx", "utf8");
const adminPage = readFileSync("app/admin/page.tsx", "utf8");
const loginForm = readFileSync("components/auth/login-form.tsx", "utf8");
const changePasswordForm = readFileSync("components/auth/change-password-form.tsx", "utf8");

test("username login normalizes staff-entered names before lookup", () => {
  assert.match(username, /value\.trim\(\)\.toLowerCase\(\)/);
  assert.match(actions, /normalizeUsername/);
  assert.match(actions, /\.eq\("username", username\)/);
});

test("credential failures use generic errors and avoid password storage", () => {
  assert.match(actions, /GENERIC_AUTH_ERROR/);
  assert.doesNotMatch(actions, /console\.log|console\.error/);
  assert.doesNotMatch(adminAccounts, /plain[_-]?text/i);
  assert.match(adminAccounts, /supabase\.auth\.admin\.createUser/);
  assert.match(adminAccounts, /supabase\.auth\.admin\.updateUserById/);
});

test("forced password change and disabled-account gates are server-side", () => {
  assert.match(session, /must_change_password/);
  assert.match(session, /redirect\("\/change-password"\)/);
  assert.match(session, /!profile\.is_active/);
  assert.match(session, /supabase\.auth\.signOut\(\)/);
  assert.match(changePasswordPage, /requirePasswordChangeProfile/);
  assert.match(dashboardPage, /requireActiveProfile/);
  assert.match(adminPage, /requireAdminProfile/);
});

test("authenticated screens expose an explicit logout action", () => {
  assert.match(changePasswordPage, /signOutAction/);
  assert.match(changePasswordPage, />Logout</);
  assert.match(dashboardPage, />Logout</);
});

test("auth screens are present without public registration or recovery", () => {
  assert.match(loginPage, /<LoginForm/);
  assert.match(changePasswordPage, /<ChangePasswordForm/);
  assert.doesNotMatch(loginPage, /register|sign up|recover|reset password/i);
});

test("login errors are announced and associated with both fields", () => {
  assert.match(loginForm, /role="alert"/);
  assert.match(loginForm, /aria-describedby=\{state\.message \? "login-error"/);
});
test("password-change errors are announced and associated with both fields", () => {
  assert.match(changePasswordForm, /role="alert"/);
  assert.match(changePasswordForm, /aria-describedby=\{state\.message \? "change-password-error"/);
});
