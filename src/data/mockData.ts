export interface Task {
    id: string;
    operationName: string;
    description: string;
    totalItems: number;
    completedItems: number;
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
}

export const MOCK_TASKS: Task[] = [
    {
        id: 'TASK-001',
        operationName: 'INVENTÁRIO',
        description: 'Inventário - Setor A',
        totalItems: 3,
        completedItems: 3,
        status: 'completed',
    },
    {
        id: 'TASK-002',
        operationName: 'SEPARAÇÃO',
        description: 'Separação - Pedido #1234',
        totalItems: 5,
        completedItems: 2,
        status: 'in-progress',
    },
    {
        id: 'TASK-003',
        operationName: 'ENDEREÇAMENTO',
        description: 'Endereçamento - Lote 5678',
        totalItems: 10,
        completedItems: 0,
        status: 'pending',
    },
    {
        id: 'TASK-004',
        operationName: 'EXPEDIÇÃO',
        description: 'Expedição - Carga SP',
        totalItems: 1,
        completedItems: 0,
        status: 'cancelled',
    },
    {
        id: 'TASK-005',
        operationName: 'SEPARAÇÃO',
        description: 'Separação - Pedido #1235',
        totalItems: 12,
        completedItems: 5,
        status: 'in-progress',
    }
];
