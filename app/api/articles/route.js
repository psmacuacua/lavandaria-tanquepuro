const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { getSessionFromRequest } = require("@/lib/auth");

function serialize(a) {
  return {
    id: a.id,
    nome: a.nome,
    categoria: a.categoria.nome,
    categoriaId: a.categoriaId,
    precoBase: Number(a.precoBase),
    precoDesconto: Number(a.precoDesconto),
    disponivel: a.disponivel,
    criadoPor: a.criadoPor?.nome || null,
    atualizadoPor: a.atualizadoPor?.nome || null,
    atualizadoEm: a.atualizadoEm,
  };
}

async function GET(req) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const artigos = await prisma.artigo.findMany({
    include: { categoria: true, criadoPor: true, atualizadoPor: true },
    orderBy: { id: "asc" },
  });
  return NextResponse.json({ articles: artigos.map(serialize) });
}

async function POST(req) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { nome, categoria, precoBase, precoDesconto } = await req.json();
  if (!nome || !categoria || precoBase === undefined) {
    return NextResponse.json({ error: "Nome, categoria e preço base são obrigatórios." }, { status: 400 });
  }
  const cat = await prisma.categoria.findUnique({ where: { nome: categoria } });
  if (!cat) return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });

  const artigo = await prisma.artigo.create({
    data: {
      nome: nome.trim(),
      categoriaId: cat.id,
      precoBase,
      precoDesconto: precoDesconto ?? precoBase,
      disponivel: true,
      criadoPorId: session.id,
    },
    include: { categoria: true, criadoPor: true, atualizadoPor: true },
  });
  return NextResponse.json({ article: serialize(artigo) }, { status: 201 });
}

module.exports = { GET, POST };
