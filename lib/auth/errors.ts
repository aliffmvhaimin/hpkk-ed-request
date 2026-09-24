export const GENERIC_AUTH_ERROR = "Username or password is incorrect.";
export const DISABLED_ACCOUNT_ERROR = "This account is not active. Please contact the administrator.";
export const PASSWORD_CHANGE_ERROR = "Enter a new password that meets the password requirements.";

export type AuthActionState = {
  message?: string;
};
