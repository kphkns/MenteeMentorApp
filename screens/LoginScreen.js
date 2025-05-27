import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, BackHandler, Pressable,
  useColorScheme, KeyboardAvoidingView, Platform,
  Keyboard, Animated, Dimensions,ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('Student');
  const [loginMessage, setLoginMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const translateY = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
      keyboardShow();
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      keyboardHide();
    });
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

    return () => {
      showSub.remove();
      hideSub.remove();
      backHandler.remove();
    };
  }, []);

  const keyboardShow = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const keyboardHide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Validation', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://192.168.216.136:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, userType }),
      });

      const data = await response.json();

      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLoginMessage(data.message);
        Alert.alert('Login Success', data.message);
        await AsyncStorage.setItem('authToken', data.token);
        navigation.replace(userType);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setLoginMessage(data.message || 'Login failed.');
        Alert.alert('Login Failed', data.message || 'Login failed.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.page, { backgroundColor: theme.page }]}
        keyboardShouldPersistTaps="handled"
      >
        {!isKeyboardVisible && (
          <Animated.View style={[styles.logoContainer, { opacity: scaleValue }]}>
            <View style={[styles.logoCircle, { backgroundColor: theme.logoBg }]}>
              <Feather name="users" size={42} color={theme.logoIcon} />
            </View>
            {/* <Text style={[styles.appName, { color: theme.title }]}>Mentee Mentor</Text> */}
          </Animated.View>
        )}

        <Animated.View style={[
          styles.card, 
          { 
            backgroundColor: theme.card,
            transform: [{ translateY }, { scale: scaleValue }],
          }
        ]}>
          <Text style={[styles.title, { color: theme.title }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: theme.subtitle }]}>
            Sign in to continue your mentorship journey
          </Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.label }]}>Email Address</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.input }]}>
              <MaterialIcons name="email" size={20} color={theme.icon} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="your@email.com"
                placeholderTextColor={theme.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.label }]}>Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.input }]}>
              <Ionicons name="lock-closed" size={20} color={theme.icon} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="••••••••"
                placeholderTextColor={theme.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity 
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowPassword(!showPassword);
                }} 
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color={theme.icon} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.label, marginTop: 20 }]}>Select user</Text>
          <View style={styles.pickerContainer}>
            {['Student', 'Faculty', 'Admin'].map((type) => (
              <Pressable
                key={type}
                style={({ pressed }) => [
                  styles.pickerItem,
                  {
                    backgroundColor: userType === type ? theme.primary : theme.input,
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  !loading && setUserType(type);
                }}
                disabled={loading}
              >
                <Text style={{
                  color: userType === type ? '#fff' : theme.text,
                  fontWeight: '600'
                }}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.loginBtn,
              {
                backgroundColor: (loading || !email || !password)
                  ? theme.disabled
                  : theme.primary,
              }
            ]}
            onPress={handleLogin}
            disabled={loading || !email || !password}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {loginMessage !== '' && (
            <Text style={[
              styles.loginMessage, 
              { 
                color: loginMessage.includes('failed') ? theme.error : theme.success 
              }
            ]}>
              {loginMessage}
            </Text>
          )}

                <TouchableOpacity 
          onPress={() => {
            Haptics.selectionAsync();
            navigation.navigate('PasswordResetScreen');
          }}
          style={styles.forgotContainer}
        >
          <Text style={[styles.forgot, { color: theme.link }]}>Forgot Password?</Text>
        </TouchableOpacity>

        </Animated.View>

        {!isKeyboardVisible && (
          <View style={styles.footer}>
            {/* <Text style={[styles.footerText, { color: theme.subtitle }]}>
              Don't have an account?
            </Text> */}
            <TouchableOpacity 
              onPress={() => {
                Haptics.selectionAsync();
                navigation.navigate('Register');
              }}
            >
              {/* <Text style={[styles.footerLink, { color: theme.primary }]}> Sign Up</Text> */}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// === THEME SETTINGS ===
const lightTheme = {
  page: '#f2f6ff',
  card: '#ffffff',
  title: '#1a1d2e',
  subtitle: '#6b7280',
  label: '#4b5563',
  text: '#1f2937',
  input: '#f3f4f6',
  icon: '#9ca3af',
  placeholder: '#9ca3af',
  link: '#4f46e5',
  primary: '#6366f1',
  disabled: '#d1d5db',
  success: '#10b981',
  error: '#ef4444',
  logoBg: '#e0e7ff',
  logoIcon: '#4f46e5',
  border: '#e5e7eb',
};

const darkTheme = {
  page: '#0f172a',
  card: '#1e293b',
  title: '#f8fafc',
  subtitle: '#94a3b8',
  label: '#cbd5e1',
  text: '#e2e8f0',
  input: '#334155',
  icon: '#94a3b8',
  placeholder: '#64748b',
  link: '#818cf8',
  primary: '#818cf8',
  disabled: '#475569',
  success: '#34d399',
  error: '#f87171',
  logoBg: '#1e1b4b',
  logoIcon: '#a5b4fc',
  border: '#334155',
};

// === STYLES ===
const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  pickerItem: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginMessage: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  forgotContainer: {
    alignSelf: 'center',
    padding: 8,
  },
  forgot: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});