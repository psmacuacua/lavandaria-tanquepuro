const { NextResponse } = require("next/server");
const { getSessionFromRequest } = require("@/lib/auth");
const { getMozeSmsBalance } = require("@/lib/sms");

/** Consulta o saldo actual da conta MozeSMS (admin, para acompanhar créditos disponíveis). */
async function GET(req) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "Admin") return NextResponse.json({ error: "Apenas administradores." }, { status: 403 });

  const result = await getMozeSmsBalance();
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}

module.exports = { GET };
