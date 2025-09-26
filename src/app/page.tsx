import { cookies } from "next/headers";
import { jwtVerify } from "jose";

function secret() {
  return new TextEncoder().encode(process.env.NEXT_AUTH_JWT_SECRET!);
}

async function getUser() {
  const name = process.env.AUTH_COOKIE_NAME || "pcon_token";
  console.log("Nome do cookie:", name); // Log do nome do cookie para depuração
  if (!name) return null;
  const store = await cookies();  
  const token = store.get(name)?.value;
  console.log("Token do cookie:", token); // Log do token para depuração
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const user = await getUser();
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Bem-vindo!</h1>
        {user ? (
          <div className="p-4 bg-green-100 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Usuário autenticado:</h2>
              <a 
                href="/api/auth/logout" 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </a>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Nome:</strong> {(user as any).name || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Email:</strong> {(user as any).email || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>ID:</strong> {(user as any).sub || 'N/A'}
              </p>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  Ver dados completos (JSON)
                </summary>
                <pre className="bg-white p-2 rounded mt-2 text-xs overflow-x-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-yellow-100 rounded-lg">
            <p>Usuário não autenticado. <a href="/api/auth/cas/login" className="text-blue-600 underline">Fazer login</a></p>
          </div>
        )}
      </div>
    </main>
  );
}
