import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, BackHandler, Pressable,
  useColorScheme, KeyboardAvoidingView, Platform,
  Keyboard, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('Student');
  const [loginMessage, setLoginMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', keyboardShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', keyboardHide);
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

    return () => {
      showSub.remove();
      hideSub.remove();
      backHandler.remove();
    };
  }, []);

  const keyboardShow = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const keyboardHide = () => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://192.168.65.136:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, userType }),
      });

      const data = await response.json();

      if (response.ok) {
        setLoginMessage(data.message);
        Alert.alert('Login Success', data.message);
        await AsyncStorage.setItem('authToken', data.token);
        navigation.replace(userType);
      } else {
        setLoginMessage(data.message || 'Login failed.');
        Alert.alert('Login Failed', data.message || 'Login failed.');
      }
    } catch (error) {
      console.error('Login error:', error);
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
        {/* Custom Header */}
        <View style={[styles.customHeader, { backgroundColor: theme.card }]}>
          <Text style={[styles.customHeaderText, { color: theme.title }]}>Login</Text>
        </View>

        <Animated.View style={[styles.card, { backgroundColor: theme.card, transform: [{ translateY }] }]}>
          <Text style={[styles.title, { color: theme.title }]}>Welcome Back 👋</Text>
          <Text style={[styles.subtitle, { color: theme.subtitle }]}>
            Login to continue using the Mentor Management System.
          </Text>

          <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.input }]}>
            <MaterialIcons name="email" size={22} color={theme.icon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Enter Email"
              placeholderTextColor={theme.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.input }]}>
            <Ionicons name="lock-closed" size={22} color={theme.icon} />
            <TextInput
              style={[styles.input, { color: theme.text, flex: 1 }]}
              placeholder="Enter Password"
              placeholderTextColor={theme.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 5 }}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={theme.icon} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: theme.label }]}>Select User Type</Text>
          <View style={styles.pickerContainer}>
            {['Student', 'Faculty', 'Admin'].map(type => (
              <Pressable
                key={type}
                style={[
                  styles.pickerItem,
                  {
                    backgroundColor: userType === type ? '#4a90e2' : theme.input,
                    borderColor: userType === type ? '#4a90e2' : theme.border,
                  }
                ]}
                onPress={() => !loading && setUserType(type)}
                disabled={loading}
              >
                <Text style={{
                  color: userType === type ? '#fff' : theme.text,
                  fontWeight: userType === type ? '700' : '500'
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
                  ? '#a0b8df'
                  : '#4a90e2'
              }
            ]}
            onPress={handleLogin}
            disabled={loading || !email || !password}
            activeOpacity={0.85}
          >
            <Text style={styles.loginText}>{loading ? 'Logging in...' : 'Login'}</Text>
          </TouchableOpacity>

          {loginMessage !== '' && (
            <Text style={[styles.loginMessage, { color: theme.success }]}>
              {loginMessage}
            </Text>
          )}

          <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Forgot Password flow coming soon!')}>
            <Text style={[styles.forgot, { color: theme.link }]}>Forgot Password?</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// === THEME SETTINGS ===
const lightTheme = {
  page: '#f2f6ff',
  card: '#fff',
  title: '#0c1e49',
  subtitle: '#5e6e93',
  label: '#35475e',
  text: '#222',
  border: '#d4d9e6',
  input: '#f9fafc',
  icon: '#777',
  placeholder: '#aaa',
  link: '#4a90e2',
  success: 'green',
};

const darkTheme = {
  page: '#10131a',
  card: '#1e2430',
  title: '#f0f4f9',
  subtitle: '#a0aab8',
  label: '#cfd4e0',
  text: '#f1f1f1',
  border: '#444b5e',
  input: '#2a2f3a',
  icon: '#bbb',
  placeholder: '#888',
  link: '#70b6f0',
  success: '#72e37b',
};

// === STYLES ===
const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 25,
    
  },
  customHeader: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  customHeaderText: {
    fontSize: 22,
    fontWeight: '700',
  },
  card: {
    borderRadius: 20,
    padding: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.3,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  input: {
    marginLeft: 10,
    fontSize: 17,
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  pickerItem: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.2,
    alignItems: 'center',
  },
  loginBtn: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
  },
  loginText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  loginMessage: {
    textAlign: 'center',
    marginBottom: 14,
    fontWeight: '600',
    fontSize: 16,
  },
  forgot: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 15,
    fontWeight: '600',
  },
});
