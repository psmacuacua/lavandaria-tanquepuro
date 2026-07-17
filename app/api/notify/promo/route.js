const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { getSessionFromRequest } = require("@/lib/auth");
const { sendSms, sendBulkSms } = require("@/lib/sms");
const { getEmpresaConfig } = require("@/lib/empresaConfig");

/**
 * Body: { clienteId } para um único cliente, ou { todos: true } para enviar a todos
 * os clientes com telefone registado. Usa a mensagem "mensagemPromocional" configurada.
 */
async function POST(req) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { clienteId, todos } = await req.json();
  const config = await getEmpresaConfig();

  if (todos) {
    const clientes = await prisma.cliente.findMany({ where: { telefone: { not: null } } });
    const comTelefone = clientes.filter(c => c.telefone && c.telefone.trim());
    const resultados = await sendBulkSms(comTelefone, config.mensagemPromocional, () => ({ empresa: config.nome }));
    const enviados = resultados.filter(r => r.ok).length;
    return NextResponse.json({ ok: true, total: comTelefone.length, enviados, resultados });
  }

  if (!clienteId) return NextResponse.json({ error: "clienteId ou todos são obrigatórios." }, { status: 400 });
  const cliente = await prisma.cliente.findUnique({ where: { id: Number(clienteId) } });
  if (!cliente) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  if (!cliente.telefone) return NextResponse.json({ error: "Este cliente não tem telefone registado." }, { status: 400 });

  const result = await sendSms(cliente.telefone, config.mensagemPromocional, { nome: cliente.nome, empresa: config.nome });
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}

module.exports = { POST };
