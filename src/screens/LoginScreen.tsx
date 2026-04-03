import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    ImageBackground,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
const { width, height } = Dimensions.get('window');
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import SkeletonLoader from '../components/SkeletonLoader';
import { authService } from '../services/authService';
import { ApiError } from '../services/apiClient';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const [loginType, setLoginType] = useState<'phone' | 'userId'>('userId');
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [captcha, setCaptcha] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);

    // Inline validation states
    const [errors, setErrors] = useState({
        userId: '',
        password: '',
        captcha: '',
        otp: '',
        general: '',
    });
    const [successMessage, setSuccessMessage] = useState('');

    // Mock captcha logic
    // Captcha logic
    const [captchaCode, setCaptchaCode] = useState('');

    const generateCaptcha = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        // Add spaces for better readability/visual separation like the mock
        return result.split('').join(' ');
    };

    useEffect(() => {
        handleRefreshCaptcha();
    }, []);

    const handleRefreshCaptcha = () => {
        setCaptchaCode(generateCaptcha());
        setCaptcha(''); // Clear input on refresh
        setErrors(prev => ({ ...prev, captcha: '' }));
    };

    const clearError = (field: keyof typeof errors) => {
        setErrors(prev => ({ ...prev, [field]: '' }));
        setSuccessMessage('');
    };

    const handleGetOtp = async () => {
        setErrors({ userId: '', password: '', captcha: '', otp: '', general: '' });
        setSuccessMessage('');

        if (!userId.trim()) {
            setErrors(prev => ({ ...prev, userId: 'Phone number is required.' }));
            return;
        }

        if (userId.length < 10) {
            setErrors(prev => ({ ...prev, userId: 'Please enter a valid 10-digit phone number.' }));
            return;
        }

        setIsLoading(true);
        try {
            const response = await authService.sendOTP(userId);
            setIsOtpSent(true);
            setSuccessMessage(response.DisplayMessage || 'OTP has been sent to your phone number.');
        } catch (error) {
            if (error instanceof ApiError) {
                setErrors(prev => ({ ...prev, general: error.displayMessage }));
            } else {
                setErrors(prev => ({ ...prev, general: 'Failed to send OTP. Please try again.' }));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async () => {
        setErrors({ userId: '', password: '', captcha: '', otp: '', general: '' });
        setSuccessMessage('');

        let hasError = false;

        if (!userId.trim()) {
            setErrors(prev => ({ ...prev, userId: `${loginType === 'phone' ? 'Phone Number' : 'User ID'} is required.` }));
            hasError = true;
        }

        if (loginType === 'userId' && !password.trim()) {
            setErrors(prev => ({ ...prev, password: 'Password is required.' }));
            hasError = true;
        }

        if (loginType === 'phone' && isOtpSent && !otp.trim()) {
            setErrors(prev => ({ ...prev, otp: 'OTP is required.' }));
            hasError = true;
        }

        const normalizedCaptchaInput = captcha.replace(/\s/g, '').toUpperCase();
        const normalizedCaptchaCode = captchaCode.replace(/\s/g, '').toUpperCase();

        if (loginType === 'userId') {
            if (!captcha.trim()) {
                setErrors(prev => ({ ...prev, captcha: 'Captcha is required.' }));
                hasError = true;
            } else if (normalizedCaptchaInput !== normalizedCaptchaCode) {
                setErrors(prev => ({ ...prev, captcha: 'Incorrect Captcha. Please try again.' }));
                handleRefreshCaptcha();
                hasError = true;
            }
        }

        if (hasError) return;

        setIsLoading(true);

        try {
            console.log('Attempting login with:', { userNameOrEmail: userId, loginType });
            const response = await authService.login({
                userNameOrEmail: userId,
                password: loginType === 'userId' ? password : undefined,
                otpCode: loginType === 'phone' ? otp : undefined,
            });

            console.log('Login API Response:', JSON.stringify(response, null, 2));

            // Check multiple success conditions to handle different API response formats
            const isSuccess =
                (response.Success === true) ||
                (response.StatusCode === 200) ||
                (response.Data !== null && response.Data !== undefined);

            if (isSuccess) {
                console.log('✅ Login Successful! Navigating to Dashboard...');
                console.log('Response Data:', response.Data);
                console.log('Display Message:', response.DisplayMessage);

                // Save auth data for persistence
                if (response.Data) {
                    await authService.saveAuthData(response.Data);
                }

                navigation.replace('Main');
            } else {
                console.log('❌ Login Failed:', response.DisplayMessage);
                setErrors(prev => ({ ...prev, general: response.DisplayMessage || 'Invalid credentials.' }));
            }
        } catch (error) {
            console.error('❌ Login Error (Caught):', error);
            if (error instanceof ApiError) {
                console.log('API Error Details:', {
                    message: error.message,
                    displayMessage: error.displayMessage,
                    statusCode: error.statusCode
                });
                setErrors(prev => ({ ...prev, general: error.displayMessage }));
            } else {
                setErrors(prev => ({ ...prev, general: 'Something went wrong. Please check your internet connection.' }));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require('../../assets/login_bg_vertical.png')}
            style={styles.container}
            resizeMode="cover"
        >
            <LinearGradient
                colors={['rgba(10, 20, 40, 0.4)', 'rgba(10, 20, 40, 0.7)', 'rgba(10, 20, 40, 0.9)']}
                style={styles.gradientOverlay}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardView}
                    >
                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                            <View style={styles.glassCard}>
                                {/* Logo inside card */}
                                <View style={styles.cardLogoSection}>
                                    <View style={styles.logoBackground}>
                                        <Image
                                            source={require('../../assets/BrandLogo-BLzkWXZF.png')}
                                            style={styles.cardLogo}
                                            resizeMode="contain"
                                        />
                                    </View>
                                </View>
                                {/* Welcome Text */}
                                <View style={styles.welcomeSection}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                        <Text style={styles.welcomeTitle}>Welcome Back</Text>
                                        <View style={styles.titleLine} />
                                    </View>
                                    <Text style={styles.welcomeSub}>OREDA Asset Management System</Text>
                                    <Text style={styles.instructionText}>
                                        Sign in to your account to continue
                                    </Text>
                                </View>

                                {/* Login Type Toggle */}
                                <View style={styles.toggleContainer}>
                                    <TouchableOpacity
                                        style={[styles.toggleButton, loginType === 'phone' && styles.activeToggle]}
                                        onPress={() => setLoginType('phone')}
                                    >
                                        <Text style={[styles.toggleText, loginType === 'phone' && styles.activeToggleText]}>Phone Login</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.toggleButton, loginType === 'userId' && styles.activeToggle]}
                                        onPress={() => setLoginType('userId')}
                                    >
                                        <Text style={[styles.toggleText, loginType === 'userId' && styles.activeToggleText]}>Account Login</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Form Fields */}
                                <View style={styles.formContainer}>
                                    <TextInput
                                        style={[styles.input, errors.userId ? styles.inputError : null]}
                                        placeholder={loginType === 'phone' ? "Enter Your Phone Number" : "Enter Your User ID"}
                                        value={userId}
                                        onChangeText={(text) => {
                                            setUserId(text);
                                            clearError('userId');
                                        }}
                                        placeholderTextColor="#999"
                                        keyboardType={loginType === 'phone' ? 'phone-pad' : 'default'}
                                        editable={!isOtpSent}
                                    />
                                    {errors.userId ? <Text style={styles.errorText}>{errors.userId}</Text> : null}

                                    {loginType === 'userId' ? (
                                        <>
                                            <View style={[styles.passwordContainer, errors.password ? styles.inputError : null]}>
                                                <TextInput
                                                    style={styles.passwordInput}
                                                    placeholder="Password"
                                                    value={password}
                                                    onChangeText={(text) => {
                                                        setPassword(text);
                                                        clearError('password');
                                                    }}
                                                    secureTextEntry={!isPasswordVisible}
                                                    placeholderTextColor="#999"
                                                />
                                                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                                                    <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                                                </TouchableOpacity>
                                            </View>
                                            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                                        </>
                                    ) : (
                                        isOtpSent && (
                                            <>
                                                <TextInput
                                                    style={[styles.input, errors.otp ? styles.inputError : null]}
                                                    placeholder="Enter OTP"
                                                    value={otp}
                                                    onChangeText={(text) => {
                                                        setOtp(text);
                                                        clearError('otp');
                                                    }}
                                                    placeholderTextColor="#999"
                                                    keyboardType="number-pad"
                                                    maxLength={6}
                                                />
                                                {errors.otp ? <Text style={styles.errorText}>{errors.otp}</Text> : null}
                                            </>
                                        )
                                    )}

                                    {/* Captcha Section */}
                                    {loginType === 'userId' && (
                                        <View style={styles.captchaCompactRow}>
                                            <View style={styles.captchaDisplayContainer}>
                                                <Text style={styles.captchaDisplay}>{captchaCode}</Text>
                                                <TouchableOpacity onPress={handleRefreshCaptcha} style={styles.refreshIconCompact}>
                                                    <Ionicons name="refresh" size={18} color="#d32f2f" />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={[styles.captchaInputContainerCompact, errors.captcha ? styles.inputError : null]}>
                                                <TextInput
                                                    style={styles.captchaInputCompact}
                                                    placeholder="Captcha"
                                                    value={captcha}
                                                    onChangeText={(text) => {
                                                        setCaptcha(text);
                                                        clearError('captcha');
                                                    }}
                                                    placeholderTextColor="#999"
                                                />
                                            </View>
                                        </View>
                                    )}
                                    {errors.captcha ? <Text style={styles.errorText}>{errors.captcha}</Text> : null}

                                    {/* Success / General Error Message */}
                                    {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
                                    {errors.general ? <Text style={[styles.errorText, { textAlign: 'center', marginBottom: 10 }]}>{errors.general}</Text> : null}

                                    {/* Login / Get OTP Button */}
                                    {isLoading ? (
                                        <View style={styles.skeletonButtonContainer}>
                                            <SkeletonLoader variant="rectangle" height={50} borderRadius={6} />
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.loginButton}
                                            onPress={loginType === 'phone' && !isOtpSent ? handleGetOtp : handleLogin}
                                        >
                                            <Text style={styles.loginButtonText}>
                                                {loginType === 'phone' && !isOtpSent ? 'Get OTP' : 'Login'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                    {/* Footer Links */}
                                    <View style={styles.footerLinks}>
                                        {/* <TouchableOpacity>
                                            <Text style={styles.linkText}>Asset Installation Request</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity>
                                            <Text style={styles.linkText}>Forgot Password?</Text>
                                        </TouchableOpacity> */}
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </LinearGradient>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a1428', // Match the deep blue of the sunset background
    },
    gradientOverlay: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    logoBackground: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 20,
    },
    cardLogoSection: {
        alignItems: 'center',
        marginBottom: 10,
    },
    cardLogo: {
        width: 140,
        height: 40,
    },
    glassCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 24,
        padding: 20,
        width: '90%',
        alignSelf: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    welcomeSection: {
        marginBottom: 20,
        alignItems: 'center',
    },
    welcomeTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        letterSpacing: -0.5,
        marginBottom: 2,
    },
    titleLine: {
        display: 'none',
    },
    welcomeSub: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
        marginBottom: 4,
        textAlign: 'center',
    },
    instructionText: {
        fontSize: 12,
        color: '#94a3b8',
        lineHeight: 18,
        textAlign: 'center',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeToggle: {
        backgroundColor: '#fff',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    toggleText: {
        color: '#64748b',
        fontWeight: '600',
        fontSize: 14,
    },
    activeToggleText: {
        color: '#1e293b',
        fontWeight: 'bold',
    },
    formContainer: {
        width: '100%',
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 15,
        fontSize: 12,
        color: '#1e293b',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 12,
        marginBottom: 15,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1e293b',
    },
    eyeIcon: {
        padding: 12,
    },
    captchaCompactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 10,
    },
    captchaDisplayContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        height: 45,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 8,
    },
    captchaDisplay: {
        fontSize: 18,
        fontStyle: 'italic',
        color: '#d32f2f',
        letterSpacing: 3,
        fontWeight: 'bold',
        marginRight: 6,
    },
    refreshIconCompact: {
        padding: 4,
    },
    captchaInputContainerCompact: {
        flex: 1.2,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 12,
        height: 45,
    },
    captchaInputCompact: {
        flex: 1,
        paddingHorizontal: 16,
        fontSize: 14,
        color: '#1e293b',
    },
    refreshIcon: {
        padding: 12,
    },
    loginButton: {
        backgroundColor: '#d32f2f',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 15,
        height: 50,
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#d32f2f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    loginButtonText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 18,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    resendContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    resendText: {
        color: '#d32f2f',
        fontSize: 14,
        fontWeight: 'bold',
    },
    footerLinks: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    linkText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: -12,
        marginBottom: 12,
        marginLeft: 4,
        fontWeight: '600',
    },
    successText: {
        color: '#10b981',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 12,
        fontWeight: 'bold',
    },
    inputError: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
    },
    skeletonButtonContainer: {
        marginBottom: 12,
    },
});

export default LoginScreen;
