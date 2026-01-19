import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    URL_APIS: '@urlApis',
    TENANT_CODE_INPUT: '@tenantCodeInput',
    VALIDATED_TENANT_CODE: '@validatedTenantCode',
    USER_ID: '@userId',
};

export const storageService = {
    saveSettings: async (urlApis: string, tenantCodeInput: string) => {
        try {
            await AsyncStorage.multiSet([
                [KEYS.URL_APIS, urlApis],
                [KEYS.TENANT_CODE_INPUT, tenantCodeInput],
            ]);
        } catch (e) {
            console.error('Failed to save settings', e);
            throw e;
        }
    },

    saveValidatedTenantCode: async (code: string) => {
        try {
            await AsyncStorage.setItem(KEYS.VALIDATED_TENANT_CODE, code);
        } catch (e) {
            console.error('Failed to save validated tenant code', e);
            throw e;
        }
    },

    saveUserId: async (id: number) => {
        try {
            await AsyncStorage.setItem(KEYS.USER_ID, id.toString());
        } catch (e) {
            console.error('Failed to save user id', e);
            throw e;
        }
    },

    getSettings: async () => {
        try {
            const values = await AsyncStorage.multiGet([
                KEYS.URL_APIS,
                KEYS.TENANT_CODE_INPUT,
                KEYS.VALIDATED_TENANT_CODE,
                KEYS.USER_ID
            ]);

            return {
                urlApis: values[0][1] || '',
                tenantCodeInput: values[1][1] || '',
                validatedTenantCode: values[2][1] || '',
                userId: values[3][1] ? parseInt(values[3][1], 10) : 0,
            };
        } catch (e) {
            console.error('Failed to get settings', e);
            return { urlApis: '', tenantCodeInput: '', validatedTenantCode: '', userId: 0 };
        }
    }
};
