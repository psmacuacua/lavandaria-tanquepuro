const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { getSessionFromRequest } = require("@/lib/auth");
const crypto = require("crypto");

async function GET(req) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const clients = await prisma.cliente.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({ clients });
}

async function POST(req) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { nome, telefone, endereco } = await req.json();
  if (!nome || !nome.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
  }
  const client = await prisma.cliente.create({
    data: { nome: nome.trim(), telefone: telefone || "", endereco: endereco || "", portalToken: crypto.randomBytes(20).toString("hex") },
  });
  return NextResponse.json({ client }, { status: 201 });
}

module.exports = { GET, POST };
