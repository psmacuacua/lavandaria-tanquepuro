import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = 'force-dynamic';

function serialize(a) {
  return {
    id: a.id,
    nome: a.nome,
    categoria: a.categoria.nome,
    categoriaId: a.categoriaId,
    precoBase: Number(a.precoBase),
    precoDesconto: Number(a.precoDesconto),
    disponivel: a.disponivel,
  };
}

export async function GET(req) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const artigos = await prisma.artigo.findMany({ 
      include: { categoria: true }, 
      orderBy: { id: "asc" } 
    });
    // Alterei a chave para "artigos" para manter consistência com o nome da pasta
    return NextResponse.json({ artigos: artigos.map(serialize) });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar artigos" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const { nome, categoria, precoBase, precoDesconto } = await req.json();
    
    if (!nome || !categoria || precoBase === undefined) {
      return NextResponse.json({ error: "Nome, categoria e preço base são obrigatórios." }, { status: 400 });
    }
    
    const cat = await prisma.categoria.findUnique({ where: { nome: categoria } });
    if (!cat) return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });

    const artigo = await prisma.artigo.create({
      data: {
        nome: nome.trim(),
        categoriaId: cat.id,
        precoBase,
        precoDesconto: precoDesconto ?? precoBase,
        disponivel: true,
      },
      include: { categoria: true },
    });
    
    return NextResponse.json({ artigo: serialize(artigo) }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar artigo:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}