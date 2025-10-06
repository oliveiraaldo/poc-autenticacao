import { NextRequest, NextResponse } from "next/server";
import redis from '@/lib/redis';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessiosId: string } }
) {
  try {
    const { sessiosId } = params;
    
    if (!sessiosId) {
      return NextResponse.json({ error: "sessiosId é obrigatório" }, { status: 400 });
    }

    // Busca os dados do usuário no Redis
    const userData = await redis.get(`user_data:${sessiosId}`);
    
    if (!userData) {
      return NextResponse.json({ error: "Dados do usuário não encontrados" }, { status: 404 });
    }

    const parsedData = JSON.parse(userData);
    return NextResponse.json(parsedData);

  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" }, 
      { status: 500 }
    );
  }
}
