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
 * regista a mensagem na consola do servidor em vez de a enviar de verdade.
 *
 * Os TEXTOS das mensagens não estão fixos no código — vêm da tabela empresa_config
 * (mensagemPronto, mensagemPortal, mensagemPromocional), editáveis pelo Admin em
 * Configurações. Usa placeholders entre chavetas, ex: {nome}, {empresa}, {link}.
 */

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

/** Substitui placeholders {chave} pelo valor correspondente em vars. Deixa por substituir o que não encontrar. */
function renderTemplate(template, vars = {}) {
  return String(template || "").replace(/\{(\w+)\}/g, (match, key) => (vars[key] !== undefined ? vars[key] : match));
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
 * Envia um SMS a um único destinatário, a partir de um texto de modelo (com placeholders) já pronto.
 * @param {string} telefone - número de telefone do cliente
 * @param {string} template - texto do modelo, ex: "Olá {nome}, ..."
 * @param {object} vars - variáveis para substituir no template
 */
async function sendSms(telefone, template, vars = {}) {
  const to = normalizePhone(telefone);
  if (!to) return { ok: false, error: "Número de telefone inválido ou em falta." };
  if (!template) return { ok: false, error: "Modelo de mensagem vazio." };

  const body = renderTemplate(template, vars);
  try {
    const result = await sendViaProvider(to, body);
    return { ok: true, ...result };
  } catch (e) {
    console.error("Erro ao enviar SMS:", e);
    return { ok: false, error: "Falha ao enviar SMS." };
  }
}

/** Envia SMS em massa a uma lista de {id, telefone, nome} — usado para avisos por categoria/estado. */
async function sendBulkSms(destinatarios, template, extraVarsFn = () => ({})) {
  const resultados = [];
  for (const dest of destinatarios) {
    const r = await sendSms(dest.telefone, template, { nome: dest.nome, ...extraVarsFn(dest) });
    resultados.push({ clienteId: dest.id, telefone: dest.telefone, ...r });
  }
  return resultados;
}

module.exports = { sendSms, sendBulkSms, normalizePhone, renderTemplate };
