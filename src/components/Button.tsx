import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING, FONTS } from '../constants/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
    isLoading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    isLoading = false,
    disabled = false,
    style
}) => {
    const getBackgroundColor = () => {
        if (variant === 'primary') return COLORS.primary;
        if (variant === 'danger') return COLORS.error;
        if (variant === 'success') return COLORS.success;
        if (variant === 'secondary') return COLORS.secondary;
        return 'transparent';
    };

    const getTextColor = () => {
        if (variant === 'outline') return COLORS.primary;
        return COLORS.surface;
    };

    const getBorder = () => {
        if (variant === 'outline') return { borderWidth: 2, borderColor: COLORS.primary };
        return {};
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { backgroundColor: getBackgroundColor(), ...getBorder() },
                style
            ]}
            onPress={onPress}
            activeOpacity={0.8}
            disabled={isLoading || disabled}
        >
            {isLoading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56, // Modern touch target
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, // Subtle shadow for depth
        shadowRadius: 8,
        elevation: 4,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});
