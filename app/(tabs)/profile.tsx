import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Settings,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Edit,
  Star,
  Award,
  Clock,
  Navigation,
  CreditCard,
  FileText,
  Download,
  CheckCircle,
} from 'lucide-react-native';

interface ProfileSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}

interface SettingItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  type: 'toggle' | 'button';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  // Get user details safely
  const userName = user && typeof user === 'object' && 'firstname' in user
    ? (user as any).firstname || 'User'
    : 'User';
  
  const userEmail = user && typeof user === 'object' && 'email' in user
    ? (user as any).email || 'user@example.com'
    : 'user@example.com';

  const userPhone = user && typeof user === 'object' && 'phone' in user
    ? (user as any).phone || '+91-98765-43210'
    : '+91-98765-43210';

  // Mock user stats
  const userStats = {
    totalTrips: 24,
    completedTrips: 22,
    averageRating: 4.5,
    totalDistance: 1250,
    memberSince: '2023',
  };

  const profileSections: ProfileSection[] = [
    {
      id: '1',
      title: 'Edit Profile',
      icon: <Edit size={20} color="#6B7280" />,
      onPress: () => Alert.alert('Edit Profile', 'Edit profile functionality will be implemented here'),
    },
    {
      id: '2',
      title: 'My Tickets',
      icon: <FileText size={20} color="#6B7280" />,
      onPress: () => Alert.alert('My Tickets', 'View your ticket history'),
    },
    {
      id: '3',
      title: 'Payment Methods',
      icon: <CreditCard size={20} color="#6B7280" />,
      onPress: () => Alert.alert('Payment Methods', 'Manage your payment methods'),
    },
    {
      id: '4',
      title: 'Download Tickets',
      icon: <Download size={20} color="#6B7280" />,
      onPress: () => Alert.alert('Download Tickets', 'Download your tickets for offline access'),
    },
  ];

  const settingsItems: SettingItem[] = [
    {
      id: '1',
      title: 'Push Notifications',
      subtitle: 'Receive updates about your trips',
      icon: <Bell size={20} color="#6B7280" />,
      type: 'toggle',
      value: notificationsEnabled,
      onToggle: setNotificationsEnabled,
    },
    {
      id: '2',
      title: 'Location Services',
      subtitle: 'Allow location access for bus tracking',
      icon: <Navigation size={20} color="#6B7280" />,
      type: 'toggle',
      value: locationEnabled,
      onToggle: setLocationEnabled,
    },
    {
      id: '3',
      title: 'Dark Mode',
      subtitle: 'Switch to dark theme',
      icon: <Settings size={20} color="#6B7280" />,
      type: 'toggle',
      value: darkModeEnabled,
      onToggle: setDarkModeEnabled,
    },
    {
      id: '4',
      title: 'Language',
      subtitle: language === 'en' ? 'English' : 'Tamil',
      icon: <Settings size={20} color="#6B7280" />,
      type: 'button',
      onPress: () => {
        const newLanguage = language === 'en' ? 'ta' : 'en';
        setLanguage(newLanguage);
        Alert.alert('Language Changed', `Language changed to ${newLanguage === 'en' ? 'English' : 'Tamil'}`);
      },
    },
    {
      id: '5',
      title: 'Privacy Policy',
      subtitle: 'Read our privacy policy',
      icon: <Shield size={20} color="#6B7280" />,
      type: 'button',
      onPress: () => Alert.alert('Privacy Policy', 'Privacy policy will be shown here'),
    },
    {
      id: '6',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: <HelpCircle size={20} color="#6B7280" />,
      type: 'button',
      onPress: () => Alert.alert('Help & Support', 'Help and support options will be shown here'),
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Navbar title="Profile" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400' }}
              style={styles.profileImage}
              defaultSource={require('@/assets/images/icon.png')}
            />
            <TouchableOpacity style={styles.editImageButton}>
              <Edit size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileEmail}>{userEmail}</Text>
            <View style={styles.ratingContainer}>
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>{userStats.averageRating}</Text>
              <Text style={styles.ratingSubtext}>({userStats.totalTrips} trips)</Text>
            </View>
          </View>
        </View>

        {/* User Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Journey Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Award size={20} color="#DC2626" />
              <Text style={styles.statNumber}>{userStats.totalTrips}</Text>
              <Text style={styles.statLabel}>Total Trips</Text>
            </View>
            <View style={styles.statCard}>
              <CheckCircle size={20} color="#059669" />
              <Text style={styles.statNumber}>{userStats.completedTrips}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Navigation size={20} color="#7C3AED" />
              <Text style={styles.statNumber}>{userStats.totalDistance}km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statCard}>
              <Clock size={20} color="#F59E0B" />
              <Text style={styles.statNumber}>{userStats.memberSince}</Text>
              <Text style={styles.statLabel}>Member Since</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {profileSections.map((section) => (
              <TouchableOpacity
                key={section.id}
                style={styles.actionCard}
                onPress={section.onPress}
              >
                <View style={styles.actionIcon}>{section.icon}</View>
                <Text style={styles.actionTitle}>{section.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsList}>
            {settingsItems.map((item) => (
              <View key={item.id} style={styles.settingItem}>
                <View style={styles.settingIcon}>{item.icon}</View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                </View>
                {item.type === 'toggle' ? (
                  <Switch
                    value={item.value}
                    onValueChange={item.onToggle}
                    trackColor={{ false: '#E5E7EB', true: '#DC2626' }}
                    thumbColor="#FFFFFF"
                  />
                ) : (
                  <TouchableOpacity onPress={item.onPress}>
                    <Text style={styles.settingButton}>Change</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#DC2626" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  ratingSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  settingsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  settingButton: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  logoutSection: {
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
  },
});