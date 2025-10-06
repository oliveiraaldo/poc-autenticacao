import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import TokensClient from './TokensClient';

function secret() {
  return new TextEncoder().encode(process.env.NEXT_AUTH_JWT_SECRET);
}

async function getUserData() {
  const cookieName = process.env.AUTH_COOKIE_NAME || "pcon_token";
  const store = await cookies();  
  const token = store.get(cookieName)?.value;
  
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret());
    const sessiosId = (payload as any).sessiosId;
    
    if (!sessiosId) {
      return null;
    }

    // Busca os dados completos no Redis
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:24731'}/api/user-data/${sessiosId}`);
    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

export default async function TokensPage() {
  const userData = await getUserData();

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Erro</h1>
          <p className="text-gray-600 mb-6">Token não encontrado. Faça login primeiro.</p>
          <a 
            href="/" 
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Voltar para o início
          </a>
        </div>
      </div>
    );
  }

  return <TokensClient userData={userData} />;
}
