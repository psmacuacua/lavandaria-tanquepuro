const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { getSessionFromRequest } = require("@/lib/auth");
const { buildArticlesWorkbook } = require("@/lib/excel");

const runtime = "nodejs";

async function GET(req) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const artigos = await prisma.artigo.findMany({ include: { categoria: true }, orderBy: [{ categoriaId: "asc" }, { nome: "asc" }] });
  const data = artigos.map(a => ({
    nome: a.nome, categoria: a.categoria.nome,
    precoBase: Number(a.precoBase), precoDesconto: Number(a.precoDesconto), disponivel: a.disponivel,
  }));

  const buffer = buildArticlesWorkbook(data);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="artigos_lavandaria_tanque_puro.xlsx"`,
    },
  });
}

module.exports = { GET, runtime };
