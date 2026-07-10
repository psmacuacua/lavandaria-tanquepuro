const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { getSessionFromRequest } = require("@/lib/auth");

async function PATCH(req, { params }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const id = Number(params.id);
  const body = await req.json();
  const data = {};
  if (body.precoBase !== undefined) data.precoBase = body.precoBase;
  if (body.precoDesconto !== undefined) data.precoDesconto = body.precoDesconto;
  if (body.disponivel !== undefined) data.disponivel = body.disponivel;
  if (body.nome !== undefined) data.nome = body.nome;

  const artigo = await prisma.artigo.update({ where: { id }, data, include: { categoria: true } });
  return NextResponse.json({
    article: {
      id: artigo.id, nome: artigo.nome, categoria: artigo.categoria.nome,
      precoBase: Number(artigo.precoBase), precoDesconto: Number(artigo.precoDesconto), disponivel: artigo.disponivel,
    },
  });
}

async function DELETE(req, { params }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const id = Number(params.id);
  await prisma.artigo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

module.exports = { PATCH, DELETE };
