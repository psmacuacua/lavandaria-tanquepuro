const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { getSessionFromRequest } = require("@/lib/auth");
const { sendSms } = require("@/lib/sms");
const { getEmpresaConfig } = require("@/lib/empresaConfig");
const { getOrCreatePortalToken, buildPortalUrl } = require("@/lib/portalToken");

/** Body: { clienteId } — envia a mensagem "mensagemPortal" com o link de acesso ao portal do cliente. */
async function POST(req) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { clienteId } = await req.json();
  if (!clienteId) return NextResponse.json({ error: "clienteId é obrigatório." }, { status: 400 });

  const cliente = await prisma.cliente.findUnique({ where: { id: Number(clienteId) } });
  if (!cliente) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  if (!cliente.telefone) return NextResponse.json({ error: "Este cliente não tem telefone registado." }, { status: 400 });

  const token = await getOrCreatePortalToken(cliente.id);
  const link = buildPortalUrl(req, token);
  const config = await getEmpresaConfig();
  const result = await sendSms(cliente.telefone, config.mensagemPortal, { nome: cliente.nome, empresa: config.nome, link });
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ ...result, link });
}

module.exports = { POST };
