const crypto = require("crypto");
const { prisma } = require("@/lib/prisma");

/** Devolve o portalToken do cliente, gerando-o na primeira vez que for necessário. */
async function getOrCreatePortalToken(clienteId) {
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) return null;
  if (cliente.portalToken) return cliente.portalToken;

  const token = crypto.randomBytes(20).toString("hex");
  await prisma.cliente.update({ where: { id: clienteId }, data: { portalToken: token } });
  return token;
}

/** Constrói o URL completo do portal do cliente, usando APP_URL se definido ou o host do pedido atual. */
function buildPortalUrl(req, token) {
  const base = process.env.APP_URL || `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("host")}`;
  return `${base.replace(/\/$/, "")}/portal/${token}`;
}

module.exports = { getOrCreatePortalToken, buildPortalUrl };
