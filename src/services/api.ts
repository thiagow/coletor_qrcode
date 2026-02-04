import { storageService } from './storage';
import SHA1 from 'crypto-js/sha1';

// Token generation logic based on SQL provided:
// Declare @Key Varchar(30) = 'MPC2_'+Convert(Varchar(10), GetDate(), 112)+'_18531874000130';
// Select Convert(Varchar(40), HashBytes('SHA1', @Key), 2)
const generateDayToken = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    // Month is 0-indexed in JS, so add 1. Pad with 0.
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    // SQL style 112 is YYYYMMDD
    const dateStr = `${year}${month}${day}`;

    // Fixed suffix as per requirements
    const fixedSuffix = '_18531874000130';

    // Construct the key: MPC2_YYYYMMDD_18531874000130
    const key = `MPC2_${dateStr}${fixedSuffix}`;

    // Generate SHA1 hash and convert to Hex string (uppercase)
    const hash = SHA1(key).toString().toUpperCase();

    console.log(`Generated Token - Key: ${key}, Hash: ${hash}`);
    return hash;
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
    // Validation specific fields
    tenatCode?: string;
}

export const apiService = {
    validateTenant: async (urlBase: string, tenantName: string) => {
        const cleanUrl = urlBase.replace(/\/$/, '');
        const dayToken = generateDayToken();
        const fullUrl = `${cleanUrl}/valida_tenant/by_name/tn=${tenantName}/t=${dayToken}`;

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

        const url = `${baseUrl}/coletor/login`;

        try {
            const body = {
                tenantName: savedTenant,
                codFuncionario: userCode,
                password: password
            };

            console.log('Logging in with body:', JSON.stringify(body));

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            // Se o login for bem sucedido e retornar tenantCode, salvamos para uso futuro
            if (data.Ok && data.tenantCode) {
                await storageService.saveValidatedTenantCode(data.tenantCode);
                console.log('Login success! Saved tenantCode:', data.tenantCode);
            }

            return data;
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    },

    logout: async (tenantCode: string, idUsuario: number): Promise<ApiResponse> => {
        const baseUrl = await getBaseUrl();
        const url = `${baseUrl}/coletor/logout`;

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
        const url = `${baseUrl}/coletor/TarefasLivresUsuario`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantCode,
                    idTarefa: 0,
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
        const url = `${baseUrl}/coletor/tarefa/inicia`;

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
        const url = `${baseUrl}/coletor/tarefa/pausa`;

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
        const url = `${baseUrl}/coletor/tarefa/dados`;

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
        const url = `${baseUrl}/coletor/tarefa/encerra`;

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
        const url = `${baseUrl}/coletor/tarefa/cancela`;

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
        const url = `${baseUrl}/coletor/tarefa/geracaixaembalagem`;

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
    },

    readBarcode: async (tenantCode: string, idTarefa: number, idUsuario: number, nomeOperacao: string, codigoBarras: string): Promise<ApiResponse<TaskData>> => {
        const baseUrl = await getBaseUrl();
        const url = `${baseUrl}/coletor/tarefa/lecodbarras`;

        try {
            console.log('Sending Barcode Request:', { url, tenantCode, idTarefa, idUsuario, nomeOperacao, codigoBarras });

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantCode, idTarefa, idUsuario, nomeOperacao, codBarras: codigoBarras })
            });
            const data = await response.json();
            console.log('Barcode/API Response:', data);
            return data;
        } catch (error) {
            console.error('Error reading barcode:', error);
            throw error;
        }
    },

    createInventory: async (tenantCode: string, idUsuario: number): Promise<ApiResponse<TaskData>> => {
        const baseUrl = await getBaseUrl();
        const url = `${baseUrl}/coletor/tarefa/gerainventario`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantCode, idUsuario })
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating inventory:', error);
            throw error;
        }
    },

    createAddressing: async (tenantCode: string, idUsuario: number): Promise<ApiResponse<TaskData>> => {
        const baseUrl = await getBaseUrl();
        const url = `${baseUrl}/coletor/tarefa/geraenderecamento`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantCode, idUsuario })
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating addressing:', error);
            throw error;
        }
    },

    finishInventory: async (tenantCode: string, idTarefa: number, idUsuario: number, nomeOperacao: string): Promise<ApiResponse> => {
        const baseUrl = await getBaseUrl();
        const url = `${baseUrl}/coletor/tarefa/encerrainventario`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantCode, idTarefa, idUsuario, nomeOperacao })
            });
            return await response.json();
        } catch (error) {
            console.error('Error finishing inventory:', error);
            throw error;
        }
    },

    finishAddressing: async (tenantCode: string, idTarefa: number, idUsuario: number, nomeOperacao: string): Promise<ApiResponse> => {
        const baseUrl = await getBaseUrl();
        const url = `${baseUrl}/coletor/tarefa/encerraenderecamento`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantCode, idTarefa, idUsuario, nomeOperacao })
            });
            return await response.json();
        } catch (error) {
            console.error('Error finishing addressing:', error);
            throw error;
        }
    },

    cancelInventory: async (tenantCode: string, idTarefa: number, idUsuario: number, nomeOperacao: string): Promise<ApiResponse> => {
        const baseUrl = await getBaseUrl();
        const url = `${baseUrl}/coletor/tarefa/cancelainventario`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantCode, idTarefa, idUsuario, nomeOperacao })
            });
            return await response.json();
        } catch (error) {
            console.error('Error canceling inventory:', error);
            throw error;
        }
    },

    cancelAddressing: async (tenantCode: string, idTarefa: number, idUsuario: number, nomeOperacao: string): Promise<ApiResponse> => {
        const baseUrl = await getBaseUrl();
        const url = `${baseUrl}/coletor/tarefa/cancelaenderecamento`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantCode, idTarefa, idUsuario, nomeOperacao })
            });
            return await response.json();
        } catch (error) {
            console.error('Error canceling addressing:', error);
            throw error;
        }
    }
};
