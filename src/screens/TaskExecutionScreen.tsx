import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Keyboard,
    Modal
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../constants/theme';
import { Camera, X } from 'lucide-react-native';
import { apiService, TaskData } from '../services/api';
import { storageService } from '../services/storage';

type RootStackParamList = {
    Login: undefined;
    TaskList: { tasks?: TaskData[] } | undefined;
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
    const insets = useSafeAreaInsets();
    const { taskData: initialTaskData, tenantCode, userId } = route.params;
    const [taskData, setTaskData] = useState<TaskData>(initialTaskData);
    const [barcode, setBarcode] = useState('');
    const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const [isCameraVisible, setIsCameraVisible] = useState(false);
    const [scanned, setScanned] = useState(false);
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
            const response = await apiService.readBarcode(
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
                // Fetch updated tasks before navigating back
                const tasksResponse = await apiService.getOpenTasks(tenantCode, userId);

                // Reset navigation to TaskList with updated tasks
                navigation.reset({
                    index: 0,
                    routes: [
                        {
                            name: 'TaskList',
                            params: { tasks: tasksResponse.TarefasLivres || [] }
                        },
                    ],
                });
            } else {
                setMessage({ text: response.MensErro || 'Erro ao pausar', isError: true });
            }
        } catch (error) {
            console.error('Pause error:', error);
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
                            const operationType = taskData.NomeOperacao.toUpperCase();
                            let response;

                            if (operationType === 'INVENTÁRIO') {
                                response = await apiService.finishInventory(
                                    tenantCode,
                                    taskData.IdTarefa,
                                    userId,
                                    taskData.NomeOperacao
                                );
                            } else if (operationType === 'ENDEREÇAMENTO') {
                                response = await apiService.finishAddressing(
                                    tenantCode,
                                    taskData.IdTarefa,
                                    userId,
                                    taskData.NomeOperacao
                                );
                            } else {
                                response = await apiService.finishTask(
                                    tenantCode,
                                    taskData.IdTarefa,
                                    userId,
                                    taskData.NomeOperacao
                                );
                            }

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
                            const operationType = taskData.NomeOperacao.toUpperCase();
                            let response;

                            if (operationType === 'INVENTÁRIO') {
                                response = await apiService.cancelInventory(
                                    tenantCode,
                                    taskData.IdTarefa,
                                    userId,
                                    taskData.NomeOperacao
                                );
                            } else if (operationType === 'ENDEREÇAMENTO') {
                                response = await apiService.cancelAddressing(
                                    tenantCode,
                                    taskData.IdTarefa,
                                    userId,
                                    taskData.NomeOperacao
                                );
                            } else {
                                response = await apiService.cancelTask(
                                    tenantCode,
                                    taskData.IdTarefa,
                                    userId,
                                    taskData.NomeOperacao
                                );
                            }

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
        <View style={[styles.container, { paddingTop: insets.top }]}>
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
            <View style={styles.inputRow}>
                <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Código de Barras:</Text>
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        value={barcode}
                        onChangeText={setBarcode}
                        onSubmitEditing={handleBarcodeSubmit}
                        keyboardType="numeric"
                        maxLength={13}
                        placeholder="Ler código ou digitar..."
                        placeholderTextColor={COLORS.textLight}
                        showSoftInputOnFocus={true}
                    />
                </View>
                <TouchableOpacity
                    style={styles.cameraButton}
                    onPress={() => {
                        if (!permission?.granted) {
                            requestPermission();
                        }
                        setScanned(false);
                        setIsCameraVisible(true);
                        Keyboard.dismiss();
                    }}
                >
                    <Camera color={COLORS.surface} size={24} />
                </TouchableOpacity>
            </View>

            {/* Camera Overlay */}
            <Modal visible={isCameraVisible} animationType="slide">
                <View style={styles.cameraContainer}>
                    <CameraView
                        style={styles.camera}
                        facing="back"
                        onBarcodeScanned={scanned ? undefined : ({ data }) => {
                            setScanned(true);
                            setBarcode(data);
                            setIsCameraVisible(false);
                            // Optional: Automatically submit after scan
                            // setTimeout(handleBarcodeSubmit, 500); 
                        }}
                    >
                        <View style={styles.cameraOverlay}>
                            <TouchableOpacity
                                style={styles.closeCameraButton}
                                onPress={() => setIsCameraVisible(false)}
                            >
                                <X color="#FFF" size={32} />
                            </TouchableOpacity>
                            <View style={styles.scanFrame} />
                            <Text style={styles.scanText}>Aponte para o código de barras</Text>
                        </View>
                    </CameraView>
                </View>
            </Modal>

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
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.sm) }]}>
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
        </View>
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
    inputRow: {
        paddingHorizontal: SPACING.md,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: SPACING.sm,
    },
    inputWrapper: {
        flex: 1,
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
    cameraButton: {
        height: 50,
        width: 50,
        backgroundColor: COLORS.secondary,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeCameraButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        padding: 10,
        zIndex: 10,
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#00FF00',
        backgroundColor: 'transparent',
    },
    scanText: {
        color: 'white',
        marginTop: 20,
        fontSize: 18,
        fontWeight: 'bold',
    },
    inputLabel: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: SPACING.xs,
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
