import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../components/Button';
import { COLORS, SPACING } from '../constants/theme';
import { PlusCircle } from 'lucide-react-native';
import { apiService, TaskData } from '../services/api';
import { storageService } from '../services/storage';

import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskList'>;

export const TaskListScreen = ({ navigation, route }: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const [tenantCode, setTenantCode] = useState('');
    const [userId, setUserId] = useState<number>(0);
    const [tasks, setTasks] = useState<TaskData[]>(route.params?.tasks || []);

    const loadSettingsAndTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const settings = await storageService.getSettings();
            if (settings.tenantCodeInput) {
                setTenantCode(settings.tenantCodeInput);
            }
            if (settings.userId) {
                setUserId(settings.userId);

                // If we didn't get tasks from params (or if we want to refresh), fetch them
                if (!route.params?.tasks || tasks.length === 0) {
                    await fetchTasks(settings.tenantCodeInput, settings.userId);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [route.params?.tasks]);

    useFocusEffect(
        useCallback(() => {
            loadSettingsAndTasks();
        }, [loadSettingsAndTasks])
    );

    const fetchTasks = async (tCode: string, uId: number) => {
        try {
            const response = await apiService.getOpenTasks(tCode, uId);
            if (response.Ok && response.TarefasLivres) {
                setTasks(response.TarefasLivres);
            } else if (response.Ok && response.TarefaUsuario) {
                // Should arguably not happen here if logic is correct, but if it does, navigate
                // But typically this endpoint returns TarefasLivres if no active task.
            }
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        }
    };

    const handleTaskPress = async (task: TaskData) => {
        setIsLoading(true);
        try {
            const response = await apiService.startTask(
                tenantCode,
                task.IdTarefa,
                userId,
                task.NomeOperacao
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

    const handleLogout = async () => {
        Alert.alert(
            'Sair',
            'Deseja realmente sair do coletor?',
            [
                { text: 'Não', style: 'cancel' },
                {
                    text: 'Sim',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            await apiService.logout(tenantCode, userId);
                            // Clear user session if needed, or just navigate back
                            navigation.replace('Login');
                        } catch (error) {
                            Alert.alert('Erro', 'Erro ao realizar logout');
                            navigation.replace('Login'); // Force exit anyway?
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleGenerateTask = (type: 'INVENTÁRIO' | 'ENDEREÇAMENTO') => {
        Alert.alert('Aviso', `Gerar tarefa de ${type} não implementado no fluxo atual.`);
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

    // Adapt TaskData to the visualization expected by TaskCard?
    // Or update TaskCard. For now, let's map on the fly or update TaskCard later.
    // The current TaskCard expects { id, title, type, status, priority }.
    // Our TaskData has { IdTarefa, DescrTarefa, NomeOperacao, StatusTarefa ... }
    // We will do a quick mapping here for the renderItem.

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tarefas</Text>
            </View>

            <View style={styles.tenantBar}>
                <Text style={styles.tenantText}>Tenant: {tenantCode} | Usuário: {userId}</Text>
            </View>

            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            )}

            <FlatList
                data={tasks}
                keyExtractor={(item) => item.IdTarefa.toString()}
                ListHeaderComponent={renderHeader}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleTaskPress(item)}>
                        {/* Temporary Card - Inline or mapped */}
                        <View style={styles.taskCard}>
                            <View style={styles.taskHeader}>
                                <Text style={styles.taskType}>{item.NomeOperacao}</Text>
                                <Text style={styles.taskId}>#{item.IdTarefa}</Text>
                            </View>
                            <Text style={styles.taskDesc}>{item.DescrTarefa || item.DescricaoTarefa}</Text>
                            <Text style={styles.taskStatus}>{item.StatusTarefa || 'PENDENTE'}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>Nenhuma tarefa disponível.</Text>}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            <View style={styles.footer}>
                {/* Simplified footer options */}
                <Button
                    title="Sair do Coletor"
                    variant="danger"
                    onPress={handleLogout}
                    style={{ flex: 1 }}
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
        backgroundColor: COLORS.surface, // Changed to surface for better contrast with red button
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
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
    },
    taskCard: {
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        borderRadius: 8,
        marginBottom: SPACING.sm,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.xs,
    },
    taskType: {
        fontWeight: 'bold',
        color: COLORS.primary,
        fontSize: 14,
    },
    taskId: {
        color: COLORS.textLight,
        fontSize: 12,
    },
    taskDesc: {
        color: COLORS.text,
        fontSize: 14,
        marginBottom: SPACING.xs,
    },
    taskStatus: {
        fontSize: 12,
        color: COLORS.textLight,
        fontWeight: '600',
        textTransform: 'uppercase',
    }
});

