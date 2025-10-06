import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import MenuDisplay from './components/MenuDisplay';

function secret() {
  return new TextEncoder().encode(process.env.NEXT_AUTH_JWT_SECRET);
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

async function getMenu() {
  const menuName = process.env.AUTH_COOKIE_MENU_NAME || "pcon_menu";
  console.log("🔍 DEBUG - Nome do cookie do menu:", menuName);
  const store = await cookies();
  const menuData = store.get(menuName)?.value;
  console.log("🔍 DEBUG - Dados do menu do cookie:", menuData);
  
  if (!menuData) {
    console.log("🔍 DEBUG - Nenhum dado de menu encontrado");
    return null;
  }
  
  try {
    const parsed = JSON.parse(menuData);
    console.log("🔍 DEBUG - Menu parseado com sucesso:", parsed);
    return parsed;
  } catch (error) {
    console.log("🔍 DEBUG - Erro ao fazer parse do menu:", error);
    return null;
  }
}

export default async function HomePage() {
  const user = await getUser();
  const menu = await getMenu();
  
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Bem-vindo!</h1>
          <p className="text-gray-600">Sistema de Autenticação CAS</p>
        </div>

        {user ? (
          <div className="space-y-8">
            {/* Informações do Usuário */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-800">👤 Usuário Autenticado</h2>
                <div className="flex gap-2">
                  <a 
                    href="/tokens" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Ver Tokens
                  </a>
                  <a 
                    href="/api/auth/logout" 
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Logout
                  </a>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Nome</p>
                  <p className="font-medium text-gray-900">{(user as any).name || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-medium text-gray-900">{(user as any).email || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">ID</p>
                  <p className="font-medium text-gray-900">{(user as any).sub || 'N/A'}</p>
                </div>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  Ver dados completos (JSON)
                </summary>
                <pre className="bg-gray-100 p-4 rounded-lg mt-2 text-xs overflow-x-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </details>
            </div>

            {/* Debug do Menu */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 Debug do Menu</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Menu carregado:</strong> {menu ? '✅ Sim' : '❌ Não'}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Tipo:</strong> {typeof menu}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Quantidade de itens:</strong> {menu ? menu.length : 0}
                  </p>
                </div>
                
                {menu && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">📋 Dados do Menu (JSON):</h4>
                    <pre className="text-xs text-blue-700 overflow-x-auto bg-white p-3 rounded border">
                      {JSON.stringify(menu, null, 2)}
                    </pre>
                  </div>
                )}
                
                {menu && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">🎨 Menu Renderizado:</h4>
                    <MenuDisplay menus={menu} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="text-yellow-500 text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">Usuário não autenticado</h2>
            <p className="text-yellow-700 mb-4">Faça login para acessar o sistema.</p>
            <a 
              href="/api/auth/cas/login" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
            >
              Fazer Login
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
