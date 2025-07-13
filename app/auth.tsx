import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Bus, Mail, Lock, User } from 'lucide-react-native';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [dof, setDof] = useState('');
  const [role, setRole] = useState('passenger');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleAuth = async () => {
    if (isLogin) {
      if (!(email || username) || !password) {
        Alert.alert('Error', 'Please enter your email/username and password');
        return;
      }
      setLoading(true);
      try {
        await login(email || username, password);
        router.replace('/');
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'Invalid credentials');
      } finally {
        setLoading(false);
      }
    } else {
      if (!username || !email || !password || !role) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }
      setLoading(true);
      try {
        await register({
          username,
          email,
          password,
          role,
          firstname,
          lastname,
          dof,
        });
        Alert.alert('Success', 'Registration successful! Please log in.');
        setIsLogin(true);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Registration failed');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.headerSection}>
        <Image
          source={{
            uri: 'https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=400',
          }}
          style={styles.headerImage}
        />
        <View style={styles.headerOverlay}>
          <Bus size={48} color="#FFFFFF" />
          <Text style={styles.title}>Tamil Nadu State Transport</Text>
          <Text style={styles.subtitle}>Government of Tamil Nadu</Text>
          <Text style={styles.tagline}>Safe • Reliable • Affordable</Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.form}>
          <Text style={styles.formTitle}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={styles.formSubtitle}>
            {isLogin
              ? 'Sign in to your account'
              : 'Register for TNSTC services'}
          </Text>

          {!isLogin && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username *</Text>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>First Name</Text>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your first name"
                    value={firstname}
                    onChangeText={setFirstname}
                  />
                </View>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your last name"
                    value={lastname}
                    onChangeText={setLastname}
                  />
                </View>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    value={dof}
                    onChangeText={setDof}
                  />
                </View>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Role *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="passenger, conductor, staff"
                    value={role}
                    onChangeText={setRole}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {isLogin ? 'Email or Username' : 'Email Address *'}
            </Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder={
                  isLogin ? 'Enter your email or username' : 'Enter your email'
                }
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password *</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchText}>
              {isLogin
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
  },
  headerSection: {
    height: 250,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#FEF2F2',
    marginTop: 4,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: '#FEF2F2',
    marginTop: 8,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    padding: 20,
    marginTop: -20,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  switchText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
  },
  quickLogin: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 40,
  },
  quickLoginTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickLoginSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  quickLoginButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  passengerButton: {
    backgroundColor: '#FEF2F2',
  },
  conductorButton: {
    backgroundColor: '#FEF2F2',
  },
  staffButton: {
    backgroundColor: '#FEF2F2',
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 4,
  },
});
