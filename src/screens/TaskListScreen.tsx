import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TaskCard } from '../components/TaskCard';
import { Button } from '../components/Button';
import { MOCK_TASKS, Task } from '../data/mockData';
import { COLORS, SPACING } from '../constants/theme';
import { LogOut, PlusCircle } from 'lucide-react-native';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';

interface TaskListScreenProps {
    navigation: NativeStackNavigationProp<any>;
}

export const TaskListScreen: React.FC<TaskListScreenProps> = ({ navigation }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [tenantCode, setTenantCode] = useState('TENANT001'); // Default fallback

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const settings = await storageService.getSettings();
        if (settings.tenantCodeInput) {
            setTenantCode(settings.tenantCodeInput);
        }
    };

    const handleTaskPress = async (task: Task) => {
        setIsLoading(true);
        try {
            const settings = await storageService.getSettings();
            if (!settings.urlApis) {
                Alert.alert('Erro', 'URL de serviços não configurada.');
                return;
            }

            // Extract numeric ID from "TASK-001" or similar
            const idMatch = task.id.match(/\d+/);
            const numericId = idMatch ? parseInt(idMatch[0], 10) : 0;

            // Mocking user ID as 1 as per Login logic
            const userId = settings.userId || 1;

            // Start (or resume) task
            const response = await apiService.startTask(
                tenantCode,
                numericId,
                userId,
                task.operationName
            );

            if (response.Ok && response.DadosTarefa) {
                navigation.navigate('TaskExecution', {
                    taskData: response.DadosTarefa,
                    tenantCode: tenantCode,
                    userId: userId
                });
            } else {
                Alert.alert('Erro', response.MensErro || 'Falha ao iniciar tarefa');
            }

        } catch (error) {
            Alert.alert('Erro', 'Falha na comunicação com o servidor.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateTask = (type: 'INVENTÁRIO' | 'ENDEREÇAMENTO') => {
        // Here we would call an API/Endpoint to generate a new task
        // apiService.generateTask(...)
        // For now, alerting not implemented or simulation
        Alert.alert('Aviso', `Gerar tarefa de ${type} não implementado no fluxo atual.`);

        // If we wanted to simulate:
        // handleTaskPress({ id: 'TASK-NEW', operationName: type, ... } as Task);
    };

    const renderHeader = () => (
        <View style={styles.listHeader}>
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: COLORS.secondary }]}
                    onPress={() => handleGenerateTask('INVENTÁRIO')}
                >
                    <PlusCircle color={COLORS.surface} size={20} />
                    <Text style={styles.actionButtonText}>Novo Inv.</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#8e44ad' }]}
                    onPress={() => handleGenerateTask('ENDEREÇAMENTO')}
                >
                    <PlusCircle color={COLORS.surface} size={20} />
                    <Text style={styles.actionButtonText}>Novo End.</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tarefas</Text>
            </View>

            <View style={styles.tenantBar}>
                <Text style={styles.tenantText}>Tenant: {tenantCode}</Text>
            </View>

            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            )}

            <FlatList
                data={MOCK_TASKS}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderHeader}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleTaskPress(item)}>
                        <TaskCard task={item} />
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            <View style={styles.footer}>
                <Button
                    title="Voltar"
                    variant="secondary"
                    onPress={() => navigation.goBack()}
                    style={{ flex: 1, marginRight: SPACING.sm, backgroundColor: '#34495E' }}
                />
                <Button
                    title="Sair do Coletor"
                    variant="danger"
                    onPress={() => navigation.replace('Login')}
                    style={{ flex: 1, marginLeft: SPACING.sm }}

                />
            </View>
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: COLORS.surface,
        fontSize: 18,
        fontWeight: 'bold',
    },
    tenantBar: {
        backgroundColor: COLORS.surface,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    tenantText: {
        color: COLORS.textLight,
        fontSize: 12,
        fontWeight: '600',
    },
    listContent: {
        padding: SPACING.md,
        paddingBottom: 100, // Space for footer
    },
    listHeader: {
        marginBottom: SPACING.md,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flex: 0.48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.sm,
        borderRadius: 8,
        gap: 8,
    },
    actionButtonText: {
        color: COLORS.surface,
        fontWeight: 'bold',
        fontSize: 14,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        padding: SPACING.md,
        flexDirection: 'row',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    }
});
