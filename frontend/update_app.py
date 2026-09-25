# -*- coding: utf-8 -*-
import os

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Default Tab
content = content.replace("useState<'kanban' | 'dashboard' | 'alertas' | 'gestion'>('kanban')", "useState<'kanban' | 'dashboard' | 'alertas' | 'gestion'>('gestion')")

# 2. Re-write the header and nav block
start_str = '      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">'
end_str = '      </header>'

idx1 = content.find(start_str)
idx2 = content.find(end_str, idx1)

if idx1 != -1 and idx2 != -1:
    new_header = '''      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="h-1 w-full bg-bogota-primary"></div>
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
          <div className="flex flex-col lg:flex-row justify-between min-h-[112px] py-2 items-center gap-4">
            
            {/* Left side: RADAR Logo and Text */}
            <div className="flex items-center gap-4 flex-shrink-0 w-full lg:w-auto justify-between lg:justify-start">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 flex items-center justify-center p-1">
                  <img src="/radar-logo.png" alt="RADAR Logo" className="h-16 md:h-20 w-auto object-contain" />
                </div>
                <div className="flex flex-col border-l-2 pl-4 border-gray-200 justify-center">
                  <span className="text-[12px] md:text-[13px] font-bold text-gray-800 uppercase tracking-wide leading-tight">Secretaría Distrital de Gobierno</span>
                  <span className="text-[11px] md:text-[12px] font-semibold text-gray-600 mb-1">Unidad de Transformación</span>
                  <span className="text-[9px] md:text-[10px] text-gray-400 italic leading-tight max-w-[200px]">
                    Red de Articulación, Datos, Alertas y Resultados
                  </span>
                </div>
              </div>
              
              {/* Mobile User/Logout */}
              <div className="flex lg:hidden flex-col items-end gap-1">
                <span className="text-xs font-semibold text-gray-700 truncate max-w-[100px]">{userName}</span>
                <button onClick={handleLogout} className="text-xs font-medium text-bogota-primary hover:text-red-700 transition-colors">Salir</button>
              </div>
            </div>
            
            {/* Middle: Navigation Tabs */}
            {userData && !isAlertaRoute && (
              <nav className="flex flex-wrap justify-center gap-2 lg:gap-3 flex-shrink-0 lg:flex-1 lg:justify-center">
                <button 
                  onClick={() => setActiveTab('kanban')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'kanban' ? 'bg-bogota-primary text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                >
                  Panel Actividades
                </button>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-bogota-primary text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                >
                  Tablero de Control
                </button>
                <button 
                  onClick={() => setActiveTab('alertas')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'alertas' ? 'bg-bogota-primary text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                >
                  Gestor Alertas
                </button>
                <button 
                  onClick={() => setActiveTab('gestion')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'gestion' ? 'bg-bogota-primary text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                >
                  Gestión Resultados
                </button>
              </nav>
            )}

            {/* Right side: Bogota Logo & Desktop User */}
            <div className="flex flex-col lg:items-end gap-3 w-full lg:w-auto mt-2 lg:mt-0">
              <div className="hidden lg:flex items-center gap-4 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-200">
                <span className="text-sm font-semibold text-gray-700">{userName}</span>
                <button onClick={handleLogout} className="text-xs font-bold text-bogota-primary hover:text-red-700 transition-colors uppercase tracking-wide">Salir</button>
              </div>
              <div className="hidden lg:flex items-center justify-end">
                 <img src="/media_1787922734753.png" alt="Bogotá" className="h-10 object-contain" />
              </div>
            </div>
          </div>
        </div>
      </header>'''
    content = content[:idx1] + new_header + content[idx2 + len(end_str):]
else:
    print("Header block not found in App.tsx")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated App.tsx")

