const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { getSessionFromRequest } = require("@/lib/auth");
const { ENUM_TO_STATUS_OP } = require("@/lib/enums");

/** Resumo de atividade de um utilizador — só o Admin pode consultar. */
async function GET(req, { params }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "Admin") return NextResponse.json({ error: "Apenas administradores." }, { status: 403 });

  const userId = Number(params.id);
  const utilizador = await prisma.utilizador.findUnique({ where: { id: userId } });
  if (!utilizador) return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });

  const faturas = await prisma.fatura.findMany({
    where: { utilizadorId: userId },
    include: { cliente: true },
    orderBy: { dataCriacao: "desc" },
  });

  const artigosCriados = await prisma.artigo.findMany({
    where: { criadoPorId: userId },
    include: { categoria: true },
    orderBy: { criadoEm: "desc" },
  });

  const artigosAtualizados = await prisma.artigo.findMany({
    where: { atualizadoPorId: userId, NOT: { criadoPorId: userId } },
    include: { categoria: true },
    orderBy: { atualizadoEm: "desc" },
  });

  const totalFaturado = faturas.filter(f => f.status === "Pago").reduce((s, f) => s + Number(f.total), 0);
  const totalPendente = faturas.filter(f => f.status === "Pendente").reduce((s, f) => s + Number(f.total), 0);

  return NextResponse.json({
    utilizador: { id: utilizador.id, nome: utilizador.nome, username: utilizador.username, role: utilizador.role, criadoEm: utilizador.criadoEm },
    resumo: {
      totalFaturas: faturas.length,
      totalFaturado: Math.round(totalFaturado * 100) / 100,
      totalPendente: Math.round(totalPendente * 100) / 100,
      totalArtigosCriados: artigosCriados.length,
      totalArtigosAtualizados: artigosAtualizados.length,
    },
    faturas: faturas.map(f => ({
      id: f.id, numero: f.numero, data: f.dataCriacao, cliente: f.cliente.nome,
      total: Number(f.total), status: f.status,
      statusOperacional: ENUM_TO_STATUS_OP[f.statusOperacional] || f.statusOperacional,
    })),
    artigosCriados: artigosCriados.map(a => ({
      id: a.id, nome: a.nome, categoria: a.categoria.nome, criadoEm: a.criadoEm,
      precoBase: Number(a.precoBase), disponivel: a.disponivel,
    })),
    artigosAtualizados: artigosAtualizados.map(a => ({
      id: a.id, nome: a.nome, categoria: a.categoria.nome, atualizadoEm: a.atualizadoEm,
      precoBase: Number(a.precoBase), disponivel: a.disponivel,
    })),
  });
}

module.exports = { GET };
