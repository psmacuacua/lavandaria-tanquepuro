const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { getSessionFromRequest } = require("@/lib/auth");

async function PATCH(req, { params }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const id = Number(params.id);
  const body = await req.json();
  const client = await prisma.cliente.update({
    where: { id },
    data: {
      ...(body.nome !== undefined ? { nome: body.nome } : {}),
      ...(body.telefone !== undefined ? { telefone: body.telefone } : {}),
      ...(body.endereco !== undefined ? { endereco: body.endereco } : {}),
    },
  });
  return NextResponse.json({ client });
}

async function DELETE(req, { params }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const id = Number(params.id);
  if (id === 1) {
    return NextResponse.json({ error: "Não é possível remover o Cliente Balcão." }, { status: 400 });
  }
  await prisma.cliente.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

module.exports = { PATCH, DELETE };
