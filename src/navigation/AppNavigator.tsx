import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TaskListScreen } from '../screens/TaskListScreen';
import { TaskExecutionScreen } from '../screens/TaskExecutionScreen';
import { COLORS } from '../constants/theme';
import { TaskData } from '../services/api';

export type RootStackParamList = {
    Login: undefined;
    Settings: undefined;
    TaskList: { tasks?: TaskData[] } | undefined;
    TaskExecution: {
        taskData: TaskData;
        tenantCode: string;
        userId: number;
    };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
    return (
        <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.background },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="TaskList" component={TaskListScreen} />
            <Stack.Screen name="TaskExecution" component={TaskExecutionScreen} />
        </Stack.Navigator>
    );
};
