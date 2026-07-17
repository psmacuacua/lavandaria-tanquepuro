const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { ENUM_TO_STATUS_OP } = require("@/lib/enums");
const { getEmpresaConfig } = require("@/lib/empresaConfig");

/**
 * Rota pública (sem sessão) — o token funciona como "chave" de acesso, enviado por SMS
 * ao cliente. Não expõe dados de outros clientes nem requer login.
 */
async function GET(req, { params }) {
  const { token } = params;
  if (!token) return NextResponse.json({ error: "Token em falta." }, { status: 400 });

  const cliente = await prisma.cliente.findUnique({ where: { portalToken: token } });
  if (!cliente) return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 404 });

  const faturas = await prisma.fatura.findMany({
    where: { clienteId: cliente.id },
    include: { itens: true },
    orderBy: { dataCriacao: "desc" },
  });

  const config = await getEmpresaConfig();

  const historico = faturas.map(f => ({
    numero: f.numero,
    data: f.dataCriacao,
    total: Number(f.total),
    status: f.status,
    statusOperacional: ENUM_TO_STATUS_OP[f.statusOperacional] || f.statusOperacional,
    itens: f.itens.map(it => ({ nome: it.nomeArtigo, qtd: it.quantidade })),
  }));

  const pendentes = historico.filter(f => f.status === "Pendente");
  const totalDivida = Math.round(pendentes.reduce((s, f) => s + f.total, 0) * 100) / 100;

  return NextResponse.json({
    cliente: { nome: cliente.nome },
    empresa: { nome: config.nome, logoUrl: config.logoUrl },
    totalDivida,
    faturasPendentes: pendentes,
    historico,
  });
}

module.exports = { GET };
