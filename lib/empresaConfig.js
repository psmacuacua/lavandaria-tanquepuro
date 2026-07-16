const { prisma } = require("@/lib/prisma");

/** Devolve sempre a linha de configuração (id=1), criando-a com valores por omissão se ainda não existir. */
async function getEmpresaConfig() {
  const existing = await prisma.empresaConfig.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.empresaConfig.create({ data: { id: 1 } });
}

module.exports = { getEmpresaConfig };
