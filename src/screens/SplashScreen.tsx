import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services/authService';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
    Splash: undefined;
    Login: undefined;
    Main: undefined;
};

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen = () => {
    const navigation = useNavigation<SplashScreenNavigationProp>();

    // Animation Values
    const logoScale = useRef(new Animated.Value(0.5)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const textTranslateY = useRef(new Animated.Value(30)).current;
    const taglineOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start Animations
        Animated.sequence([
            // 1. Logo fades in and scales up
            Animated.parallel([
                Animated.timing(logoScale, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                }),
            ]),
            // 2. Main title slides up and fades in
            Animated.parallel([
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(textTranslateY, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
            // 3. Tagline fades in
            Animated.timing(taglineOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();

        const checkAuthAndNavigate = async () => {
            // Wait for animations to complete before transitioning
            await new Promise(resolve => setTimeout(resolve, 3200));

            try {
                const authData = await authService.getAuthData();
                const token = authData?.AccessToken || authData?.token || authData?.Token;

                if (token) {
                    navigation.replace('Main');
                } else {
                    navigation.replace('Login');
                }
            } catch (error) {
                console.error('Error checking auth state:', error);
                navigation.replace('Login');
            }
        };

        checkAuthAndNavigate();
    }, [navigation, logoScale, logoOpacity, textOpacity, textTranslateY, taglineOpacity]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient
                colors={['#8b3a1aff', '#c1272d', '#5a0c0c']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.content}>
                    {/* Animated Logo */}
                    <Animated.View
                        style={[
                            styles.logoWrapper,
                            {
                                opacity: logoOpacity,
                                transform: [{ scale: logoScale }]
                            }
                        ]}
                    >
                        <View style={styles.logoCircle}>
                            <Image
                                source={require('../../assets/BrandLogo-BLzkWXZF.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                    </Animated.View>

                    {/* Animated Text Content */}
                    <View style={styles.textContainer}>
                        <Animated.View
                            style={{
                                opacity: textOpacity,
                                transform: [{ translateY: textTranslateY }]
                            }}
                        >
                            <Text style={styles.title}>OREDA</Text>
                            <Text style={styles.subtitle}>Odisha Renewable Energy Development Agency</Text>
                        </Animated.View>

                        <Animated.View style={[styles.taglineWrapper, { opacity: taglineOpacity }]}>
                            <View style={styles.taglineLine} />
                            <Text style={styles.tagline}>Sustainable Energy for All</Text>
                            <View style={styles.taglineLine} />
                        </Animated.View>
                    </View>
                </View>

                {/* Bottom decorative element or loading */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Optimizing Energy. Empowering Lives.</Text>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 60,
    },
    logoWrapper: {
        width: 140,
        height: 140,
        marginBottom: 30,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    logoCircle: {
        width: '100%',
        height: '100%',
        borderRadius: 70,
        backgroundColor: '#fff',
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 4,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginTop: 6,
        fontWeight: '600',
        paddingHorizontal: 40,
        letterSpacing: 0.5,
    },
    taglineWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
        gap: 12,
    },
    taglineLine: {
        width: 30,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    tagline: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '500',
        letterSpacing: 1,
    },
});

export default SplashScreen;
