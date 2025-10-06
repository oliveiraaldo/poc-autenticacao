'use client';

interface UserData {
  token: string;
  payload: any;
  attrs: any;
  casJwtData: any;
}

interface TokensClientProps {
  userData: UserData | null;
}

export default function TokensClient({ userData }: TokensClientProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`${label} copiado para a área de transferência!`);
    }).catch(err => {
      console.error('Erro ao copiar:', err);
    });
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Dados não encontrados</h1>
          <p className="text-gray-600 mb-6">Não foi possível carregar os dados do usuário.</p>
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

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-green-600">🎉 Autenticação CAS Realizada com Sucesso!</h1>
            <a 
              href="/" 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              ← Voltar ao início
            </a>
          </div>

          <div className="space-y-8">
            {/* Token JWT */}
            <div>
              <h2 className="text-xl font-semibold text-blue-600 mb-4">🔑 Token JWT</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <pre className="text-xs text-gray-700 break-all whitespace-pre-wrap">
                  {userData.token}
                </pre>
                <button
                  onClick={() => copyToClipboard(userData.token, 'Token')}
                  className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Copiar Token
                </button>
              </div>
            </div>

            {/* Dados do Usuário */}
            <div>
              <h2 className="text-xl font-semibold text-blue-600 mb-4">👤 Dados do Usuário (JSON Completo)</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(userData.payload, null, 2)}
                </pre>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(userData.payload, null, 2), 'Dados do usuário')}
                  className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Copiar JSON
                </button>
              </div>
            </div>

            {/* Dados CAS Originais */}
            <div>
              <h2 className="text-xl font-semibold text-blue-600 mb-4">🏛️ Dados CAS Originais</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(userData.attrs, null, 2)}
                </pre>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(userData.attrs, null, 2), 'Dados CAS')}
                  className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Copiar Dados CAS
                </button>
              </div>
            </div>

            {/* JWT do CAS Decodificado */}
            {userData.casJwtData && (
              <div>
                <h2 className="text-xl font-semibold text-blue-600 mb-4">🔓 JWT do CAS Decodificado</h2>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(userData.casJwtData, null, 2)}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(userData.casJwtData, null, 2), 'JWT CAS Decodificado')}
                    className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    Copiar JWT CAS Decodificado
                  </button>
                </div>
              </div>
            )}

            {/* Status de sucesso */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="text-green-500 text-2xl mr-3">✅</div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Cookie de autenticação definido com sucesso!</h3>
                  <p className="text-green-700 mt-1">
                    Você pode agora acessar a página inicial para ver os dados carregados automaticamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
