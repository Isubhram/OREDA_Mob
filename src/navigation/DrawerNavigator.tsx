import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DashboardScreen from '../screens/DashboardScreen';
import ProjectScreen from '../screens/ProjectScreen';
import TenderScreen from '../screens/TenderScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export type DrawerParamList = {
    Dashboard: undefined;
    Project: undefined;
    Tender: undefined;
    Maintenance: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

const DrawerNavigator = () => {
    return (
        <Drawer.Navigator
            initialRouteName="Dashboard"
            screenOptions={({ navigation }) => ({
                headerStyle: { backgroundColor: '#c55825' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
                drawerActiveTintColor: '#c55825',
                drawerInactiveTintColor: '#666',
                headerRight: () => (
                    <TouchableOpacity
                        onPress={() => (navigation as any).replace('Login')}
                        style={{ marginRight: 15 }}
                    >
                        <Ionicons name="log-out-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                ),
            })}
        >
            <Drawer.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    drawerIcon: ({ color, size }: { color: string; size: number }) => (
                        <Ionicons name="grid-outline" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Project"
                component={ProjectScreen}
                options={{
                    drawerIcon: ({ color, size }: { color: string; size: number }) => (
                        <Ionicons name="briefcase-outline" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Tender"
                component={TenderScreen}
                options={{
                    drawerIcon: ({ color, size }: { color: string; size: number }) => (
                        <Ionicons name="document-text-outline" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Maintenance"
                component={MaintenanceScreen}
                options={{
                    title: 'Maintenance',
                    drawerIcon: ({ color, size }: { color: string; size: number }) => (
                        <MaterialCommunityIcons name="tools" size={size} color={color} />
                    ),
                }}
            />
        </Drawer.Navigator>
    );
};

export default DrawerNavigator;
