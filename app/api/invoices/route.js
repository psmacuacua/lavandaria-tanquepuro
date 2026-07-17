const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { getSessionFromRequest } = require("@/lib/auth");
const { PAYMENT_METHOD_TO_ENUM, ENUM_TO_PAYMENT_METHOD, ENUM_TO_STATUS_OP } = require("@/lib/enums");
const { getEmpresaConfig } = require("@/lib/empresaConfig");

function round2(n) { return Math.round(n * 100) / 100; }

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
      precoBase: Number(it.precoBaseUnitario), precoUnit: Number(it.precoUnitario),
      subtotal: Number(it.subtotal), comDesconto: it.comDesconto,
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

/**
 * Body: { clienteId, itens: [{ artigoId, nome, categoria, qtd, precoBase, precoUnit, comDesconto, condicao }], status, metodoPagamento }
 * Todos os totais (sobretaxa, subtotal, desconto, IVA, total) são recalculados aqui no
 * servidor a partir dos itens e da configuração atual — nunca confiamos em totais vindos
 * do browser, para evitar inconsistências se a taxa/sobretaxa tiver mudado entretanto.
 */
async function POST(req) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const { clienteId, itens, status, metodoPagamento } = body;

  if (!clienteId || !Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ error: "clienteId e itens são obrigatórios." }, { status: 400 });
  }

  const config = await getEmpresaConfig();
  const sobretaxaValor = Number(config.sobretaxaManchaDificil || 0);

  const itensProcessados = itens.map(it => {
    const qtd = Number(it.qtd) || 1;
    const precoBaseUnitario = Number(it.precoBase ?? it.precoUnit) || 0;
    const precoUnitario = Number(it.precoUnit) || 0;
    const sobretaxa = (it.condicao && it.condicao.manchaDificil) ? sobretaxaValor : 0;
    const subtotalItem = round2(precoUnitario * qtd + sobretaxa);
    return { ...it, qtd, precoBaseUnitario, precoUnitario, sobretaxa, subtotalItem };
  });

  const subtotalBase = round2(itensProcessados.reduce((s, it) => s + it.precoBaseUnitario * it.qtd, 0));
  const somaDescontada = round2(itensProcessados.reduce((s, it) => s + it.precoUnitario * it.qtd, 0));
  const desconto = round2(subtotalBase - somaDescontada);
  const sobretaxas = round2(itensProcessados.reduce((s, it) => s + it.sobretaxa, 0));
  const baseTributavel = round2(somaDescontada + sobretaxas);
  const ivaPercentagem = config.ivaAtivo ? Number(config.ivaPercentagem) : 0;
  const ivaValor = ivaPercentagem > 0 ? round2(baseTributavel * (ivaPercentagem / 100)) : 0;
  const total = round2(baseTributavel + ivaValor);

  const count = await prisma.fatura.count();
  const numero = `FT-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const fatura = await prisma.fatura.create({
    data: {
      numero,
      clienteId: Number(clienteId),
      utilizadorId: session.id,
      subtotal: subtotalBase, desconto, ivaPercentagem, ivaValor, total,
      status: status === "Pago" ? "Pago" : "Pendente",
      metodoPagamento: metodoPagamento ? PAYMENT_METHOD_TO_ENUM[metodoPagamento] || null : null,
      statusOperacional: "Pendente",
      itens: {
        create: itensProcessados.map(it => ({
          artigoId: it.artigoId || null,
          nomeArtigo: it.nome,
          categoria: it.categoria,
          quantidade: it.qtd,
          precoBaseUnitario: it.precoBaseUnitario,
          precoUnitario: it.precoUnitario,
          subtotal: it.subtotalItem,
          comDesconto: !!it.comDesconto,
          condicao: it.condicao || null,
          sobretaxa: it.sobretaxa,
        })),
      },
    },
    include: { itens: true, utilizador: true },
  });

  return NextResponse.json({ invoice: serialize(fatura) }, { status: 201 });
}

module.exports = { GET, POST };
