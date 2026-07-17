const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { getSessionFromRequest } = require("@/lib/auth");
const { PAYMENT_METHOD_TO_ENUM, ENUM_TO_PAYMENT_METHOD, STATUS_OP_TO_ENUM, ENUM_TO_STATUS_OP } = require("@/lib/enums");
const { sendSms } = require("@/lib/sms");
const { getEmpresaConfig } = require("@/lib/empresaConfig");

function serialize(f) {
  return {
    id: f.id, numero: f.numero, clienteId: f.clienteId, data: f.dataCriacao,
    subtotal: Number(f.subtotal), desconto: Number(f.desconto),
    ivaPercentagem: Number(f.ivaPercentagem), ivaValor: Number(f.ivaValor), total: Number(f.total),
    status: f.status,
    statusOperacional: ENUM_TO_STATUS_OP[f.statusOperacional] || f.statusOperacional,
    metodoPagamento: f.metodoPagamento ? (ENUM_TO_PAYMENT_METHOD[f.metodoPagamento] || f.metodoPagamento) : null,
  };
}

/**
 * Body aceite (todos os campos opcionais):
 * { status, metodoPagamento, statusOperacional, avisarCliente }
 * Se avisarCliente=true e statusOperacional for "Pronto para Entrega", envia
 * automaticamente a mensagem "mensagemPronto" configurada ao cliente da fatura.
 */
async function PATCH(req, { params }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const id = Number(params.id);

  if (session.role !== "Admin") {
    const existing = await prisma.fatura.findUnique({ where: { id }, select: { utilizadorId: true } });
    if (!existing || existing.utilizadorId !== session.id) {
      return NextResponse.json({ error: "Só podes alterar pedidos que tu próprio atendeste." }, { status: 403 });
    }
  }

  const body = await req.json();
  const data = {};

  if (body.status) data.status = body.status === "Pago" ? "Pago" : "Pendente";
  if (body.metodoPagamento !== undefined) {
    data.metodoPagamento = body.metodoPagamento ? PAYMENT_METHOD_TO_ENUM[body.metodoPagamento] || null : null;
  }
  if (body.statusOperacional) {
    data.statusOperacional = STATUS_OP_TO_ENUM[body.statusOperacional] || "Pendente";
  }

  const fatura = await prisma.fatura.update({ where: { id }, data, include: { cliente: true } });

  let sms = null;
  if (body.avisarCliente && body.statusOperacional === "Pronto para Entrega") {
    const config = await getEmpresaConfig();
    sms = await sendSms(fatura.cliente.telefone, config.mensagemPronto, { nome: fatura.cliente.nome, empresa: config.nome });
  }

  return NextResponse.json({ invoice: serialize(fatura), sms });
}

module.exports = { PATCH };
