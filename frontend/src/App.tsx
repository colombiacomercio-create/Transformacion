import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import { useState } from "react";
import KanbanBoard from "./components/KanbanBoard";
import Dashboard from "./components/Dashboard";
import ModalInstrucciones from "./components/ModalInstrucciones";
import PanelAlertas from "./components/PanelAlertas";

function App() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated() || import.meta.env.VITE_BYPASS_AUTH === 'true';
  const [activeTab, setActiveTab] = useState<'kanban' | 'dashboard' | 'alertas'>('kanban');
  const [mockRole, setMockRole] = useState(localStorage.getItem('mockRole') || 'ADMIN');
  const [showHelp, setShowHelp] = useState(false);

  const switchRole = (role: string) => {
     localStorage.setItem('mockRole', role);
     setMockRole(role);
     window.location.reload();
  };

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch(e => {
      console.error(e);
    });
  }

  const handleLogout = () => {
    if (import.meta.env.VITE_BYPASS_AUTH !== 'true') {
      instance.logoutPopup().catch(e => {
        console.error(e);
      });
    }
  }

  const userName = accounts[0]?.name || (import.meta.env.VITE_BYPASS_AUTH === 'true' ? 'Administrador Local' : '');

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center">
          <div className="flex justify-center flex-col items-center mb-8">
             <div className="w-16 h-16 bg-bogota-secondary rounded-full flex items-center justify-center mb-4">
               <span className="text-bogota-primary font-bold text-2xl">BOG</span>
             </div>
             <h1 className="text-2xl font-bold text-gray-800">Transformación Institucional</h1>
             <p className="text-gray-500 mt-2">Seguimiento de planes y metas</p>
          </div>
          <button 
            onClick={handleLogin}
            className="w-full bg-bogota-primary hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.4 24H0V12h11.4v12zm12.6 0H12.6V12H24v12zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/></svg>
            Iniciar sesión con Microsoft API
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-black border-b-4 border-bogota-primary sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-[80px] items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white rounded flex items-center justify-center px-2 py-1">
                <img src="/Logo_sede_electronica_SDG.png" alt="Escudo de Bogotá" className="h-8" />
              </div>
              <div className="flex flex-col border-l-2 pl-4 border-gray-700">
                <span className="text-xs text-[#FFCD00] font-bold uppercase tracking-wider">Secretaría Distrital de Gobierno</span>
                <h1 className="text-xl font-bold text-white leading-tight">
                   Unidad de Transformación
                </h1>
              </div>
            </div>
            
            <nav className="flex space-x-4">
              <button 
                onClick={() => setActiveTab('kanban')}
                className={`px-3 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'kanban' ? 'bg-white text-black shadow' : 'text-white hover:bg-gray-800'}`}
              >
                Panel Actividades (Kanban)
              </button>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'dashboard' ? 'bg-white text-black shadow' : 'text-white hover:bg-gray-800'}`}
              >
                Tablero de Control
              </button>
              <button 
                onClick={() => setActiveTab('alertas')}
                className={`px-3 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'alertas' ? 'bg-red-600 text-white shadow' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Gestor Alertas
              </button>
              <button 
                onClick={() => setShowHelp(true)}
                className="px-3 py-2 rounded-md text-sm font-bold text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Instrucciones
              </button>
            </nav>

            <div className="flex items-center gap-4">
              {import.meta.env.VITE_BYPASS_AUTH === 'true' && (
                <div className="flex bg-[#2a2a2a] rounded-full p-1 border border-gray-700">
                  <button onClick={() => switchRole('ADMIN')} className={`text-xs font-bold px-3 py-1 rounded-full ${mockRole === 'ADMIN' ? 'bg-bogota-primary text-white shadow' : 'text-gray-400'}`}>Admin</button>
                  <button onClick={() => switchRole('GESTOR')} className={`text-xs font-bold px-3 py-1 rounded-full ${mockRole === 'GESTOR' ? 'bg-bogota-secondary text-black shadow' : 'text-gray-400'}`}>Gestor</button>
                </div>
              )}
              <span className="text-sm font-bold text-gray-200">{userName}</span>
              <button 
                onClick={handleLogout}
                className="text-sm font-medium text-red-500 hover:text-red-400 transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'kanban' && <KanbanBoard />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'alertas' && <PanelAlertas />}
      </main>

      {showHelp && <ModalInstrucciones onClose={() => setShowHelp(false)} />}
    </div>
  );
}

export default App;
