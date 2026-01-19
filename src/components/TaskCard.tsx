import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Task } from '../data/mockData';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Box, ClipboardList, MapPin, Truck } from 'lucide-react-native';

interface TaskCardProps {
    task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
    const getStatusColor = (status: Task['status']) => {
        switch (status) {
            case 'completed': return COLORS.success;
            case 'in-progress': return COLORS.warning;
            case 'cancelled': return COLORS.error;
            default: return COLORS.textLight;
        }
    };

    const getStatusLabel = (status: Task['status']) => {
        switch (status) {
            case 'completed': return 'Finalizado';
            case 'in-progress': return 'Em Andamento';
            case 'cancelled': return 'Cancelada';
            default: return 'Pendente';
        }
    };

    const getIcon = () => {
        switch (task.operationName) {
            case 'INVENTÁRIO': return <ClipboardList color={COLORS.primary} size={24} />;
            case 'SEPARAÇÃO': return <Truck color={COLORS.primary} size={24} />;
            case 'ENDEREÇAMENTO': return <MapPin color={COLORS.primary} size={24} />;
            default: return <Box color={COLORS.primary} size={24} />;
        }
    };

    const progress = task.totalItems > 0 ? task.completedItems / task.totalItems : 0;

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    {getIcon()}
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.operationTitle}>{task.operationName}</Text>
                    <Text style={styles.taskTitle}>{task.description}</Text>
                </View>
            </View>

            <View style={styles.progressSection}>
                <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: getStatusColor(task.status) }]} />
                </View>
                <Text style={styles.progressText}>{task.completedItems} / {task.totalItems} itens</Text>
            </View>

            <View style={styles.footer}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                    <Text style={styles.statusText}>{getStatusLabel(task.status)}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    headerText: {
        flex: 1,
    },
    operationTitle: {
        fontSize: 12,
        color: COLORS.textLight,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    taskTitle: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: 'bold',
    },
    progressSection: {
        marginBottom: SPACING.md,
    },
    progressBarBackground: {
        height: 8,
        backgroundColor: COLORS.background,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: SPACING.xs,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    statusText: {
        color: COLORS.surface,
        fontSize: 12,
        fontWeight: 'bold',
    },
});
