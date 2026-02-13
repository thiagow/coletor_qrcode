import { Alert, Platform } from 'react-native';

/**
 * Normaliza uma string: remove acentos, converte para maiúsculas e remove espaços extras.
 */
export const normalizeString = (str: string | undefined | null): string => {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim();
};

/**
 * Exibe um alerta compatível com Web (window.confirm) e Mobile (Alert.alert).
 */
export const customAlert = (title: string, message: string, buttons?: { text: string, onPress?: () => void, style?: 'default' | 'cancel' | 'destructive' }[]) => {
    if (Platform.OS === 'web') {
        // No Web, usamos confirm para diálogos com botões, ou alert para avisos simples
        if (!buttons || buttons.length <= 1) {
            window.alert(`${title}\n\n${message}`);
            if (buttons && buttons[0]?.onPress) buttons[0].onPress();
            return;
        }

        const result = window.confirm(`${title}\n\n${message}`);
        if (result) {
            // Tenta achar o botão que não seja 'cancel'
            const confirmButton = buttons.find(b => b.style !== 'cancel') || buttons[0];
            if (confirmButton.onPress) confirmButton.onPress();
        } else {
            // Tenta achar o botão 'cancel'
            const cancelButton = buttons.find(b => b.style === 'cancel');
            if (cancelButton && cancelButton.onPress) cancelButton.onPress();
        }
    } else {
        Alert.alert(title, message, buttons);
    }
};
