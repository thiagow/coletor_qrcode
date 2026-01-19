import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { Settings, Info } from 'lucide-react-native';
import { storageService } from '../services/storage';

interface LoginScreenProps {
    navigation: NativeStackNavigationProp<any>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const [userCode, setUserCode] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        // Mimic login
        if (userCode && password) {
            // In a real app, validation would happen here.
            // We save a mock User ID (e.g. 1) as required by the prompt's API spec.
            await storageService.saveUserId(1);
            navigation.replace('TaskList');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <View style={styles.logoContainer}>
                        <Text style={styles.logoText}>Coletor Logístico</Text>
                        <Text style={styles.subLogoText}>Entre com suas credenciais</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <Input
                            label="Código do Funcionário"
                            placeholder="Digite seu código"
                            value={userCode}
                            onChangeText={setUserCode}
                            autoCapitalize="none"
                        />
                        <Input
                            label="Senha"
                            placeholder="Digite sua senha"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <Button
                            title="ENTRAR"
                            onPress={handleLogin}
                            style={styles.loginButton}
                        />

                        <TouchableOpacity
                            style={styles.settingsLink}
                            onPress={() => navigation.navigate('Settings')}
                        >
                            <Settings size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                            <Text style={styles.settingsText}>Configurações do Sistema</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.demoInfo}>
                        <Info size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                        <View>
                            <Text style={styles.demoTitle}>Modo de Demonstração</Text>
                            <Text style={styles.demoSub}>Use: OP001 / 123456</Text>
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: SPACING.lg,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xxl,
    },
    logoText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: SPACING.xs,
    },
    subLogoText: {
        fontSize: 16,
        color: COLORS.textLight,
    },
    formContainer: {
        backgroundColor: COLORS.surface,
        padding: SPACING.lg,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: SPACING.xl,
    },
    loginButton: {
        marginTop: SPACING.md,
    },
    settingsLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.lg,
    },
    settingsText: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    demoInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(26, 60, 91, 0.05)',
        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(26, 60, 91, 0.1)',
    },
    demoTitle: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    demoSub: {
        color: COLORS.textLight,
        fontSize: 12,
    },
});
