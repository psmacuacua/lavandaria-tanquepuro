import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signSession, COOKIE_NAME } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password } = body;

    const user = await prisma.utilizador.findUnique({ 
      where: { username: username.trim() } 
    });
    
    if (!user) {
      console.log("DEBUG: Utilizador não encontrado");
      return NextResponse.json({ error: "Utilizador ou palavra-passe incorretos." }, { status: 401 });
    }

    // DEBUG: Ver o que exatamente temos no objeto user
    console.log("DEBUG: Objeto user completo:", JSON.stringify(user));

    // O Prisma muitas vezes converte 'password_hash' (no banco) para 'passwordHash' (no JS) 
    // se estiver assim definido no schema.prisma. Vamos verificar ambos:
    const hashParaTestar = user.password_hash || user.passwordHash;

    if (!hashParaTestar) {
      console.error("ERRO: Nenhuma password encontrada no objeto user. Verifique o schema.prisma.");
      return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }

    const valid = await bcrypt.compare(password, hashParaTestar);
    
    if (!valid) {
      console.log("DEBUG: Password inválida para:", username);
      return NextResponse.json({ error: "Utilizador ou palavra-passe incorretos." }, { status: 401 });
    }

    const token = signSession(user);
    const res = NextResponse.json({ success: true });
    
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 12,
      secure: process.env.NODE_ENV === "production",
    });
    
    return res;
  } catch (error) {
    console.error("DEBUG: ERRO CRÍTICO NO LOGIN:", error);
    return NextResponse.json({ error: "Erro interno", details: error.message }, { status: 500 });
  }
}