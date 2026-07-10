import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { buildArticlesWorkbook } from "@/lib/excel";

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const artigos = await prisma.artigo.findMany({ 
      include: { categoria: true }, 
      orderBy: [{ categoriaId: "asc" }, { nome: "asc" }] 
    });

    const data = artigos.map(a => ({
      nome: a.nome, 
      categoria: a.categoria.nome,
      precoBase: Number(a.precoBase), 
      precoDesconto: Number(a.precoDesconto), 
      disponivel: a.disponivel,
    }));

    const buffer = await buildArticlesWorkbook(data); // Adicionado 'await' caso a função seja assíncrona

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="artigos_lavandaria_tanque_puro.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Erro na exportação:", error);
    return NextResponse.json({ error: "Erro ao exportar ficheiro." }, { status: 500 });
  }
}