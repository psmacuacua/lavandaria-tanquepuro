const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { getSessionFromRequest } = require("@/lib/auth");

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

module.exports = { DELETE };
