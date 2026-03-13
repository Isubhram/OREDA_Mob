import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
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
        for (let i = 0; i < 6; i++) {
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
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    {/* Header Section */}
                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/BrandLogo-BLzkWXZF.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Welcome Text */}
                    <View style={styles.welcomeSection}>
                        <Text style={styles.welcomeTitle}>Welcome,</Text>
                        <Text style={styles.welcomeSub}>Let's get started!</Text>
                        <Text style={styles.instructionText}>
                            Please use your credentials to login.
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
                            <Text style={[styles.toggleText, loginType === 'userId' && styles.activeToggleText]}>UserId Login</Text>
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
                            <>
                                <View style={styles.captchaRow}>
                                    <Text style={styles.captchaDisplay}>{captchaCode}</Text>
                                </View>

                                <View style={[styles.captchaInputContainer, errors.captcha ? styles.inputError : null]}>
                                    <TextInput
                                        style={styles.captchaInput}
                                        placeholder="Enter Captcha Value"
                                        value={captcha}
                                        onChangeText={(text) => {
                                            setCaptcha(text);
                                            clearError('captcha');
                                        }}
                                        placeholderTextColor="#999"
                                    />
                                    <TouchableOpacity onPress={handleRefreshCaptcha} style={styles.refreshIcon}>
                                        <Ionicons name="refresh" size={20} color="#666" />
                                    </TouchableOpacity>
                                </View>
                                {errors.captcha ? <Text style={[styles.errorText, { marginTop: -15, marginBottom: 15 }]}>{errors.captcha}</Text> : null}
                            </>
                        )}

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

                        {loginType === 'phone' && isOtpSent && (
                            <TouchableOpacity onPress={() => { setIsOtpSent(false); setSuccessMessage(''); }} style={styles.resendContainer}>
                                <Text style={styles.resendText}>Change Phone Number?</Text>
                            </TouchableOpacity>
                        )}

                        {/* Footer Links */}
                        <View style={styles.footerLinks}>
                            <TouchableOpacity>
                                <Text style={styles.linkText}>Asset Installation Request</Text>
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Text style={styles.linkText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoImage: {
        width: '100%',
        height: 100, // Adjust height as needed
    },
    logoPlaceholder: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerTextContainer: {
        flex: 1,
    },
    companyName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3f2b96', // Approximate purple/blue color
    },
    subCompanyName: {
        fontSize: 12,
        color: '#333',
    },
    welcomeSection: {
        marginBottom: 25,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    welcomeSub: {
        fontSize: 16,
        color: '#333',
        marginBottom: 10,
    },
    instructionText: {
        fontSize: 12,
        color: '#666',
        lineHeight: 18,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 4,
        marginBottom: 20,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeToggle: {
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    toggleText: {
        color: '#666',
        fontWeight: '500',
    },
    activeToggleText: {
        color: '#333',
        fontWeight: 'bold',
    },
    formContainer: {
        width: '100%',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 15,
        fontSize: 16,
        color: '#000',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        marginBottom: 15,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#000',
    },
    eyeIcon: {
        padding: 10,
    },
    captchaRow: {
        alignItems: 'center',
        marginBottom: 10,
    },
    captchaDisplay: {
        fontSize: 18,
        fontStyle: 'italic',
        color: 'red',
        letterSpacing: 4,
        fontWeight: 'bold',
    },
    captchaInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        marginBottom: 20,
    },
    captchaInput: {
        flex: 1,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#000',
    },
    refreshIcon: {
        padding: 10,
    },
    loginButton: {
        backgroundColor: '#d32f2f', // Red color matching image
        paddingVertical: 15,
        borderRadius: 6,
        alignItems: 'center',
        marginBottom: 10,
        height: 50,
        justifyContent: 'center',
    },
    resendContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    resendText: {
        color: '#3f2b96',
        fontSize: 14,
        fontWeight: '500',
    },
    disabledButton: {
        backgroundColor: '#e57373',
    },
    loginButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    footerLinks: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    linkText: {
        color: '#666',
        fontSize: 12,
        textDecorationLine: 'underline',
    },
    errorText: {
        color: '#d32f2f',
        fontSize: 12,
        marginTop: -10,
        marginBottom: 10,
        marginLeft: 5,
    },
    successText: {
        color: '#2e7d32',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
        fontWeight: '500',
    },
    inputError: {
        borderColor: '#d32f2f',
    },
    skeletonButtonContainer: {
        marginBottom: 10,
    },
    testButton: {
        backgroundColor: '#f0f0f0',
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 15,
        borderWidth: 1,
        borderColor: '#ccc',
        borderStyle: 'dashed',
    },
    testButtonText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default LoginScreen;
