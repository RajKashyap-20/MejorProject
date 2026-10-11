import { clearAuthCookie } from "../../server/auth-cookie.js";
import { allowMethods, sendJson } from "../../server/http.js";

export default function logout(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;
  res.setHeader("Set-Cookie", clearAuthCookie());
  return sendJson(res, 200, { message: "You have been signed out." });
}
