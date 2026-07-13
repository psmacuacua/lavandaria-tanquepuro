const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { getSessionFromRequest } = require("@/lib/auth");
const bcrypt = require("bcryptjs");

function serialize(u) {
  return { id: u.id, username: u.username, nome: u.nome, role: u.role, mustChangePassword: u.mustChangePassword };
}

/** Admin edita nome/username/role de um utilizador e/ou repõe a password (sem precisar da antiga). */
async function PATCH(req, { params }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "Admin") return NextResponse.json({ error: "Apenas administradores." }, { status: 403 });

  const id = Number(params.id);
  const body = await req.json();
  const data = {};

  if (body.nome !== undefined) data.nome = body.nome.trim();
  if (body.username !== undefined) data.username = body.username.trim();
  if (body.role !== undefined) data.role = body.role === "Admin" ? "Admin" : "Funcionario";

  if (body.role && body.role !== "Admin") {
    const target = await prisma.utilizador.findUnique({ where: { id } });
    if (target?.role === "Admin") {
      const admins = await prisma.utilizador.count({ where: { role: "Admin" } });
      if (admins <= 1) return NextResponse.json({ error: "Tem de existir pelo menos um Admin." }, { status: 400 });
    }
  }

  if (body.novaPassword) {
    if (body.novaPassword.length < 6) {
      return NextResponse.json({ error: "A nova password deve ter pelo menos 6 caracteres." }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(body.novaPassword, 10);
    data.mustChangePassword = true; // força o utilizador a definir uma password própria no próximo login
  }

  try {
    const user = await prisma.utilizador.update({ where: { id }, data });
    return NextResponse.json({ user: serialize(user) });
  } catch (e) {
    if (e.code === "P2002") return NextResponse.json({ error: "Esse username já está em uso." }, { status: 409 });
    throw e;
  }
}

async function DELETE(req, { params }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "Admin") return NextResponse.json({ error: "Apenas administradores." }, { status: 403 });

  const id = Number(params.id);
  const target = await prisma.utilizador.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });

  if (target.username === session.username) {
    return NextResponse.json({ error: "Não podes remover o teu próprio utilizador." }, { status: 400 });
  }
  if (target.role === "Admin") {
    const admins = await prisma.utilizador.count({ where: { role: "Admin" } });
    if (admins <= 1) return NextResponse.json({ error: "Tem de existir pelo menos um Admin." }, { status: 400 });
  }

  await prisma.utilizador.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

module.exports = { PATCH, DELETE };
