const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const COOKIE_NAME = "ltp_session";

function signSession(user) {
  return jwt.sign(
    { id: user.id, username: user.username, nome: user.nome, role: user.role },
    SECRET,
    { expiresIn: "12h" }
  );
}

function verifySession(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (e) {
    return null;
  }
}

function getSessionFromRequest(req) {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  return verifySession(decodeURIComponent(match[1]));
}

module.exports = { signSession, verifySession, getSessionFromRequest, COOKIE_NAME };
