const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { getSessionFromRequest } = require("@/lib/auth");
const { PAYMENT_METHOD_TO_ENUM, ENUM_TO_PAYMENT_METHOD, ENUM_TO_STATUS_OP } = require("@/lib/enums");
const { getEmpresaConfig } = require("@/lib/empresaConfig");

function serialize(f) {
  return {
    id: f.id,
    numero: f.numero,
    clienteId: f.clienteId,
    data: f.dataCriacao,
    subtotal: Number(f.subtotal),
    desconto: Number(f.desconto),
    ivaPercentagem: Number(f.ivaPercentagem),
    ivaValor: Number(f.ivaValor),
    total: Number(f.total),
    status: f.status,
    statusOperacional: ENUM_TO_STATUS_OP[f.statusOperacional] || f.statusOperacional,
    metodoPagamento: f.metodoPagamento ? (ENUM_TO_PAYMENT_METHOD[f.metodoPagamento] || f.metodoPagamento) : null,
    criadoPor: f.utilizador ? f.utilizador.nome : null,
    itens: f.itens.map(it => ({
      id: it.id, artigoId: it.artigoId,
      nome: it.nomeArtigo, categoria: it.categoria, qtd: it.quantidade,
      precoUnit: Number(it.precoUnitario), subtotal: Number(it.subtotal), comDesconto: it.comDesconto,
      condicao: it.condicao || null, sobretaxa: Number(it.sobretaxa || 0),
    })),
  };
}

async function GET(req) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const faturas = await prisma.fatura.findMany({
    where: session.role === "Admin" ? {} : { utilizadorId: session.id },
    include: { itens: true, utilizador: true },
    orderBy: { dataCriacao: "desc" },
  });
  return NextResponse.json({ invoices: faturas.map(serialize) });
}

async function POST(req) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const { clienteId, itens, subtotal, desconto, status, metodoPagamento } = body;

  if (!clienteId || !Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ error: "clienteId e itens são obrigatórios." }, { status: 400 });
  }

  const config = await getEmpresaConfig();
  const sobretaxas = itens.reduce((s, it) => s + Number(it.sobretaxa || 0), 0);
  const baseTributavel = Number(subtotal) - Number(desconto) + sobretaxas;
  const ivaPercentagem = config.ivaAtivo ? Number(config.ivaPercentagem) : 0;
  const ivaValor = config.ivaAtivo ? Math.round(baseTributavel * (ivaPercentagem / 100) * 100) / 100 : 0;
  const total = Math.round((baseTributavel + ivaValor) * 100) / 100;

  const count = await prisma.fatura.count();
  const numero = `FT-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const fatura = await prisma.fatura.create({
    data: {
      numero,
      clienteId: Number(clienteId),
      utilizadorId: session.id,
      subtotal, desconto, ivaPercentagem, ivaValor, total,
      status: status === "Pago" ? "Pago" : "Pendente",
      metodoPagamento: metodoPagamento ? PAYMENT_METHOD_TO_ENUM[metodoPagamento] || null : null,
      statusOperacional: "Pendente",
      itens: {
        create: itens.map(it => ({
          artigoId: it.artigoId || null,
          nomeArtigo: it.nome,
          categoria: it.categoria,
          quantidade: it.qtd,
          precoUnitario: it.precoUnit,
          subtotal: it.subtotal,
          comDesconto: !!it.comDesconto,
          condicao: it.condicao || null,
          sobretaxa: it.sobretaxa || 0,
        })),
      },
    },
    include: { itens: true, utilizador: true },
  });

  return NextResponse.json({ invoice: serialize(fatura) }, { status: 201 });
}

module.exports = { GET, POST };
