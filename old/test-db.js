require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Lista todas as propriedades do objeto prisma (que correspondem às tabelas no schema.prisma)
    const modelos = Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$'));
    console.log("Modelos (tabelas) reconhecidos pelo Prisma:", modelos);

    if (modelos.length === 0) {
        console.log("ERRO: O Prisma não reconhece nenhuma tabela. Execute 'npx prisma generate'.");
        return;
    }

    // Tenta fazer um count no primeiro modelo encontrado para confirmar conexão
    const nomeModelo = modelos[0];
    const count = await prisma[nomeModelo].count();
    console.log(`Conexão OK! A tabela '${nomeModelo}' tem ${count} registos.`);

  } catch (e) {
    console.error("ERRO DE CONEXÃO:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();