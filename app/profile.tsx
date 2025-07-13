import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { User as UserIcon, Mail, Shield, Bell, CreditCard, CircleHelp as HelpCircle, Settings, Star, LogOut } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth');
          }
        }
      ]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'passenger': return '#2563EB';
      case 'conductor': return '#059669';
      case 'staff': return '#EA580C';
      default: return '#64748B';
    }
  };

  const getRoleBackground = (role: string) => {
    switch (role) {
      case 'passenger': return '#EFF6FF';
      case 'conductor': return '#ECFDF5';
      case 'staff': return '#FFF7ED';
      default: return '#F8FAFC';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'passenger': return 'Passenger';
      case 'conductor': return 'Conductor';
      case 'staff': return 'Staff';
      default: return 'User';
    }
  };

  const menuItems = [
    { icon: Bell, label: 'Notifications', subtitle: 'Manage your alerts' },
    { icon: CreditCard, label: 'Payment Methods', subtitle: 'Cards and wallets' },
    { icon: Star, label: 'Rate & Review', subtitle: 'Share your experience' },
    { icon: HelpCircle, label: 'Help & Support', subtitle: 'Get assistance' },
    { icon: Settings, label: 'Settings', subtitle: 'App preferences' },
    { icon: Shield, label: 'Privacy Policy', subtitle: 'Data protection' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.firstname?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.firstname || user?.username}</Text>
        <View style={[
          styles.roleBadge,
          { backgroundColor: getRoleBackground(user?.role || 'user') }
        ]}>
          <Text style={[
            styles.roleText,
            { color: getRoleColor(user?.role || 'user') }
          ]}>
            {getRoleLabel(user?.role || 'user')}
          </Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <UserIcon size={20} color="#64748B" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{user?.username}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Mail size={20} color="#64748B" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
        </View>
        {user?.firstname && (
          <View style={styles.infoRow}>
            <UserIcon size={20} color="#64748B" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>First Name</Text>
              <Text style={styles.infoValue}>{user.firstname}</Text>
            </View>
          </View>
        )}
        {user?.lastname && (
        <View style={styles.infoRow}>
            <UserIcon size={20} color="#64748B" />
          <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Last Name</Text>
              <Text style={styles.infoValue}>{user.lastname}</Text>
            </View>
          </View>
        )}
        {user?.dof && (
          <View style={styles.infoRow}>
            <UserIcon size={20} color="#64748B" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>{user.dof}</Text>
          </View>
        </View>
        )}
        {user?.created_at && (
        <View style={styles.infoRow}>
            <UserIcon size={20} color="#64748B" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>{new Date(user.created_at).toLocaleDateString('en-IN')}</Text>
            </View>
          </View>
        )}
        {/* Role-based extra info example */}
        {user?.role === 'conductor' && (
          <View style={styles.infoRow}>
            <UserIcon size={20} color="#64748B" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Conductor Info</Text>
              <Text style={styles.infoValue}>Special info for conductors</Text>
            </View>
          </View>
        )}
        {user?.role === 'staff' && (
          <View style={styles.infoRow}>
            <UserIcon size={20} color="#64748B" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Staff Info</Text>
              <Text style={styles.infoValue}>Special info for staff</Text>
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
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Bus Ticketing App v1.0.0</Text>
        <Text style={styles.footerSubtext}>Made with ❤️ for Tamil Nadu</Text>
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
});