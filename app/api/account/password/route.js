const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { getSessionFromRequest, signSession, COOKIE_NAME } = require("@/lib/auth");
const bcrypt = require("bcryptjs");

/** Body: { currentPassword, newPassword } — o utilizador autenticado altera a sua própria password. */
async function POST(req) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Password atual e nova password são obrigatórias." }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "A nova password deve ter pelo menos 6 caracteres." }, { status: 400 });
  }

  const user = await prisma.utilizador.findUnique({ where: { id: session.id } });
  if (!user) return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Password atual incorreta." }, { status: 401 });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const updated = await prisma.utilizador.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  // Reemite a sessão já com mustChangePassword=false
  const token = signSession(updated);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12,
  });
  return res;
}

module.exports = { POST };
