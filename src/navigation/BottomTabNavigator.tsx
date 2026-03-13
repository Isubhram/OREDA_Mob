import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import ProjectScreen from '../screens/ProjectScreen';
import TenderScreen from '../screens/TenderScreen';
import FAQScreen from '../screens/FAQScreen';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type BottomTabParamList = {
    Dashboard: undefined;
    Project: undefined;
    Tender: undefined;
    FAQ: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const BottomTabNavigator = () => {
    const insets = useSafeAreaInsets();

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
                            // Clear auth data before navigating to login
                            const { authService } = require('../services/authService');
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
            <Tab.Screen
                name="FAQ"
                component={FAQScreen}
                options={{
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <Ionicons name="help-circle-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default BottomTabNavigator;