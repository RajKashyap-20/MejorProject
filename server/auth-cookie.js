const AUTH_COOKIE = "acadlink_token";
const LEGACY_AUTH_COOKIE = "peersolve_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function createAuthCookie(token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${AUTH_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${secure}`;
}

export function clearAuthCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return [
    `${AUTH_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`,
    `${LEGACY_AUTH_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`,
  ];
}
