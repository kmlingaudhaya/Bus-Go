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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import {
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Heart,
  ChevronDown,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [dof, setDof] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // Role-specific fields
  // Driver fields
  const [managerUsername, setManagerUsername] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpireDate, setLicenseExpireDate] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [emergencyContactNumber, setEmergencyContactNumber] = useState('');
  const [gender, setGender] = useState('');

  // Manager fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [organization, setOrganization] = useState('');

  // Dropdown states
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showBloodGroupDropdown, setShowBloodGroupDropdown] = useState(false);

  // Form validation states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { login, register } = useAuth();
  const { t, language } = useLanguage();

  const genderOptions = ['Male', 'Female', 'Other'];
  const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (isLogin) {
      if (!(email || username)) {
        newErrors.email = 'Email or username is required';
      }
      if (!password) {
        newErrors.password = 'Password is required';
      }
    } else {
      if (!username) {
        newErrors.username = 'Username is required';
      }
      if (!email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = 'Please enter a valid email';
      }
      if (!password) {
        newErrors.password = 'Password is required';
      } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (!firstname) {
        newErrors.firstname = 'First name is required';
      }
      if (!lastname) {
        newErrors.lastname = 'Last name is required';
      }
      if (role === 'driver' && !licenseNumber) {
        newErrors.licenseNumber = 'License number is required for drivers';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuth = async () => {
    if (!validateForm()) {
      return;
    }

    if (isLogin) {
      setLoading(true);
      try {
        await login(email || username, password);
        router.replace('/');
      } catch (error: any) {
        Alert.alert(t('error'), error?.message || t('invalid_credentials'));
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const registrationData: any = {
          username,
          email,
          password,
          role,
          firstname,
          lastname,
          dof,
        };

        // Add role-specific fields
        if (role === 'driver') {
          registrationData.manager_username = managerUsername;
          registrationData.organisation = organisation;
          registrationData.mobile_number = mobileNumber;
          registrationData.address = address;
          registrationData.license_number = licenseNumber;
          registrationData.license_expire_date = licenseExpireDate;
          registrationData.blood_group = bloodGroup;
          registrationData.emergency_contact_number = emergencyContactNumber;
          registrationData.gender = gender;
        } else if (role === 'manager') {
          registrationData.phone_number = phoneNumber;
          registrationData.organization = organization;
          registrationData.address = address;
        } else if (role === 'user') {
          registrationData.phone_number = phoneNumber;
          registrationData.gender = gender;
        }

        await register(registrationData);
        Alert.alert(
          t('success') || 'Success',
          t('registration_success') || 'Registration successful! Please log in.'
        );
        setIsLogin(true);
        // Clear form
        setUsername('');
        setEmail('');
        setPassword('');
        setFirstname('');
        setLastname('');
        setDof('');
        setErrors({});
      } catch (error: any) {
        Alert.alert(
          t('error'),
          error.message || t('registration_failed') || 'Registration failed'
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const clearErrors = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const renderRoleSpecificFields = () => {
    if (role === 'driver') {
      return (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>License Number *</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.licenseNumber && styles.inputError,
              ]}
            >
              <CreditCard
                size={20}
                color={errors.licenseNumber ? '#DC2626' : '#6B7280'}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your license number"
                value={licenseNumber}
                onChangeText={(text) => {
                  setLicenseNumber(text);
                  clearErrors('licenseNumber');
                }}
              />
            </View>
            {errors.licenseNumber && (
              <Text style={styles.errorText}>{errors.licenseNumber}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Manager Username</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter manager username"
                value={managerUsername}
                onChangeText={setManagerUsername}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Organisation</Text>
            <View style={styles.inputWrapper}>
              <MapPin size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter organisation name"
                value={organisation}
                onChangeText={setOrganisation}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={styles.inputWrapper}>
              <Phone size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter mobile number"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Address</Text>
            <View style={styles.inputWrapper}>
              <MapPin size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter your address"
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>License Expire Date</Text>
            <View style={styles.inputWrapper}>
              <Calendar size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={licenseExpireDate}
                onChangeText={setLicenseExpireDate}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Blood Group</Text>
            <View style={styles.inputWrapper}>
              <Heart size={20} color="#6B7280" />
              <TouchableOpacity
                style={styles.input}
                onPress={() =>
                  setShowBloodGroupDropdown(!showBloodGroupDropdown)
                }
              >
                <Text
                  style={
                    bloodGroup ? styles.selectedText : styles.placeholderText
                  }
                >
                  {bloodGroup || 'Select blood group'}
                </Text>
              </TouchableOpacity>
              {showBloodGroupDropdown && (
                <View style={styles.dropdown}>
                  {bloodGroupOptions.map((bg) => (
                    <TouchableOpacity
                      key={bg}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setBloodGroup(bg);
                        setShowBloodGroupDropdown(false);
                      }}
                    >
                      <Text>{bg}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Emergency Contact Number</Text>
            <View style={styles.inputWrapper}>
              <Phone size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter emergency contact"
                value={emergencyContactNumber}
                onChangeText={setEmergencyContactNumber}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color="#6B7280" />
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowGenderDropdown(!showGenderDropdown)}
              >
                <Text
                  style={gender ? styles.selectedText : styles.placeholderText}
                >
                  {gender || 'Select gender'}
                </Text>
              </TouchableOpacity>
              {showGenderDropdown && (
                <View style={styles.dropdown}>
                  {genderOptions.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setGender(g);
                        setShowGenderDropdown(false);
                      }}
                    >
                      <Text>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </>
      );
    } else if (role === 'manager') {
      return (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Phone size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Organization</Text>
            <View style={styles.inputWrapper}>
              <MapPin size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter organization name"
                value={organization}
                onChangeText={setOrganization}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Address</Text>
            <View style={styles.inputWrapper}>
              <MapPin size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter your address"
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </View>
          </View>
        </>
      );
    } else if (role === 'user') {
      return (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Phone size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color="#6B7280" />
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowGenderDropdown(!showGenderDropdown)}
              >
                <Text
                  style={gender ? styles.selectedText : styles.placeholderText}
                >
                  {gender || 'Select gender'}
                </Text>
              </TouchableOpacity>
              {showGenderDropdown && (
                <View style={styles.dropdown}>
                  {genderOptions.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setGender(g);
                        setShowGenderDropdown(false);
                      }}
                    >
                      <Text>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </>
      );
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <View style={styles.headerBackground}>
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>STARTRIT</Text>
            <Text style={styles.subtitle}>Smart Transportation Solutions</Text>
            <Text style={styles.tagline}>Safe • Efficient • Connected</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {isLogin
                ? t('welcome_back') || 'Welcome Back'
                : t('create_account') || 'Create Account'}
            </Text>
            <Text style={styles.formSubtitle}>
              {isLogin
                ? t('sign_in_subtitle') || 'Sign in to your Startrit account'
                : t('create_account_subtitle') ||
                  'Join Startrit for smart transportation'}
            </Text>

            {!isLogin && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {t('role_label') || 'Role'} *
                  </Text>
                  <View style={styles.inputWrapper}>
                    <TouchableOpacity
                      style={styles.input}
                      onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                    >
                      <Text style={styles.selectedText}>
                        {t('role_' + role) || role}
                      </Text>
                    </TouchableOpacity>
                    <ChevronDown size={20} color="#6B7280" />
                    {showRoleDropdown && (
                      <View style={styles.dropdown}>
                        {['user', 'driver', 'manager'].map((r) => (
                          <TouchableOpacity
                            key={r}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setRole(r);
                              setShowRoleDropdown(false);
                            }}
                          >
                            <Text>{t('role_' + r) || r}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {t('username_label') || 'Username'} *
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.username && styles.inputError,
                    ]}
                  >
                    <User
                      size={20}
                      color={errors.username ? '#DC2626' : '#6B7280'}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={
                        t('username_placeholder') || 'Enter your username'
                      }
                      value={username}
                      onChangeText={(text) => {
                        setUsername(text);
                        clearErrors('username');
                      }}
                      autoCapitalize="none"
                    />
                  </View>
                  {errors.username && (
                    <Text style={styles.errorText}>{errors.username}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {t('firstname_label') || 'First Name'} *
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.firstname && styles.inputError,
                    ]}
                  >
                    <User
                      size={20}
                      color={errors.firstname ? '#DC2626' : '#6B7280'}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={
                        t('firstname_placeholder') || 'Enter your first name'
                      }
                      value={firstname}
                      onChangeText={(text) => {
                        setFirstname(text);
                        clearErrors('firstname');
                      }}
                    />
                  </View>
                  {errors.firstname && (
                    <Text style={styles.errorText}>{errors.firstname}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {t('lastname_label') || 'Last Name'} *
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.lastname && styles.inputError,
                    ]}
                  >
                    <User
                      size={20}
                      color={errors.lastname ? '#DC2626' : '#6B7280'}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={
                        t('lastname_placeholder') || 'Enter your last name'
                      }
                      value={lastname}
                      onChangeText={(text) => {
                        setLastname(text);
                        clearErrors('lastname');
                      }}
                    />
                  </View>
                  {errors.lastname && (
                    <Text style={styles.errorText}>{errors.lastname}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {t('dob_label') || 'Date of Birth'}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Calendar size={20} color="#6B7280" />
                    <TextInput
                      style={styles.input}
                      placeholder={t('dob_placeholder') || 'YYYY-MM-DD'}
                      value={dof}
                      onChangeText={setDof}
                    />
                  </View>
                </View>

                {renderRoleSpecificFields()}
              </>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                {isLogin
                  ? t('email_label') || 'Email or Username'
                  : t('email_label') || 'Email Address *'}
              </Text>
              <View
                style={[styles.inputWrapper, errors.email && styles.inputError]}
              >
                <Mail size={20} color={errors.email ? '#DC2626' : '#6B7280'} />
                <TextInput
                  style={styles.input}
                  placeholder={
                    isLogin
                      ? t('email_username_placeholder') ||
                        'Enter your email or username'
                      : t('email_placeholder') || 'Enter your email'
                  }
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    clearErrors('email');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                {t('password_label') || 'Password'} *
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.password && styles.inputError,
                ]}
              >
                <Lock
                  size={20}
                  color={errors.password ? '#DC2626' : '#6B7280'}
                />
                <TextInput
                  style={styles.input}
                  placeholder={
                    t('password_placeholder') || 'Enter your password'
                  }
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    clearErrors('password');
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>
                  {isLogin
                    ? t('sign_in_button') || 'Sign In'
                    : t('sign_up_button') || 'Sign Up'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.switchText}>
                {isLogin
                  ? t('no_account') + (t('sign_up_link') || 'Sign Up')
                  : t('have_account') + (t('sign_in_link') || 'Sign In')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
  },
  headerSection: {
    height: 280,
    position: 'relative',
  },
  headerBackground: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #FF6B35 0%, #DC2626 100%)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: '#FEF2F2',
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  tagline: {
    fontSize: 14,
    color: '#FEF2F2',
    textAlign: 'center',
    fontWeight: '400',
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
    padding: 20,
    marginTop: -30,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  passwordToggle: {
    padding: 4,
  },
  selectedText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '500',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  dropdown: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    zIndex: 1000,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  button: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  switchText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
});
