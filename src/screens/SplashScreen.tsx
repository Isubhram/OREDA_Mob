import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { authService } from '../services/authService';

type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Main: undefined;
};

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      // Small delay to show splash screen
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        const authData = await authService.getAuthData();
        const token = authData?.AccessToken || authData?.token || authData?.Token;
        
        if (token) {
          // User is logged in, navigate to Main
          navigation.replace('Main');
        } else {
          // No auth data, navigate to Login
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        navigation.replace('Login');
      }
    };

    checkAuthAndNavigate();
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Placeholder for OREDA Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>OREDA</Text>
        <Text style={styles.subText}>Odisha Renewable Energy Development Agency</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default SplashScreen;
