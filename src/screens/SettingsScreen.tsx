import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { COLORS, SPACING } from '../constants/theme';
import { ArrowLeft } from 'lucide-react-native';
import { storageService } from '../services/storage';
import { apiService } from '../services/api';
import { useEffect } from 'react';

interface SettingsScreenProps {
    navigation: NativeStackNavigationProp<any>;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
    const [serviceUrl, setServiceUrl] = useState('');
    const [tenant, setTenant] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationStatus, setValidationStatus] = useState<'none' | 'success' | 'error'>('none');
    const [lastValidated, setLastValidated] = useState<string | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const settings = await storageService.getSettings();
        if (settings.urlApis) setServiceUrl(settings.urlApis);
        if (settings.tenantCodeInput) setTenant(settings.tenantCodeInput);
        if (settings.validatedTenantCode) {
            setValidationStatus('success');
            // We might want to store/retrieve the last validation date too, 
            // but for now we just show it's valid if we have a code.
        }
    };

    const handleSave = async () => {
        if (!serviceUrl || !tenant) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        setIsValidating(true);
        setValidationStatus('none');

        try {
            // 1. Save inputs locally
            await storageService.saveSettings(serviceUrl, tenant);

            // 2. Validate via API
            const result = await apiService.validateTenant(serviceUrl, tenant);

            // The prompt says the API returns a field "tenatCode"
            // We'll check for "tenatCode" or "tenantCode" just in case.
            const validCode = result.tenatCode || result.tenantCode;

            if (validCode) {
                // 3. Save validated code
                await storageService.saveValidatedTenantCode(validCode);

                setValidationStatus('success');
                setLastValidated(new Date().toLocaleString());
                alert('Configuração salva e validada com sucesso!');
            } else {
                throw new Error('Retorno da API inválido: tenatCode não encontrado.');
            }

        } catch (error) {
            console.error(error);
            setValidationStatus('error');
            alert('Erro ao validar configuração. Verifique os dados e tente novamente.');
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <ArrowLeft
                    size={24}
                    color={COLORS.surface}
                    onPress={() => navigation.goBack()}
                    style={styles.backIcon}
                />
                <Text style={styles.headerTitle}>Configurações</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>CONFIGURAÇÕES DO SISTEMA</Text>

                    <Input
                        label="URL de Serviço"
                        placeholder="https://api.exemplo.com"
                        value={serviceUrl}
                        onChangeText={setServiceUrl}
                        autoCapitalize="none"
                        keyboardType="url"
                    />
                    <Text style={styles.helperText}>Endereço base da API (sem barra final)</Text>

                    <Input
                        label="Cód. Empresa (TenantName)"
                        placeholder="Digite o código da empresa"
                        value={tenant}
                        onChangeText={setTenant}
                        style={{ marginTop: SPACING.md }}
                        autoCapitalize="none"
                    />
                    <Text style={styles.helperText}>Código identificador da empresa no sistema</Text>

                    <Button
                        title={isValidating ? "VALIDANDO..." : "VALIDAR E SALVAR"}
                        onPress={handleSave}
                        variant="success"
                        style={{ marginTop: SPACING.xl, backgroundColor: COLORS.success }}
                        isLoading={isValidating}
                    />
                </View>

                <View style={styles.statusCard}>
                    <Text style={styles.statusTitle}>Status da Configuração</Text>
                    <View style={styles.statusRow}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.statusText}>
                            Última validação: {lastValidated || 'Nunca validado'}
                        </Text>
                    </View>
                    <View style={styles.statusRow}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={[
                            styles.statusText,
                            validationStatus === 'success' && { color: COLORS.success, fontWeight: 'bold' },
                            validationStatus === 'error' && { color: COLORS.error, fontWeight: 'bold' }
                        ]}>
                            Status: {validationStatus === 'success' ? '✓ Validada' : validationStatus === 'error' ? 'X Falha na validação' : 'X Não validada'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.primary,
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        justifyContent: 'center',
    },
    backIcon: {
        position: 'absolute',
        left: SPACING.md,
        zIndex: 1,
    },
    headerTitle: {
        color: COLORS.surface,
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: SPACING.md,
    },
    card: {
        backgroundColor: COLORS.surface,
        padding: SPACING.lg,
        borderRadius: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2
            }
        }),
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: SPACING.lg,
        textTransform: 'uppercase',
    },
    helperText: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: -SPACING.sm,
        marginBottom: SPACING.sm,
        fontStyle: 'italic',
    },
    statusCard: {
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    statusTitle: {
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    statusRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    bullet: {
        marginRight: 8,
        color: COLORS.textLight,
    },
    statusText: {
        color: COLORS.textLight,
    }
});
