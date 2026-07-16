const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { getSessionFromRequest } = require("@/lib/auth");
const { calcularSobretaxa } = require("@/lib/sobretaxa");

/**
 * Body: { condicao }
 * Permite atualizar/consultar a ficha de inspeção de um artigo mesmo depois da fatura
 * já ter sido emitida. Se a mancha difícil for marcada/desmarcada, a sobretaxa desse
 * item, e consequentemente o IVA e o total da fatura, são recalculados automaticamente.
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
  const novaSobretaxa = calcularSobretaxa(condicao);
  const antigaSobretaxa = Number(item.sobretaxa || 0);
  const precoSemSobretaxa = Number(item.subtotal) - antigaSobretaxa;
  const novoSubtotalItem = precoSemSobretaxa + novaSobretaxa;

  await prisma.faturaItem.update({
    where: { id: itemId },
    data: { condicao: condicao || null, sobretaxa: novaSobretaxa, subtotal: novoSubtotalItem },
  });

  // Recalcula os totais da fatura com base em todos os itens (após a alteração deste)
  const itensAtualizados = await prisma.faturaItem.findMany({ where: { faturaId } });
  const novoSubtotalBase = itensAtualizados.reduce((s, it) => s + (Number(it.subtotal) - Number(it.sobretaxa || 0)), 0);
  const novasSobretaxas = itensAtualizados.reduce((s, it) => s + Number(it.sobretaxa || 0), 0);
  const baseTributavel = novoSubtotalBase - Number(fatura.desconto) + novasSobretaxas;
  const ivaPercentagem = Number(fatura.ivaPercentagem);
  const ivaValor = Math.round(baseTributavel * (ivaPercentagem / 100) * 100) / 100;
  const novoTotal = Math.round((baseTributavel + ivaValor) * 100) / 100;

  const faturaAtualizada = await prisma.fatura.update({
    where: { id: faturaId },
    data: { subtotal: novoSubtotalBase, ivaValor, total: novoTotal },
    include: { itens: true, utilizador: true },
  });

  return NextResponse.json({
    item: { id: itemId, condicao: condicao || null, sobretaxa: novaSobretaxa, subtotal: novoSubtotalItem },
    fatura: {
      subtotal: Number(faturaAtualizada.subtotal),
      ivaValor: Number(faturaAtualizada.ivaValor),
      total: Number(faturaAtualizada.total),
    },
  });
}

module.exports = { PATCH };
