import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import {
  User as UserIcon,
  Mail,
  Shield,
  Bell,
  CreditCard,
  CircleHelp as HelpCircle,
  Settings,
  Star,
  LogOut,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    Alert.alert(t('logout'), t('logout_confirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth');
        },
      },
    ]);
  };

  // Language Switcher
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ்' },
  ];
  const currentLang = i18n.language;
  const handleChangeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'passenger':
        return '#2563EB';
      case 'conductor':
        return '#059669';
      case 'staff':
        return '#EA580C';
      default:
        return '#64748B';
    }
  };

  const getRoleBackground = (role: string) => {
    switch (role) {
      case 'passenger':
        return '#EFF6FF';
      case 'conductor':
        return '#ECFDF5';
      case 'staff':
        return '#FFF7ED';
      default:
        return '#F8FAFC';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'passenger':
        return t('role_passenger');
      case 'conductor':
        return t('role_conductor');
      case 'staff':
        return t('role_staff');
      default:
        return t('role_user');
    }
  };

  const menuItems = [
    { icon: Bell, label: t('notifications'), subtitle: t('manage_alerts') },
    {
      icon: CreditCard,
      label: t('payment_methods'),
      subtitle: t('cards_wallets'),
    },
    { icon: Star, label: t('rate_review'), subtitle: t('share_experience') },
    {
      icon: HelpCircle,
      label: t('help_support'),
      subtitle: t('get_assistance'),
    },
    { icon: Settings, label: t('settings'), subtitle: t('app_preferences') },
    {
      icon: Shield,
      label: t('privacy_policy'),
      subtitle: t('data_protection'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.firstname?.charAt(0)?.toUpperCase() ||
              user?.username?.charAt(0)?.toUpperCase() ||
              'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.firstname || user?.username}</Text>
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: getRoleBackground(user?.role || 'user') },
          ]}
        >
          <Text
            style={[
              styles.roleText,
              { color: getRoleColor(user?.role || 'user') },
            ]}
          >
            {getRoleLabel(user?.role || 'user')}
          </Text>
        </View>
      </View>

      {/* Language Switcher */}
      <View style={styles.languageSwitcher}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.langButton,
              currentLang === lang.code && styles.langButtonActive,
            ]}
            onPress={() => handleChangeLanguage(lang.code)}
            disabled={currentLang === lang.code}
          >
            <Text
              style={[
                styles.langButtonText,
                currentLang === lang.code && styles.langButtonTextActive,
              ]}
            >
              {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <UserIcon size={20} color="#64748B" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t('username')}</Text>
            <Text style={styles.infoValue}>{user?.username}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Mail size={20} color="#64748B" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t('email')}</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
        </View>
        {user?.firstname && (
          <View style={styles.infoRow}>
            <UserIcon size={20} color="#64748B" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('first_name')}</Text>
              <Text style={styles.infoValue}>{user.firstname}</Text>
            </View>
          </View>
        )}
        {user?.lastname && (
          <View style={styles.infoRow}>
            <UserIcon size={20} color="#64748B" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('last_name')}</Text>
              <Text style={styles.infoValue}>{user.lastname}</Text>
            </View>
          </View>
        )}
        {user?.dof && (
          <View style={styles.infoRow}>
            <UserIcon size={20} color="#64748B" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('date_of_birth')}</Text>
              <Text style={styles.infoValue}>{user.dof}</Text>
            </View>
          </View>
        )}
        {user?.created_at && (
          <View style={styles.infoRow}>
            <UserIcon size={20} color="#64748B" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('member_since')}</Text>
              <Text style={styles.infoValue}>
                {new Date(user.created_at).toLocaleDateString('en-IN')}
              </Text>
            </View>
          </View>
        )}
        {/* Role-based extra info example */}
        {user?.role === 'conductor' && (
          <View style={styles.infoRow}>
            <UserIcon size={20} color="#64748B" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('conductor_info')}</Text>
              <Text style={styles.infoValue}>
                {t('special_info_conductor')}
              </Text>
            </View>
          </View>
        )}
        {user?.role === 'staff' && (
          <View style={styles.infoRow}>
            <UserIcon size={20} color="#64748B" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('staff_info')}</Text>
              <Text style={styles.infoValue}>{t('special_info_staff')}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <item.icon size={20} color="#64748B" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#DC2626" />
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('app_version')}</Text>
        <Text style={styles.footerSubtext}>{t('made_with_love')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 32,
    backgroundColor: '#DC2626', // changed from blue
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#DC2626', // changed from blue
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  menuArrow: {
    fontSize: 20,
    color: '#CBD5E1',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#94A3B8',
  },
  languageSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
    gap: 8,
  },
  langButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  langButtonActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  langButtonText: {
    color: '#1E293B',
    fontWeight: '600',
    fontSize: 15,
  },
  langButtonTextActive: {
    color: '#fff',
  },
});
