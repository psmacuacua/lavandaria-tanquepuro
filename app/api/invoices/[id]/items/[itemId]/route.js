const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { getSessionFromRequest } = require("@/lib/auth");
const { getEmpresaConfig } = require("@/lib/empresaConfig");

function round2(n) { return Math.round(n * 100) / 100; }

/**
 * Body: { condicao }
 * Permite atualizar/consultar a ficha de inspeção de um artigo mesmo depois da fatura
 * já ter sido emitida. Se a mancha difícil for marcada/desmarcada, a sobretaxa desse
 * item (usando o valor atual configurado), e consequentemente o desconto, o IVA e o
 * total da fatura, são recalculados a partir de TODOS os itens (fonte da verdade:
 * preco_base_unitario e preco_unitario de cada item, nunca o subtotal já com sobretaxa).
 */
async function PATCH(req, { params }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const faturaId = Number(params.id);
  const itemId = Number(params.itemId);

  const fatura = await prisma.fatura.findUnique({ where: { id: faturaId }, include: { itens: true } });
  if (!fatura) return NextResponse.json({ error: "Fatura não encontrada." }, { status: 404 });
  if (session.role !== "Admin" && fatura.utilizadorId !== session.id) {
    return NextResponse.json({ error: "Só podes alterar pedidos que tu próprio atendeste." }, { status: 403 });
  }

  const item = fatura.itens.find(i => i.id === itemId);
  if (!item) return NextResponse.json({ error: "Item não encontrado nesta fatura." }, { status: 404 });

  const { condicao } = await req.json();
  const config = await getEmpresaConfig();
  const sobretaxaValor = Number(config.sobretaxaManchaDificil || 0);
  const novaSobretaxa = (condicao && condicao.manchaDificil) ? sobretaxaValor : 0;
  const novoSubtotalItem = round2(Number(item.precoUnitario) * item.quantidade + novaSobretaxa);

  await prisma.faturaItem.update({
    where: { id: itemId },
    data: { condicao: condicao || null, sobretaxa: novaSobretaxa, subtotal: novoSubtotalItem },
  });

  // Recalcula os totais da fatura a partir de TODOS os itens (preços base/unitários, não o subtotal antigo)
  const itensAtualizados = await prisma.faturaItem.findMany({ where: { faturaId } });
  const novoSubtotalBase = round2(itensAtualizados.reduce((s, it) => s + Number(it.precoBaseUnitario) * it.quantidade, 0));
  const somaDescontada = round2(itensAtualizados.reduce((s, it) => s + Number(it.precoUnitario) * it.quantidade, 0));
  const novoDesconto = round2(novoSubtotalBase - somaDescontada);
  const novasSobretaxas = round2(itensAtualizados.reduce((s, it) => s + Number(it.sobretaxa || 0), 0));
  const baseTributavel = round2(somaDescontada + novasSobretaxas);
  const ivaPercentagem = Number(fatura.ivaPercentagem);
  const ivaValor = ivaPercentagem > 0 ? round2(baseTributavel * (ivaPercentagem / 100)) : 0;
  const novoTotal = round2(baseTributavel + ivaValor);

  const faturaAtualizada = await prisma.fatura.update({
    where: { id: faturaId },
    data: { subtotal: novoSubtotalBase, desconto: novoDesconto, ivaValor, total: novoTotal },
    include: { itens: true, utilizador: true },
  });

  return NextResponse.json({
    item: { id: itemId, condicao: condicao || null, sobretaxa: novaSobretaxa, subtotal: novoSubtotalItem },
    fatura: {
      subtotal: Number(faturaAtualizada.subtotal),
      desconto: Number(faturaAtualizada.desconto),
      ivaPercentagem: Number(faturaAtualizada.ivaPercentagem),
      ivaValor: Number(faturaAtualizada.ivaValor),
      total: Number(faturaAtualizada.total),
    },
  });
}

module.exports = { PATCH };
