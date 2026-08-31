"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileToSharePoint = void 0;
const msal_node_1 = require("@azure/msal-node");
const msalConfig = {
    auth: {
        clientId: process.env.AZURE_CLIENT_ID || '',
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        clientSecret: process.env.AZURE_CLIENT_SECRET || '',
    }
};
const cca = new msal_node_1.ConfidentialClientApplication(msalConfig);
const uploadFileToSharePoint = async (fileName, fileBuffer, mimeType) => {
    try {
        if (!process.env.AZURE_CLIENT_ID || !process.env.SHAREPOINT_DRIVE_ID) {
            console.warn("⚠️ Credenciales de Graph API o Drive ID no configurados. Simulando carga segura de nube...");
            return `https://microsoft.sharepoint.com/mock-tenant/simulated-upload/${Date.now()}_${fileName}`;
        }
        const tokenRequest = {
            scopes: ['https://graph.microsoft.com/.default'],
        };
        const authResponse = await cca.acquireTokenByClientCredential(tokenRequest);
        if (!authResponse?.accessToken) {
            throw new Error("No se pudo obtener el Token principal de Microsoft Graph");
        }
        const driveId = process.env.SHAREPOINT_DRIVE_ID;
        // Reemplazar espacios y caracteres raros del nombre de archivo
        const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/Evidencias_Plan_Transformacion/${Date.now()}_${safeName}:/content`;
        const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authResponse.accessToken}`,
                'Content-Type': mimeType
            },
            body: fileBuffer // El buffer crudo desde Multer en memoria
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Error Graph API: ${errText}`);
        }
        const data = await response.json();
        // Devolvemos el WebUrl que abre directo el SharePoint al usuario en su navegador
        return data.webUrl || "Enlace no generado por SharePoint";
    }
    catch (error) {
        console.error("[GraphService] Error cargando a SharePoint M365:", error);
        throw error;
    }
};
exports.uploadFileToSharePoint = uploadFileToSharePoint;
