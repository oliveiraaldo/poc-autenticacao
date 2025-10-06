'use client';

interface MenuItem {
  nome: string;
  location?: string;
  subItens: MenuItem[];
}

interface MenuDisplayProps {
  menus: MenuItem[];
}

export default function MenuDisplay({ menus }: MenuDisplayProps) {
  if (!menus || menus.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Nenhum menu disponível.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Menu de Navegação</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {menus.map((menu, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <span className="text-blue-500 mr-2">📁</span>
                {menu.nome}
              </h4>
              
              {menu.subItens && menu.subItens.length > 0 && (
                <div className="space-y-1">
                  {menu.subItens.slice(0, 3).map((subItem, subIndex) => (
                    <div key={subIndex} className="flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors">
                      <span className="text-gray-400 mr-2">📄</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          {subItem.nome}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {menu.subItens.length > 3 && (
                    <div className="text-xs text-gray-500 text-center py-2">
                      +{menu.subItens.length - 3} itens adicionais
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
