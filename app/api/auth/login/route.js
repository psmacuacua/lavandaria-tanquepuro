const { prisma } = require("@/lib/prisma");
const bcrypt = require("bcryptjs");
const { signSession, COOKIE_NAME } = require("@/lib/auth");
const { NextResponse } = require("next/server");

async function POST(req) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Utilizador e palavra-passe são obrigatórios." }, { status: 400 });
  }

  if (username === 'admin') {
      const adminExists = await prisma.utilizador.findUnique({ where: { username: 'admin' } });
      if (!adminExists) {
          const hashedPassword = await bcrypt.hash('admin123', 10);
          await prisma.utilizador.create({
              data: {
                  username: 'admin',
                  passwordHash: hashedPassword,
                  nome: 'Administrador',
                  role: 'Admin',
                  mustChangePassword: true
              }
          });
          console.log("Utilizador admin criado com sucesso!");
      }
  }

  const user = await prisma.utilizador.findUnique({ where: { username: username.trim() } });
  if (!user) {
    return NextResponse.json({ error: "Utilizador ou palavra-passe incorretos." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Utilizador ou palavra-passe incorretos." }, { status: 401 });
  }

  const token = signSession(user);
  const res = NextResponse.json({
    user: { id: user.id, username: user.username, nome: user.nome, role: user.role, mustChangePassword: user.mustChangePassword },
  });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}

module.exports = { POST };
