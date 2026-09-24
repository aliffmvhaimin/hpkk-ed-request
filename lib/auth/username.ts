export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function usernameToAuthEmail(username: string) {
  return `${normalizeUsername(username)}@hpkk-ed-request.local`;
}

export function isValidUsername(value: string) {
  const username = normalizeUsername(value);
  return username.length >= 3 && username.length <= 64 && /^[a-z0-9._-]+$/.test(username);
}
