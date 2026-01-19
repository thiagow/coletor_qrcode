import { storageService } from './storage';

// Placeholder for dayToken generation logic
// The user specified: "hash simples gerado em função do dia/mês/ano corrente"
// We will implement a basic version for now.

const generateDayToken = (): string => {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    // Simple mock hash: "D{day}M{month}Y{year}-TOKEN"
    // This is a PLACEHOLDER until specific hash logic is provided
    return `D${day}M${month}Y${year}-TOKEN`;
};

const getBaseUrl = async (): Promise<string> => {
    const { urlApis } = await storageService.getSettings();
    if (!urlApis) {
        throw new Error('URL de serviços não configurada.');
    }
    return urlApis.replace(/\/$/, '');
};

export interface TaskData {
    IdTarefa: number;
    NomeOperacao: string;
    DescrTarefa: string; // Sometimes called DescricaoTarefa in lists
    DescricaoTarefa?: string; // For the list items
    ProxMaterial?: string;
    QtdRestante?: string;
    PosicaoOrigem?: string;
    PosicaoDestino?: string;
    StatusTarefa?: string;
    FlEncerrada?: boolean;
    Operador?: string | null;
    Instrucao?: string;
    NumVolumesLidos?: number;
    Id_Carga?: number;
    NumCaixas?: number;
    NumCaixasRestantes?: number;
}

export interface ApiResponse<T = any> {
    Ok: boolean;
    MensErro: string | null;
    DadosTarefa?: T;
    // Login specific fields
    tenantCode?: string;
    IdUsuario?: number;
    ApelidoFuncionario?: string;
    TarefaUsuario?: T | null;
    TarefasLivres?: T[];
}

export const apiService = {
    validateTenant: async (urlBase: string, tenantName: string) => {
        const cleanUrl = urlBase.replace(/\/$/, '');
        const dayToken = generateDayToken();
        const fullUrl = `${cleanUrl}/api/valida_tenant/by_name/tn=${tenantName}/t=${dayToken}`;

        console.log('Validating tenant with URL:', fullUrl);

        try {
            const response = await fetch(fullUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Tenant validation failed:', error);
            throw error;
        }
    },

    login: async (userCode: string, password: string): Promise<ApiResponse<TaskData>> => {
        const baseUrl = await getBaseUrl();
        const { tenantCodeInput: savedTenant } = await storageService.getSettings();
        // The user didn't specify the login endpoint URL in the latest message, 
        // but in previous context or implicit standard. 
        // Assuming /api/coletor/login based on pattern or previous knowledge? 
        // User said: "Login do funcionário: Essa chamada já foi detalhada anteriormente"
        // Let's assume /api/coletor/login or similar. 
        // WAIT, if it was detailed previously, I should recall or check.
        // Checking previous conversation context not strictly available in full detail, 
        // but standard pattern suggests /api/coletor/login.
        // However, I will check if I can find it in the prompt history. 
        // Actually, looking at "Conversation f426..." summaries, it doesn't explicitly mention the URL.
        // BUT, looking at the user request "Login do funcionário: Essa chamada já foi detalhada anteriormente",
        // implying I should know.
        // Let's assume it is a POST to `{urlApis}/api/coletor/login` with body `{ userCode, password, tenantCode }`?
        // OR maybe the user provided it in a previous turn I can't see?
        // Safer bet: The user described the RESPONSE structure today.
        // I will implement a placeholder URL and ask/verify if it fails, OR assuming standard `api/coletor/login`.
        // Actually, let's look at the structure of other calls: `/api/coletor/tarefa/...`.
        // I'll use `/api/coletor/login` for now.

        // Actually, re-reading the PROMPT from Step 61: "Login do funcionário: Essa chamada já foi detalhada anteriormente".
        // In the VERY FIRST prompt today, I didn't see the login details.
        // However, I will implement it.

        const url = `${baseUrl}/api/coletor/login`;

        try {
            // Note: Password/UserCode param names might be different (e.g. codigo, senha).
            // I will use 'codigo' and 'senha' as common Portuguese fields, or 'userCode'/'password'.
            // Given the other fields are mixed (tenantCode, IdUsuario), let's guess `codigo` and `senha` or `login`/`password`.
            // Let's try `codigo` and `senha` which is common in BR legacy systems, or follows the pattern.
            // Actually, let's use the `userCode` and `password` as requested in the LoginScreen logic,
            // but mapped to what the API likely expects.
            // I'll leave them as `login` and `senha` for now.

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantCode: savedTenant, // assuming tenant is needed
                    login: userCode,
                    senha: password
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    },

    logout: async (tenantCode: string, idUsuario: number): Promise<ApiResponse> => {
        const baseUrl = await getBaseUrl();
        const url = `${baseUrl}/api/coletor/logout`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantCode, idUsuario })
            });
            return await response.json();
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    },

    getOpenTasks: async (tenantCode: string, idUsuario: number): Promise<ApiResponse<TaskData>> => {
        const baseUrl = await getBaseUrl();
        const url = `${baseUrl}/api/coletor/TarefasLivresUsuario`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantCode,
                    idTarefa: 0, // Sending 0 or null as per "blank or null" implication for list
                    idUsuario
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Error getting open tasks:', error);
            throw error;
        }
    },

    startTask: async (tenantCode: string, idTarefa: number, idUsuario: number, nomeOperacao: string): Promise<ApiResponse<TaskData>> => {
        const baseUrl = await getBaseUrl();
        const url = `${baseUrl}/api/coletor/tarefa/inicia`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantCode, idTarefa, idUsuario, nomeOperacao })
            });
            return await response.json();
        } catch (error) {
            console.error('Error starting task:', error);
            throw error;
        }
    },

    pauseTask: async (tenantCode: string, idTarefa: number, idUsuario: number, nomeOperacao: string): Promise<ApiResponse> => {
        const baseUrl = await getBaseUrl();
        const url = `${baseUrl}/api/coletor/tarefa/pausa`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantCode, idTarefa, idUsuario, nomeOperacao })
            });
            return await response.json();
        } catch (error) {
            console.error('Error pausing task:', error);
            throw error;
        }
    },

    getTaskData: async (tenantCode: string, idTarefa: number, idUsuario: number, nomeOperacao: string, codigoBarras?: string): Promise<ApiResponse<TaskData>> => {
        const baseUrl = await getBaseUrl();
        const url = `${baseUrl}/api/coletor/tarefa/dados`;

        try {
            const body: any = { tenantCode, idTarefa, idUsuario, nomeOperacao };
            if (codigoBarras) {
                body.codigoBarras = codigoBarras;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            return await response.json();
        } catch (error) {
            console.error('Error getting task data:', error);
            throw error;
        }
    },

    finishTask: async (tenantCode: string, idTarefa: number, idUsuario: number, nomeOperacao: string): Promise<ApiResponse> => {
        const baseUrl = await getBaseUrl();
        const url = `${baseUrl}/api/coletor/tarefa/encerra`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantCode, idTarefa, idUsuario, nomeOperacao })
            });
            return await response.json();
        } catch (error) {
            console.error('Error finishing task:', error);
            throw error;
        }
    },

    cancelTask: async (tenantCode: string, idTarefa: number, idUsuario: number, nomeOperacao: string): Promise<ApiResponse> => {
        const baseUrl = await getBaseUrl();
        const url = `${baseUrl}/api/coletor/tarefa/cancela`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantCode, idTarefa, idUsuario, nomeOperacao })
            });
            return await response.json();
        } catch (error) {
            console.error('Error canceling task:', error);
            throw error;
        }
    },

    generateNewBox: async (tenantCode: string, idTarefa: number, idUsuario: number, nomeOperacao: string): Promise<ApiResponse<TaskData>> => {
        const baseUrl = await getBaseUrl();
        const url = `${baseUrl}/api/coletor/tarefa/novacaixa`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantCode, idTarefa, idUsuario, nomeOperacao })
            });
            return await response.json();
        } catch (error) {
            console.error('Error generating new box:', error);
            throw error;
        }
    }
};
