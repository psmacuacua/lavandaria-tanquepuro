/**
 * Módulo de envio de SMS.
 *
 * Fornecedor principal: MozeSMS (https://www.mozesms.com/api) — gateway moçambicano.
 * Para ativar, define no .env:
 *        MOZESMS_API_KEY=mk_xxxxxxxxxxxxxxxxxxxxxxxx
 *        MOZESMS_API_SECRET=sk_xxxxxxxxxxxxxxxxxxxxxxxx
 *        MOZESMS_SENDER_ID=MozeSMS   (opcional, tem de estar aprovado na tua conta)
 *
 * Se preferires a Twilio como alternativa, define em vez disso:
 *        TWILIO_ACCOUNT_SID=...
 *        TWILIO_AUTH_TOKEN=...
 *        TWILIO_FROM_NUMBER=+1xxxxxxxxxx
 *
 * Se nenhum destes estiver configurado, o módulo funciona em "modo simulação":
 * regista a mensagem na consola do servidor em vez de a enviar de verdade.
 *
 * Os TEXTOS das mensagens não estão fixos no código — vêm da tabela empresa_config
 * (mensagemPronto, mensagemPortal, mensagemPromocional), editáveis pelo Admin em
 * Configurações. Usa placeholders entre chavetas, ex: {nome}, {empresa}, {link}.
 */

/**
 * Normaliza números moçambicanos para o formato internacional "+258XXXXXXXXX".
 * Aceita, entre outros:
 *   - "82 123 4567", "83-123-4567", "84.123.4567" (com espaços/traços/pontos)
 *   - "841234567" (9 dígitos, sem indicativo)
 *   - "084 123 4567" (com zero à esquerda, por hábito)
 *   - "258841234567" ou "+258841234567" (já com indicativo)
 * Números com outro indicativo internacional (ex: "+27...") são mantidos como estão.
 * Devolve null se não conseguir reconhecer um número válido.
 */
function normalizePhone(raw) {
  if (!raw) return null;
  const cleaned = String(raw).replace(/[^\d+]/g, "");
  if (!cleaned) return null;

  const hadPlus = cleaned.startsWith("+");
  let digits = (hadPlus ? cleaned.slice(1) : cleaned).replace(/^0+/, "");
  if (!digits) return null;

  if (!digits.startsWith("258")) {
    // Prefixos móveis moçambicanos: 82, 83, 84, 85, 86, 87 (9 dígitos no total).
    if (/^8[2-7]\d{7}$/.test(digits)) {
      digits = `258${digits}`;
    } else if (!hadPlus && digits.length === 9) {
      // 9 dígitos mas fora do padrão acima (ex: operadora nova) — assume Moçambique na mesma.
      digits = `258${digits}`;
    } else if (!hadPlus) {
      // Sem "+" e sem indicativo reconhecível: número demasiado curto/incompleto.
      return null;
    }
    // Se tinha "+" e não é 258, é outro indicativo internacional — mantém como está.
  }

  return `+${digits}`;
}

/** Substitui placeholders {chave} pelo valor correspondente em vars. Deixa por substituir o que não encontrar. */
function renderTemplate(template, vars = {}) {
  return String(template || "").replace(/\{(\w+)\}/g, (match, key) => (vars[key] !== undefined ? vars[key] : match));
}

async function sendViaMozeSms(to, body) {
  const apiKey = process.env.MOZESMS_API_KEY;
  const apiSecret = process.env.MOZESMS_API_SECRET;
  const senderId = process.env.MOZESMS_SENDER_ID || "MozeSMS";

  const phone = to.replace(/^\+/, ""); // MozeSMS espera o número sem "+", ex: 258841234567

  const res = await fetch("https://api.mozesms.com/sms/send", {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "X-API-Secret": apiSecret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone, message: body, sender_id: senderId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Erro MozeSMS (HTTP ${res.status})`);
  }

  const cost = data.data?.cost;
  const remainingBalance = data.data?.remaining_balance;
  // Estima quantas mensagens (deste mesmo custo por segmento) ainda podem ser enviadas com o saldo atual.
  const estimatedMessagesRemaining = (cost && remainingBalance !== undefined) ? Math.floor(remainingBalance / cost) : null;

  return {
    simulated: false,
    provider: "mozesms",
    id: data.data?.id,
    status: data.data?.status,
    parts: data.data?.parts,
    cost,
    remainingBalance,
    estimatedMessagesRemaining,
    to, body,
  };
}

/** Consulta o saldo actual da conta MozeSMS (em MZN) e uma estimativa de créditos/SMS restantes. */
async function getMozeSmsBalance() {
  const apiKey = process.env.MOZESMS_API_KEY;
  const apiSecret = process.env.MOZESMS_API_SECRET;
  if (!apiKey || !apiSecret) return { ok: false, error: "MozeSMS não está configurado (faltam as credenciais no .env)." };

  try {
    const res = await fetch("https://api.mozesms.com/account/balance", {
      headers: { "X-API-Key": apiKey, "X-API-Secret": apiSecret },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      return { ok: false, error: data.error || `Erro MozeSMS (HTTP ${res.status})` };
    }
    return {
      ok: true,
      balance: data.data?.balance,
      currency: data.data?.currency,
      smsCredits: data.data?.sms_credits,
      unitPriceMzn: data.data?.unit_price_mzn,
      estimatedSmsRemaining: data.data?.estimated_sms_remaining,
      plano: data.data?.plan?.name,
    };
  } catch (e) {
    console.error("Erro ao consultar saldo MozeSMS:", e);
    return { ok: false, error: "Falha ao consultar o saldo da conta MozeSMS." };
  }
}

async function sendViaTwilio(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  const twilio = require("twilio")(sid, token);
  const msg = await twilio.messages.create({ to, from, body });
  return { simulated: false, provider: "twilio", sid: msg.sid, to, body };
}

async function sendViaProvider(to, body) {
  if (process.env.MOZESMS_API_KEY && process.env.MOZESMS_API_SECRET) {
    return sendViaMozeSms(to, body);
  }
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
    return sendViaTwilio(to, body);
  }
  console.log(`[SMS - modo simulação] Para: ${to} | Mensagem: ${body}`);
  return { simulated: true, to, body };
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

module.exports = { sendSms, sendBulkSms, normalizePhone, renderTemplate, getMozeSmsBalance };
