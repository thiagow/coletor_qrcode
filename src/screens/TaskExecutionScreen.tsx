import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Keyboard
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS, SPACING } from '../constants/theme';
import { apiService, TaskData } from '../services/api';
import { storageService } from '../services/storage';

type RootStackParamList = {
    Login: undefined;
    TaskList: undefined;
    TaskExecution: {
        taskData: TaskData;
        tenantCode: string;
        userId: number; // Assuming we have userId
    };
};

type TaskExecutionScreenRouteProp = RouteProp<RootStackParamList, 'TaskExecution'>;
type TaskExecutionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TaskExecution'>;

interface Props {
    route: TaskExecutionScreenRouteProp;
    navigation: TaskExecutionScreenNavigationProp;
}

export const TaskExecutionScreen: React.FC<Props> = ({ route, navigation }) => {
    const { taskData: initialTaskData, tenantCode, userId } = route.params;
    const [taskData, setTaskData] = useState<TaskData>(initialTaskData);
    const [barcode, setBarcode] = useState('');
    const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        // Focus input on mount and keep it focused
        const focusInput = () => {
            inputRef.current?.focus();
        };

        const unsubscribe = navigation.addListener('focus', focusInput);
        setTimeout(focusInput, 500); // Initial delay

        return unsubscribe;
    }, [navigation]);

    const handleBarcodeSubmit = async () => {
        if (!barcode.trim()) return;

        setIsLoading(true);
        setMessage(null);

        try {
            const response = await apiService.getTaskData(
                tenantCode,
                taskData.IdTarefa,
                userId,
                taskData.NomeOperacao,
                barcode
            );

            if (response.Ok && response.DadosTarefa) {
                setTaskData(response.DadosTarefa);
                setMessage({ text: 'LEITURA OK', isError: false });
                setBarcode('');
            } else {
                setMessage({
                    text: response.MensErro || 'Erro desconhecido',
                    isError: true
                });
                setBarcode(''); // Clear even on error? Usually yes for rapid scanning
            }
        } catch (error) {
            setMessage({ text: 'Erro de comunicação', isError: true });
        } finally {
            setIsLoading(false);
            // Refocus
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handlePause = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.pauseTask(
                tenantCode,
                taskData.IdTarefa,
                userId,
                taskData.NomeOperacao
            );

            if (response.Ok) {
                navigation.goBack(); // Go back to List
            } else {
                setMessage({ text: response.MensErro || 'Erro ao pausar', isError: true });
            }
        } catch (error) {
            setMessage({ text: 'Erro ao conectar', isError: true });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinishTask = () => {
        Alert.alert(
            'Confirmar Encerramento',
            'Deseja realmente encerrar esta tarefa?',
            [
                { text: 'Não', style: 'cancel' },
                {
                    text: 'Sim',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const response = await apiService.finishTask(
                                tenantCode,
                                taskData.IdTarefa,
                                userId,
                                taskData.NomeOperacao
                            );
                            if (response.Ok) {
                                Alert.alert('Sucesso', 'Tarefa encerrada com sucesso.', [
                                    { text: 'OK', onPress: () => navigation.goBack() }
                                ]);
                            } else {
                                setMessage({ text: response.MensErro || 'Erro ao encerrar', isError: true });
                            }
                        } catch (error) {
                            setMessage({ text: 'Erro de comunicação', isError: true });
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleCancelTask = () => {
        Alert.alert(
            'Confirmar Cancelamento',
            'Deseja realmente cancelar esta tarefa?',
            [
                { text: 'Não', style: 'cancel' },
                {
                    text: 'Sim', style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const response = await apiService.cancelTask(
                                tenantCode,
                                taskData.IdTarefa,
                                userId,
                                taskData.NomeOperacao
                            );
                            if (response.Ok) {
                                Alert.alert('Cancelado', 'Tarefa cancelada com sucesso.', [
                                    { text: 'OK', onPress: () => navigation.goBack() }
                                ]);
                            } else {
                                setMessage({ text: response.MensErro || 'Erro ao cancelar', isError: true });
                            }
                        } catch (error) {
                            setMessage({ text: 'Erro de comunicação', isError: true });
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleNewBox = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.generateNewBox(
                tenantCode,
                taskData.IdTarefa,
                userId,
                taskData.NomeOperacao
            );
            if (response.Ok && response.DadosTarefa) {
                setTaskData(response.DadosTarefa);
                setMessage({ text: 'NOVA CAIXA GERADA', isError: false });
            } else {
                setMessage({ text: response.MensErro || 'Erro ao gerar caixa', isError: true });
            }
        } catch (error) {
            setMessage({ text: 'Erro de comunicação', isError: true });
        } finally {
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const isInventoryOrAddress = ['INVENTÁRIO', 'ENDEREÇAMENTO'].includes(taskData.NomeOperacao.toUpperCase());
    const isPacking = taskData.NomeOperacao.toUpperCase() === 'EMBALAGEM';

    return (
        <SafeAreaView style={styles.container}>
            {/* Header / Task Description */}
            <View style={styles.header}>
                <Text style={styles.headerLabel}>Tarefa:</Text>
                <Text style={styles.headerText}>{taskData.DescrTarefa}</Text>
            </View>

            {/* Instruction */}
            <View style={styles.instructionContainer}>
                <Text style={styles.instructionLabel}>Instrução:</Text>
                <Text style={styles.instructionText}>{taskData.Instrucao}</Text>
            </View>

            {/* Barcode Input */}
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Código de Barras:</Text>
                <TextInput
                    ref={inputRef}
                    style={styles.input}
                    value={barcode}
                    onChangeText={setBarcode}
                    onSubmitEditing={handleBarcodeSubmit}
                    keyboardType="numeric"
                    maxLength={13}
                    placeholder="Ler código..."
                    placeholderTextColor={COLORS.textLight}
                    showSoftInputOnFocus={false} // Often desired for hardware scanners, but let's keep visible if soft entry needed? Prompt says "Campo de entrada...".
                // If hardware scanner sends 'Enter', onSubmitEditing works.
                />
            </View>

            {/* Message Area */}
            <View style={styles.messageForArea}>
                {isLoading ? (
                    <ActivityIndicator color={COLORS.primary} size="large" />
                ) : (
                    message && (
                        <Text style={[
                            styles.messageText,
                            message.isError ? styles.errorText : styles.successText
                        ]}>
                            {message.text}
                        </Text>
                    )
                )}
            </View>

            {/* Footer Buttons */}
            <View style={styles.footer}>
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.button, styles.pauseButton]} onPress={handlePause}>
                        <Text style={styles.buttonText}>Pausar</Text>
                    </TouchableOpacity>

                    {isInventoryOrAddress && (
                        <>
                            <TouchableOpacity style={[styles.button, styles.actionButton]} onPress={handleFinishTask}>
                                <Text style={styles.buttonText}>Encerrar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancelTask}>
                                <Text style={styles.buttonText}>Cancelar</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {isPacking && (
                        <TouchableOpacity style={[styles.button, styles.actionButton]} onPress={handleNewBox}>
                            <Text style={styles.buttonText}>Nova Caixa</Text>
                        </TouchableOpacity>
                    )}
                </View>
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
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerLabel: {
        fontSize: 14,
        color: COLORS.textLight,
        fontWeight: 'bold',
    },
    headerText: {
        fontSize: 16,
        color: COLORS.text,
        marginTop: SPACING.xs,
    },
    instructionContainer: {
        padding: SPACING.md,
        backgroundColor: '#e3f2fd', // Light blue for instruction
        margin: SPACING.md,
        borderRadius: 8,
    },
    instructionLabel: {
        fontSize: 14,
        color: '#1565c0',
        fontWeight: 'bold',
    },
    instructionText: {
        fontSize: 18,
        color: '#0d47a1',
        fontWeight: 'bold',
        marginTop: SPACING.xs,
    },
    inputContainer: {
        paddingHorizontal: SPACING.md,
    },
    inputLabel: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    input: {
        height: 50,
        backgroundColor: COLORS.surface,
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderRadius: 8,
        paddingHorizontal: SPACING.md,
        fontSize: 18,
        color: COLORS.text,
    },
    messageForArea: {
        padding: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 60,
    },
    messageText: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    errorText: {
        color: COLORS.error,
    },
    successText: {
        color: COLORS.success,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        padding: SPACING.sm,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    pauseButton: {
        backgroundColor: '#fbc02d', // Yellow/Orange
    },
    actionButton: {
        backgroundColor: COLORS.primary,
    },
    cancelButton: {
        backgroundColor: COLORS.error,
    },
    buttonText: {
        color: COLORS.surface,
        fontWeight: 'bold',
        fontSize: 14,
    },
});
