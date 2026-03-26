import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import BottomTabNavigator from './BottomTabNavigator';
import ProjectDetailsScreen from '../screens/ProjectDetails';

import { navigationRef } from './NavigationService';

export type RootStackParamList = {
    Splash: undefined;
    Login: undefined;
    Main: undefined; // Now routes to Bottom Tabs instead of Drawer
    ProjectDetails: { project: any };
    TenderDetails: { tenderId: number };
    WorkOrderDetails: { workOrderId: number };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Main" component={BottomTabNavigator} />
                <Stack.Screen name="ProjectDetails" component={ProjectDetailsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="TenderDetails" component={require('../screens/TenderDetailsScreen').default} options={{ headerShown: false }} />
                <Stack.Screen name="WorkOrderDetails" component={require('../screens/WorkOrderDetailsScreen').default} options={{ headerShown: false }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
