import { msalInstance } from '../authConfig';

const acquireToken = async (): Promise<string> => {
  const accounts = msalInstance.getAllAccounts();
  
  if (accounts.length > 0) {
    const account = accounts[0];
    try {
      const response = await msalInstance.acquireTokenSilent({
        scopes: ["User.Read"],
        account: account
      });
      return response.accessToken;
    } catch (error) {
      console.error("Silent token acquisition failed", error);
      // Fallback to popup or redirect if silent fails (could trigger login)
      return "";
    }
  }
  return "";
};

export const fetchApi = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = await acquireToken();
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    // Si no pudimos obtener el token silencioso, forzamos cierre de sesión
    console.error("No se pudo obtener el token de Microsoft. Por favor, vuelve a iniciar sesión.");
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
     const errorData = await response.json().catch(() => ({}));
     console.error("Error de la API:", response.status, errorData);
     // Lanza un error estructurado para que el frontend no colapse
     throw new Error(errorData.message || 'Error en la petición a la API');
  }

  return response;
};
