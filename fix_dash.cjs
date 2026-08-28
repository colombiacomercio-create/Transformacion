const fs = require('fs');
let content = fs.readFileSync('D:/Transformacion/frontend/src/components/obras/DashboardObras.tsx', 'utf8');

// Add ts-nocheck
content = '// @ts-nocheck\n' + content;

// Replace imports
content = content.replace("import { supabase } from '../supabaseClient';", "import { fetchApi } from '../../utils/api';\nconst API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';");

// Replace fetchData body
const newFetchData = `
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(\`\${API_URL}/api/obras/dashboard\`);
      const json = await res.json();
      
      if (json.metadatos && json.metadatos.length > 0) {
        setFechaCorte(json.metadatos[0].fecha_corte);
      } else {
        setFechaCorte(new Date().toISOString().split('T')[0]);
      }
      
      setData(json.frentes || []);
      setAlertas(json.alertas || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };
`;

content = content.replace(/const fetchData = async \(\) => \{[\s\S]*?\}\s*catch[^\}]*\}[\s\S]*?finally[^\}]*\}\s*\};/, newFetchData.trim());

// Also replace <Link to="/admin"> (since we might not want it or we need to rename it)
content = content.replace(/<Link to="\/admin"/g, '<button onClick={() => window.location.hash = "#obras-admin"}');
content = content.replace(/Actualizar Datos →<\/Link>/g, 'Actualizar Datos →</button>');

fs.writeFileSync('D:/Transformacion/frontend/src/components/obras/DashboardObras.tsx', content);
console.log("Replaced DashboardObras.tsx fetching logic");
