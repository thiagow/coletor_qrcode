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
    DescrTarefa: string;
    ProxMaterial?: string;
    QtdRestante?: string;
    PosicaoOrigem?: string;
    PosicaoDestino?: string;
    StatusTarefa: string;
    FlEncerrada: boolean;
    Operador?: string | null;
    Instrucao: string;
    NumVolumesLidos?: number;
}

export interface ApiResponse<T = any> {
    Ok: boolean;
    MensErro: string | null;
    DadosTarefa?: T;
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
