import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react-native';

interface ConfirmationModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'default' | 'danger' | 'success';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    visible,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'default',
    onConfirm,
    onCancel
}) => {
    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertTriangle color={COLORS.error} size={48} />;
            case 'success': return <CheckCircle color={COLORS.success} size={48} />;
            default: return <HelpCircle color={COLORS.primary} size={48} />;
        }
    };

    const getConfirmButtonStyle = () => {
        switch (type) {
            case 'danger': return styles.dangerButton;
            case 'success': return styles.successButton;
            default: return styles.primaryButton;
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.iconContainer}>
                        {getIcon()}
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        {cancelText && (
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
                                <Text style={styles.cancelButtonText}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.button, getConfirmButtonStyle()]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.confirmButtonText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.md,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.lg,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    iconContainer: {
        marginBottom: SPACING.md,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: COLORS.textLight,
        textAlign: 'center',
        marginBottom: SPACING.lg,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
        width: '100%',
    },
    button: {
        flex: 1,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
    },
    dangerButton: {
        backgroundColor: COLORS.error,
    },
    successButton: {
        backgroundColor: COLORS.success,
    },
    cancelButtonText: {
        color: COLORS.text,
        fontWeight: '600',
        fontSize: 16,
    },
    confirmButtonText: {
        color: COLORS.surface,
        fontWeight: 'bold',
        fontSize: 16,
    },
});
