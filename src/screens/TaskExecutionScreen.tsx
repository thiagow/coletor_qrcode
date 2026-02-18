import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard,
    Modal
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../constants/theme';
import { Camera, X, CheckCircle } from 'lucide-react-native';
import { apiService, TaskData } from '../services/api';
import { normalizeString } from '../utils/helpers';
import { ConfirmationModal } from '../components/ConfirmationModal';

type RootStackParamList = {
    Login: undefined;
    TaskList: { tasks?: TaskData[] } | undefined;
    TaskExecution: {
        taskData: TaskData;
        tenantCode: string;
        userId: number;
    };
};

type TaskExecutionScreenRouteProp = RouteProp<RootStackParamList, 'TaskExecution'>;
type TaskExecutionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TaskExecution'>;

interface Props {
    route: TaskExecutionScreenRouteProp;
    navigation: TaskExecutionScreenNavigationProp;
}

type ModalActionType = 'PAUSE' | 'FINISH' | 'CANCEL' | null;

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

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: '',
        message: '',
        type: 'default' as 'default' | 'danger' | 'success',
        confirmText: 'Confirmar',
        action: null as ModalActionType
    });

    // Task Finished State (to show success screen instead of going back)
    const [isTaskFinished, setIsTaskFinished] = useState(false);
    const [finishedMessage, setFinishedMessage] = useState('');

    useEffect(() => {
        const focusInput = () => {
            // Only focus if not finished and not in camera/modal
            if (!isTaskFinished && !isCameraVisible && !modalVisible) {
                inputRef.current?.focus();
            }
        };

        const unsubscribe = navigation.addListener('focus', focusInput);
        setTimeout(focusInput, 500);

        return unsubscribe;
    }, [navigation, isTaskFinished, isCameraVisible, modalVisible]);

    const showModal = (
        title: string,
        message: string,
        action: ModalActionType,
        type: 'default' | 'danger' | 'success' = 'default',
        confirmText: string = 'Sim'
    ) => {
        setModalConfig({ title, message, action, type, confirmText });
        setModalVisible(true);
    };

    const handleConfirmAction = async () => {
        setModalVisible(false);
        const { action } = modalConfig;

        if (action === 'PAUSE') await executePause();
        if (action === 'CANCEL') await executeCancel();
        if (action === 'FINISH') await executeFinish();
    };

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
                setBarcode('');
            }
        } catch (error) {
            setMessage({ text: 'Erro de comunicação', isError: true });
        } finally {
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    // --- ACTIONS HANDLERS (Open Modals) ---

    const handlePause = () => {
        showModal(
            'Pausar Tarefa',
            'Deseja realmente pausar esta tarefa?',
            'PAUSE',
            'default',
            'Sim, Pausar'
        );
    };

    const handleFinishTask = () => {
        showModal(
            'Encerrar Tarefa',
            'Deseja realmente encerrar esta tarefa?',
            'FINISH',
            'success',
            'Sim, Encerrar'
        );
    };

    const handleCancelTask = () => {
        showModal(
            'Cancelar Tarefa',
            'ATENÇÃO: Deseja realmente cancelar esta tarefa?',
            'CANCEL',
            'danger',
            'Sim, Cancelar'
        );
    };

    // --- EXECUTION LOGIC ---

    const executePause = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.pauseTask(
                tenantCode,
                taskData.IdTarefa,
                userId,
                taskData.NomeOperacao
            );

            if (response.Ok) {
                const tasksResponse = await apiService.getOpenTasks(tenantCode, userId);
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'TaskList', params: { tasks: tasksResponse.TarefasLivres || [] } }],
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

    const executeFinish = async () => {
        setIsLoading(true);
        try {
            const operationType = normalizeString(taskData.NomeOperacao);
            console.log('Finishing Task - Type:', operationType);
            let response;

            if (operationType === 'INVENTARIO') {
                response = await apiService.finishInventory(tenantCode, taskData.IdTarefa, userId, taskData.NomeOperacao);
            } else if (operationType === 'ENDERECAMENTO') {
                response = await apiService.finishAddressing(tenantCode, taskData.IdTarefa, userId, taskData.NomeOperacao);
            } else {
                response = await apiService.finishTask(tenantCode, taskData.IdTarefa, userId, taskData.NomeOperacao);
            }

            if (response.Ok) {
                // SUCCESS: Stay on same screen, show success message and only Voltar button
                setIsTaskFinished(true);
                setFinishedMessage(response.MensErro || 'Tarefa encerrada com sucesso!');
            } else {
                setMessage({ text: response.MensErro || 'Erro ao encerrar tarefa', isError: true });
            }
        } catch (error) {
            setMessage({ text: 'Erro de comunicação', isError: true });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoBackToTaskList = async () => {
        try {
            const tasksResponse = await apiService.getOpenTasks(tenantCode, userId);
            navigation.reset({
                index: 0,
                routes: [{ name: 'TaskList', params: { tasks: tasksResponse.TarefasLivres || [] } }],
            });
        } catch (error) {
            // Mesmo com erro, navega para TaskList sem dados
            navigation.reset({
                index: 0,
                routes: [{ name: 'TaskList' }],
            });
        }
    };

    const executeCancel = async () => {
        setIsLoading(true);
        try {
            const operationType = normalizeString(taskData.NomeOperacao);
            console.log('Canceling Task - Type:', operationType);
            let response;

            if (operationType === 'INVENTARIO') {
                response = await apiService.cancelInventory(tenantCode, taskData.IdTarefa, userId, taskData.NomeOperacao);
            } else if (operationType === 'ENDERECAMENTO') {
                response = await apiService.cancelAddressing(tenantCode, taskData.IdTarefa, userId, taskData.NomeOperacao);
            } else {
                response = await apiService.cancelTask(tenantCode, taskData.IdTarefa, userId, taskData.NomeOperacao);
            }

            if (response.Ok) {
                const tasksResponse = await apiService.getOpenTasks(tenantCode, userId);
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'TaskList', params: { tasks: tasksResponse.TarefasLivres || [] } }],
                });
            } else {
                setMessage({ text: response.MensErro || 'Erro ao cancelar', isError: true });
            }
        } catch (error) {
            setMessage({ text: 'Erro de comunicação', isError: true });
        } finally {
            setIsLoading(false);
        }
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
            if (response.Ok) {
                if (response.DadosTarefa) {
                    setTaskData(response.DadosTarefa);
                }
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

    const opTypeNormalized = normalizeString(taskData.NomeOperacao);
    const isInventoryOrAddress = ['INVENTARIO', 'ENDERECAMENTO'].includes(opTypeNormalized);
    const isPacking = opTypeNormalized === 'EMBALAGEM';


    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header / Task Description */}
            <View style={styles.header}>
                <Text style={styles.headerLabel}>Tarefa:</Text>
                <Text style={styles.headerText}>#{taskData.IdTarefa} - {taskData.DescrTarefa}</Text>
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

            <Modal visible={isCameraVisible} animationType="slide">
                <View style={styles.cameraContainer}>
                    <CameraView
                        style={styles.camera}
                        facing="back"
                        onBarcodeScanned={scanned ? undefined : ({ data }) => {
                            setScanned(true);
                            setBarcode(data);
                            setIsCameraVisible(false);
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

            {/* Notification Modal */}
            <ConfirmationModal
                visible={modalVisible}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                confirmText={modalConfig.confirmText}
                onConfirm={handleConfirmAction}
                onCancel={() => setModalVisible(false)}
            />

            {/* Message Area */}
            <View style={styles.messageForArea}>
                {isLoading ? (
                    <ActivityIndicator color={COLORS.primary} size="large" />
                ) : isTaskFinished ? (
                    <View style={styles.finishedContainer}>
                        <CheckCircle color={COLORS.success} size={48} style={{ marginBottom: SPACING.sm }} />
                        <Text style={styles.finishedTitle}>Tarefa Encerrada!</Text>
                        <Text style={styles.finishedMessage}>{finishedMessage}</Text>
                    </View>
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
                    {isTaskFinished ? (
                        <TouchableOpacity
                            style={[styles.button, styles.actionButton, { flex: 1 }]}
                            onPress={handleGoBackToTaskList}
                        >
                            <Text style={styles.buttonText}>Voltar</Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            {!taskData.FlEncerrada ? (
                                <TouchableOpacity style={[styles.button, styles.pauseButton]} onPress={handlePause}>
                                    <Text style={styles.buttonText}>Pausar</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={[styles.button, styles.actionButton]} onPress={handleGoBackToTaskList}>
                                    <Text style={styles.buttonText}>Voltar</Text>
                                </TouchableOpacity>
                            )}

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
                        </>
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
        backgroundColor: '#e3f2fd',
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
        backgroundColor: '#fbc02d',
    },
    actionButton: {
        backgroundColor: COLORS.primary,
    },
    primaryButton: {
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
    finishedContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    finishedTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.success,
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    finishedMessage: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
    }
});
