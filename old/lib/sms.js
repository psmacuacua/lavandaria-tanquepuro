/**
 * Módulo de envio de SMS.
 *
 * Usa a Twilio por omissão (https://www.twilio.com). Para ativar:
 *   1. Cria uma conta na Twilio e compra/ativa um número.
 *   2. Define no .env:
 *        TWILIO_ACCOUNT_SID=...
 *        TWILIO_AUTH_TOKEN=...
 *        TWILIO_FROM_NUMBER=+1xxxxxxxxxx
 *
 * Se estas variáveis não estiverem definidas, o módulo funciona em "modo simulação":
 * regista a mensagem na consola do servidor em vez de a enviar de verdade — útil em
 * desenvolvimento ou enquanto a conta Twilio não está configurada.
 *
 * Para usar outro fornecedor (ex: um gateway local moçambicano de SMS/ M-Pesa SMS API),
 * troca apenas a função `sendViaProvider` por uma chamada à API desse fornecedor —
 * o resto do módulo (validação, templates, histórico) mantém-se igual.
 */

const TEMPLATES = {
  pronto: (nome) => `Ola ${nome}, a sua roupa na Lavandaria Tanque Puro esta pronta para entrega. Agradecemos a preferencia!`,
  entregue: (nome) => `Ola ${nome}, confirmamos a entrega do seu pedido na Lavandaria Tanque Puro. Obrigado!`,
  pendente_pagamento: (nome, valor) => `Ola ${nome}, tem um pagamento pendente de ${valor} na Lavandaria Tanque Puro. Obrigado.`,
  personalizada: (nome, texto) => texto,
};

function normalizePhone(raw) {
  if (!raw) return null;
  let s = String(raw).replace(/[^\d+]/g, "");
  if (!s) return null;
  if (!s.startsWith("+")) {
    // Assume Moçambique (+258) quando o número não tem indicativo internacional.
    s = s.startsWith("258") ? `+${s}` : `+258${s.replace(/^0+/, "")}`;
  }
  return s;
}

async function sendViaProvider(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    console.log(`[SMS - modo simulação] Para: ${to} | Mensagem: ${body}`);
    return { simulated: true, to, body };
  }

  const twilio = require("twilio")(sid, token);
  const msg = await twilio.messages.create({ to, from, body });
  return { simulated: false, sid: msg.sid, to, body };
}

/**
 * Envia um SMS a um único destinatário.
 * @param {string} telefone - número de telefone do cliente
 * @param {string} template - chave de TEMPLATES
 * @param {object} vars - variáveis para o template (nome, valor, texto...)
 */
async function sendSms(telefone, template, vars = {}) {
  const to = normalizePhone(telefone);
  if (!to) return { ok: false, error: "Número de telefone inválido ou em falta." };

  const build = TEMPLATES[template];
  if (!build) return { ok: false, error: `Template de SMS desconhecido: ${template}` };

  const body = build(vars.nome || "cliente", vars.valor || vars.texto || "");
  try {
    const result = await sendViaProvider(to, body);
    return { ok: true, ...result };
  } catch (e) {
    console.error("Erro ao enviar SMS:", e);
    return { ok: false, error: "Falha ao enviar SMS." };
  }
}

/** Envia SMS em massa a uma lista de {telefone, nome} — usado para avisos por categoria/estado. */
async function sendBulkSms(destinatarios, template, extraVarsFn = () => ({})) {
  const resultados = [];
  for (const dest of destinatarios) {
    const r = await sendSms(dest.telefone, template, { nome: dest.nome, ...extraVarsFn(dest) });
    resultados.push({ clienteId: dest.id, telefone: dest.telefone, ...r });
  }
  return resultados;
}

module.exports = { sendSms, sendBulkSms, normalizePhone, TEMPLATES };
