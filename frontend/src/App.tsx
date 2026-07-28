import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import { useState, useEffect } from "react";
import { fetchApi } from "./utils/api";
import KanbanBoard from "./components/KanbanBoard";
import Dashboard from "./components/Dashboard";
import ModalInstrucciones from "./components/ModalInstrucciones";
import PanelAlertas from "./components/PanelAlertas";
import PanelGestionResultados from "./components/PanelGestionResultados";
import VistaAlertaAsignada from "./pages/VistaAlertaAsignada";
import { Sparkles, MessageSquare, Send, X } from "lucide-react";

const renderMarkdown = (text: string) => {
  if (!text) return null;
  
  // Escape HTML tags to prevent XSS
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
    
  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  
  // Italics *text*
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  
  // Parse lines for bullet lists and line breaks
  const lines = html.split('\n');
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('* ')) {
      return `<li class="ml-4 list-disc my-0.5">${trimmed.substring(2)}</li>`;
    }
    if (trimmed.startsWith('- ')) {
      return `<li class="ml-4 list-disc my-0.5">${trimmed.substring(2)}</li>`;
    }
    return line;
  });
  
  html = processedLines.join('<br/>');
  
  return <div dangerouslySetInnerHTML={{ __html: html }} className="leading-relaxed" />;
};

function App() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = import.meta.env.VITE_BYPASS_AUTH === 'true' ? true : useIsAuthenticated();
  const [activeTab, setActiveTab] = useState<'kanban' | 'dashboard' | 'alertas' | 'gestion'>('kanban');
  const [showHelp, setShowHelp] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  
  // Asistente de IA Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: '¡Hola! Soy tu Asistente SITRA. ¿En qué te puedo ayudar hoy? Puedes preguntarme por el avance de obras, alertas activas o tareas vencidas.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);
    
    try {
      const res = await fetchApi(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/ia/chat/mensaje`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { sender: 'bot', text: data.respuesta }]);
      } else {
        setChatMessages(prev => [...prev, { sender: 'bot', text: 'Lo siento, no pude procesar tu consulta en este momento. Verifica tu conexión.' }]);
      }
    } catch(err) {
      console.error(err);
      setChatMessages(prev => [...prev, { sender: 'bot', text: 'Error de red al comunicarse con el asistente.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchApi(`${import.meta.env.VITE_API_URL || ''}/api/auth/me`)
        .then(res => res.json())
        .then(data => setUserData(data))
        .catch(err => console.error("Error fetching user data:", err));
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch(e => {
      console.error(e);
    });
  }

  const handleLogout = () => {
    instance.logoutPopup().catch(e => {
      console.error(e);
    });
  }

  const userName = import.meta.env.VITE_BYPASS_AUTH === 'true' ? 'Administrador de Pruebas' : (accounts[0]?.name || '');
  const isAlertaRoute = window.location.hash.startsWith('#/alerta/');

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center">
          <div className="flex justify-center flex-col items-center mb-8">
             <div className="w-16 h-16 bg-bogota-secondary rounded-full flex items-center justify-center mb-4">
               <span className="text-bogota-primary font-bold text-2xl">BOG</span>
             </div>
             <h1 className="text-2xl font-bold text-gray-800">SITRA – Sistema Integral de Transformación</h1>
             <p className="text-gray-500 mt-2 text-sm text-center">Plataforma de Gobernanza, Seguimiento Estratégico y Gestión de Resultados</p>
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
                   SITRA – Sistema Integral de Transformación
                </h1>
              </div>
            </div>
            
            {!isAlertaRoute && (
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
                  onClick={() => setActiveTab('gestion')}
                  className={`px-3 py-2 rounded-md text-sm font-bold transition-colors leading-tight ${activeTab === 'gestion' ? 'bg-white text-black shadow' : 'text-white hover:bg-gray-800'}`}
                >
                  Gestión<br/>Resultados
                </button>
                <button 
                  onClick={() => setShowHelp(true)}
                  className="px-3 py-2 rounded-md text-sm font-bold text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Instrucciones
                </button>
              </nav>
            )}

            <div className="flex items-center gap-4">
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
        {userData ? (
          isAlertaRoute ? (
             <VistaAlertaAsignada />
          ) : (
            <>
              {activeTab === 'kanban' && <KanbanBoard userData={userData} />}
              {activeTab === 'dashboard' && <Dashboard userData={userData} />}
              {activeTab === 'alertas' && <PanelAlertas userData={userData} />}
              {activeTab === 'gestion' && <PanelGestionResultados userData={userData} />}
            </>
          )
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bogota-primary"></div>
          </div>
        )}
      </main>

      {/* Botón flotante del Asistente */}
      {userData && (
        <>
          <button 
            onClick={() => setChatOpen(!chatOpen)}
            className="fixed bottom-6 right-6 bg-purple-700 hover:bg-purple-800 text-white p-4 rounded-full shadow-2xl flex items-center justify-center gap-2 hover:scale-105 transition-all z-40"
          >
            <Sparkles className="w-6 h-6 animate-pulse"/>
            <span className="font-bold text-sm pr-1">Asistente IA</span>
          </button>

          {/* Panel del Chat (Drawer) */}
          {chatOpen && (
            <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
              <div className="bg-purple-700 p-4 flex justify-between items-center text-white border-b border-purple-800">
                 <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-300"/>
                    <div>
                       <h3 className="font-bold text-sm leading-tight">Asistente SITRA</h3>
                       <p className="text-[10px] text-purple-200">Impulsado por Gemini 3.5</p>
                    </div>
                 </div>
                 <button onClick={() => setChatOpen(false)} className="hover:bg-purple-800 p-1 rounded"><X className="w-4 h-4"/></button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
                 {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs ${msg.sender === 'user' ? 'bg-purple-700 text-white rounded-br-none shadow' : 'bg-white text-gray-800 border rounded-bl-none shadow-sm'}`}>
                          {renderMarkdown(msg.text)}
                       </div>
                    </div>
                 ))}
                 {chatLoading && (
                    <div className="flex justify-start">
                       <div className="bg-white border rounded-2xl rounded-bl-none px-4 py-2.5 text-xs text-gray-400 shadow-sm flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                       </div>
                    </div>
                 )}
              </div>
              <form onSubmit={handleSendChat} className="p-3 border-t bg-white flex gap-2">
                 <input 
                   type="text" 
                   value={chatInput}
                   onChange={e => setChatInput(e.target.value)}
                   placeholder="Pregunta por tareas, avances, alertas..."
                   className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                 />
                 <button type="submit" className="bg-purple-700 hover:bg-purple-800 text-white p-2 rounded-full flex items-center justify-center shadow transition-colors"><Send className="w-3.5 h-3.5"/></button>
              </form>
            </div>
          )}
        </>
      )}

      {showHelp && <ModalInstrucciones onClose={() => setShowHelp(false)} />}
    </div>
  );
}

export default App;
