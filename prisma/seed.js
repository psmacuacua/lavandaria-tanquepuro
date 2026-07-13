const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const articles = require("./articles.json");

const prisma = new PrismaClient();

const CATEGORIAS = [
  { nome: "Lavagem Normal", corHex: "#2F6FED" },
  { nome: "Engomagem", corHex: "#B4519A" },
  { nome: "Lavagem Urgente", corHex: "#E2492F" },
  { nome: "Lavagem a Seco", corHex: "#1F8A82" },
  { nome: "Limpeza de Sofá", corHex: "#8A5A2B" },
  { nome: "Capa e Tapete", corHex: "#3C8F4C" },
];

async function main() {
  console.log("A semear categorias...");
  const catMap = {};
  for (const c of CATEGORIAS) {
    const created = await prisma.categoria.upsert({
      where: { nome: c.nome },
      update: {},
      create: c,
    });
    catMap[c.nome] = created.id;
  }

  console.log("A semear utilizador admin...");
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.utilizador.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash,
      nome: "Administrador",
      role: "Admin",
    },
  });

  console.log("A semear cliente balcão...");
  const balcao = await prisma.cliente.findFirst({ where: { nome: "Cliente Balcão" } });
  if (!balcao) {
    await prisma.cliente.create({ data: { nome: "Cliente Balcão", telefone: "", endereco: "" } });
  }

  console.log(`A semear ${articles.length} artigos...`);
  const existing = await prisma.artigo.count();
  if (existing === 0) {
    const data = articles.map(a => ({
      categoriaId: catMap[a.categoria],
      nome: a.nome,
      precoBase: a.precoBase,
      precoDesconto: a.precoDesconto,
      disponivel: a.disponivel,
    }));
    // MySQL createMany em lotes
    const CHUNK = 200;
    for (let i = 0; i < data.length; i += CHUNK) {
      await prisma.artigo.createMany({ data: data.slice(i, i + CHUNK) });
    }
  } else {
    console.log("Artigos já existem, a saltar importação.");
  }

  console.log("Seed concluído.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
