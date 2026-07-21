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

  const totalFaturas = await prisma.fatura.count({ where: { clienteId: id } });
  if (totalFaturas > 0) {
    return NextResponse.json({
      error: `Este cliente tem ${totalFaturas} factura${totalFaturas > 1 ? "s" : ""} associada${totalFaturas > 1 ? "s" : ""} e não pode ser removido, para preservar o histórico. Podes editar os dados dele (nome, telefone, endereço) em vez de o apagar.`,
    }, { status: 400 });
  }

  try {
    await prisma.cliente.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e.code === "P2003") {
      return NextResponse.json({ error: "Este cliente ainda está associado a registos existentes e não pode ser removido." }, { status: 400 });
    }
    throw e;
  }
}

module.exports = { PATCH, DELETE };
