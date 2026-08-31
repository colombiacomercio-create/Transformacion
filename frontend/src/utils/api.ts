import { msalInstance } from '../authConfig';

const acquireToken = async (): Promise<string> => {
  if (import.meta.env.VITE_BYPASS_AUTH === 'true') {
    return "bypass-token";
  }
  const accounts = msalInstance.getAllAccounts();
  
  if (accounts.length > 0) {
    const account = accounts[0];
    try {
      const response = await msalInstance.acquireTokenSilent({
        scopes: ["User.Read", "Mail.Send"],
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

  const fetchOptions: RequestInit = {
    ...options,
    headers
  };

  if (!options.method || options.method === 'GET') {
     fetchOptions.cache = 'no-store';
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
     const errorData = await response.json().catch(() => ({}));
     const msg = errorData.message || errorData.error || `HTTP ${response.status}`;
     console.error("Error de la API:", response.status, errorData);
     throw new Error(msg);
  }

  return response;
};

export const sendEmailGraphAPI = async (toEmails: string[], subject: string, htmlContent: string) => {
  const token = await acquireToken();
  if (!token) throw new Error("No token for Graph API");
  
  const payload = {
    message: {
      subject,
      body: { contentType: "HTML", content: htmlContent },
      toRecipients: toEmails.map(email => ({ emailAddress: { address: email.trim() } }))
    },
    saveToSentItems: "true"
  };

  const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Error Graph API:", response.status, errorData);
    throw new Error(errorData.error?.message || 'Error enviando correo');
  }
};
