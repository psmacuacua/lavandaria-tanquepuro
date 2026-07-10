const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { getSessionFromRequest } = require("@/lib/auth");
const { sendSms } = require("@/lib/sms");

/**
 * Body esperado: { clienteId, template, texto? }
 * template: "pronto" | "entregue" | "pendente_pagamento" | "personalizada"
 */
async function POST(req) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { clienteId, template, texto, valor } = await req.json();
  if (!clienteId || !template) {
    return NextResponse.json({ error: "clienteId e template são obrigatórios." }, { status: 400 });
  }

  const cliente = await prisma.cliente.findUnique({ where: { id: Number(clienteId) } });
  if (!cliente) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  if (!cliente.telefone) return NextResponse.json({ error: "Este cliente não tem telefone registado." }, { status: 400 });

  const result = await sendSms(cliente.telefone, template, { nome: cliente.nome, texto, valor });
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}

module.exports = { POST };
