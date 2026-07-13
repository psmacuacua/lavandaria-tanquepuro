const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { getSessionFromRequest } = require("@/lib/auth");
const bcrypt = require("bcryptjs");

function serialize(u) {
  return { id: u.id, username: u.username, nome: u.nome, role: u.role, mustChangePassword: u.mustChangePassword };
}

async function GET(req) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "Admin") return NextResponse.json({ error: "Apenas administradores." }, { status: 403 });

  const users = await prisma.utilizador.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({ users: users.map(serialize) });
}

async function POST(req) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "Admin") return NextResponse.json({ error: "Apenas administradores." }, { status: 403 });

  const { username, password, nome, role } = await req.json();
  if (!username || !password || !nome) {
    return NextResponse.json({ error: "username, password e nome são obrigatórios." }, { status: 400 });
  }

  const existing = await prisma.utilizador.findUnique({ where: { username: username.trim() } });
  if (existing) return NextResponse.json({ error: "Já existe um utilizador com esse username." }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.utilizador.create({
    data: { username: username.trim(), passwordHash, nome: nome.trim(), role: role === "Admin" ? "Admin" : "Funcionario" },
  });
  return NextResponse.json({ user: serialize(user) }, { status: 201 });
}

module.exports = { GET, POST };
