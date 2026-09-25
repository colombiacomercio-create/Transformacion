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
import { Sparkles, MessageSquare, Send, X, Radar } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<'kanban' | 'dashboard' | 'alertas' | 'gestion'>('gestion');
  const [showHelp, setShowHelp] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  
  // Asistente de IA Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: '¡Hola! Soy tu Asistente RADAR. ¿En qué te puedo ayudar hoy? Puedes preguntarme por el avance de obras, alertas activas o tareas vencidas.' }
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
      const res = await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/ia/chat/mensaje`, {
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
             <div className="w-20 h-20 bg-bogota-secondary rounded-full flex items-center justify-center mb-4">
               <Radar className="w-12 h-12 text-bogota-primary" />
             </div>
             <h1 className="text-2xl font-bold text-gray-800">RADAR – Red de articulación, Datos, alertas y Resultados</h1>
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="h-1 w-full bg-bogota-primary"></div>
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
          <div className="flex flex-col xl:flex-row justify-between min-h-[112px] py-2 items-center gap-4">
            
            {/* Izquierda: Logo RADAR + Textos */}
            <div className="flex items-center gap-4 flex-shrink-0 w-full xl:w-auto justify-between xl:justify-start">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 flex items-center justify-center p-1">
                  <img src="/radar-logo.png" alt="RADAR Logo" className="h-16 md:h-20 w-auto object-contain" />
                </div>
                <div className="flex flex-col border-l-2 pl-4 border-gray-200 justify-center">
                  <span className="text-[12px] md:text-[13px] font-bold text-gray-800 uppercase tracking-wide leading-tight">SecretarÃ­a Distrital de Gobierno</span>
                  <span className="text-[11px] md:text-[12px] font-semibold text-gray-600 mb-1">Unidad de TransformaciÃ³n</span>
                  <span className="text-[9px] md:text-[10px] text-gray-400 italic leading-tight max-w-[200px]">
                    Red de ArticulaciÃ³n, Datos, Alertas y Resultados
                  </span>
                </div>
              </div>
              
              {/* Usuario Movil */}
              <div className="flex xl:hidden flex-col items-end gap-1">
                <span className="text-xs font-semibold text-gray-700 truncate max-w-[100px]">{userName}</span>
                <button onClick={handleLogout} className="text-xs font-medium text-bogota-primary hover:text-red-700 transition-colors">Salir</button>
              </div>
            </div>
            
            {/* Centro: Tabs */}
            {!isAlertaRoute && (
              <nav className="flex flex-wrap justify-center gap-2 lg:gap-3 flex-shrink-0 xl:flex-1 xl:justify-center">
                <button 
                  onClick={() => setActiveTab('kanban')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'kanban' ? 'bg-bogota-primary text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-200 border border-gray-200'}`}
                >
                  Panel de actividades
                </button>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-bogota-primary text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-200 border border-gray-200'}`}
                >
                  Tablero de control
                </button>
                <button 
                  onClick={() => setActiveTab('alertas')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'alertas' ? 'bg-bogota-primary text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-200 border border-gray-200'}`}
                >
                  Gestor de alertas
                </button>
                <button 
                  onClick={() => setActiveTab('gestion')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'gestion' ? 'bg-bogota-primary text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-200 border border-gray-200'}`}
                >
                  GestiÃ³n de resultados
                </button>
              </nav>
            )}

            {/* Derecha: Logo Bogota + Usuario Desktop */}
            <div className="flex flex-col xl:items-end gap-3 w-full xl:w-auto mt-2 xl:mt-0">
              <div className="hidden xl:flex items-center gap-4 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-200">
                <span className="text-sm font-semibold text-gray-700">{userName}</span>
                <button onClick={handleLogout} className="text-xs font-bold text-bogota-primary hover:text-red-700 transition-colors uppercase tracking-wide">Salir</button>
              </div>
              <div className="hidden xl:flex items-center justify-end">
                 <img src="/Logo_Bogota.jpg" alt="BogotÃ¡" className="h-14 object-contain" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 lg:p-6">
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
            className="fixed bottom-6 right-6 w-14 h-14 bg-bogota-primary hover:bg-red-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all z-40 group" title="Asistente IA"
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
                       <h3 className="font-bold text-sm leading-tight">Asistente RADAR</h3>
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
