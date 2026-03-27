import React, { useEffect, useState } from 'react';
import { TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import ProjectScreen from '../screens/ProjectScreen';
import TenderScreen from '../screens/TenderScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import WorkOrderScreen from '../screens/WorkOrderScreen';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '../services/authService';

export type BottomTabParamList = {
    Dashboard: undefined;
    Project: undefined;
    Tender: undefined;
    WorkOrder: undefined;
    Maintenance: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const BottomTabNavigator = () => {
    const insets = useSafeAreaInsets();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRole = async () => {
            try {
                const data = await authService.getAuthData();
                const role = data?.UserData?.RoleName || data?.UserData?.UserTypeLabel || 'Administrator';
                setUserRole(role);
            } catch (error) {
                console.error('Error fetching user role for tabs:', error);
                setUserRole('Administrator'); // Fallback
            } finally {
                setIsLoading(false);
            }
        };
        fetchRole();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#c55825" />
            </View>
        );
    }

    return (
        <Tab.Navigator
            initialRouteName="Dashboard"
            screenOptions={({ navigation }: { navigation: any }) => ({

                // ✅ Gradient Header
                headerBackground: () => (
                    <LinearGradient
                        colors={['#8b1a1a', '#c52525', '#e23f3f']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{ flex: 1 }}
                    />
                ),

                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },

                tabBarActiveTintColor: '#c55825',
                tabBarInactiveTintColor: '#999',

                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#e0e0e0',
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom || 8,
                    paddingTop: 8,
                },

                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },

                headerRight: () => (
                    <TouchableOpacity
                        onPress={async () => {
                            console.log('Logging out...');
                            await authService.logout();
                            navigation.replace('Login');
                        }}
                        style={{ marginRight: 15 }}
                    >
                        <Ionicons name="log-out-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                ),
            })}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <Ionicons name="grid-outline" size={size} color={color} />
                    ),
                }}
            />
            
            {userRole !== 'Vendor' && (
                <>
                    <Tab.Screen
                        name="Project"
                        component={ProjectScreen}
                        options={{
                            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                                <Ionicons name="briefcase-outline" size={size} color={color} />
                            ),
                        }}
                    />
                    <Tab.Screen
                        name="Tender"
                        component={TenderScreen}
                        options={{
                            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                                <Ionicons name="document-text-outline" size={size} color={color} />
                            ),
                        }}
                    />
                </>
            )}

            <Tab.Screen
                name="WorkOrder"
                component={WorkOrderScreen}
                options={{
                    title: 'Work Orders',
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <MaterialCommunityIcons name="clipboard-text-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Maintenance"
                component={MaintenanceScreen}
                options={{
                    title: 'Maintenance',
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <MaterialCommunityIcons name="tools" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};


export default BottomTabNavigator;