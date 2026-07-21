const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const COOKIE_NAME = "ltp_session";

// Tecto de segurança do cookie/token (não é o timeout de inatividade — esse é
// aplicado do lado do cliente, em context/AuthContext.js, e fecha a sessão mais cedo
// se não houver atividade real do utilizador).
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function signSession(user) {
  return jwt.sign(
    { id: user.id, username: user.username, nome: user.nome, role: user.role, mustChangePassword: !!user.mustChangePassword },
    SECRET,
    { expiresIn: SESSION_MAX_AGE_SECONDS }
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

module.exports = { signSession, verifySession, getSessionFromRequest, COOKIE_NAME, SESSION_MAX_AGE_SECONDS };
