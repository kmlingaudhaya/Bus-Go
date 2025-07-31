import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { router } from 'expo-router';
import Navbar from '@/components/Navbar';
import { mockNotifications } from '@/data/mockData';
import {
  Car,
  MapPin,
  Clock,
  TrendingUp,
  Activity,
  Calendar,
  Award,
  User,
  Navigation,
  QrCode,
  Ticket,
} from 'lucide-react-native';

export default function DriverDashboardScreen() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const unreadNotifications = mockNotifications.filter(
    (n) => !n.read && n.userId === String(user?.user_id || '')
  ).length;

  const stats = [
    {
      icon: Car,
      label: 'Current Vehicle',
      value: 'TN-01-AB-1234',
      color: '#DC2626',
    },
    {
      icon: Activity,
      label: "Today's Trips",
      value: '3',
      color: '#F59E0B',
    },
    {
      icon: Clock,
      label: 'Hours Driven',
      value: '6.5h',
      color: '#10B981',
    },
    {
      icon: TrendingUp,
      label: 'Rating',
      value: '4.8★',
      color: '#3B82F6',
    },
  ];

  const quickActions = [
    {
      icon: Navigation,
      title: 'My Trips',
      subtitle: 'View current and past trips',
      route: '/driver/trips',
      description:
        'Check your current trip status, view trip history, and track your performance.',
    },
   
    {
      icon: MapPin,
      title: 'Trip Tracking',
      subtitle: 'Real-time location tracking',
      route: '/driver/tracking',
      description:
        'Track your current location, update trip status, and navigate routes.',
    },
    {
      icon: User,
      title: 'Profile',
      subtitle: 'Manage your account',
      route: '/driver/profile',
      description:
        'Update your profile, view performance stats, and manage settings.',
    },
  ];

  const recentActivities = [
    {
      time: '10:30 AM',
      activity: 'Started trip from Central Station',
    },
    {
      time: '10:15 AM',
      activity: 'Completed passenger verification',
    },
    {
      time: '09:45 AM',
      activity: 'Vehicle inspection completed',
    },
    {
      time: '09:30 AM',
      activity: 'Logged in and ready for duty',
    },
  ];

  return (
    <View style={styles.container}>
      <Navbar
        title="Driver Dashboard"
        notificationCount={unreadNotifications}
      />
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back Driver</Text>
          <Text style={styles.driverName}>{user?.username}</Text>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <stat.icon size={24} color={stat.color} />
              <Text style={[styles.statValue, { color: stat.color }]}>
                {' '}
                {stat.value}{' '}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver Tools</Text>
          <Text style={styles.sectionSubtitle}>
            Access all driver features and tools
          </Text>
          <View style={styles.actionGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
              >
                <View style={styles.actionHeader}>
                  <action.icon size={24} color="#DC2626" />
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                  </View>
                </View>
                <Text style={styles.actionDescription}>
                  {action.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.overviewCard}>
            <View style={styles.overviewRow}>
              <View style={styles.overviewItem}>
                <Clock size={20} color="#6B7280" />
                <Text style={styles.overviewLabel}>On Time</Text>
                <Text style={styles.overviewValue}>100%</Text>
              </View>
              <View style={styles.overviewItem}>
                <Award size={20} color="#6B7280" />
                <Text style={styles.overviewLabel}>Safety Score</Text>
                <Text style={styles.overviewValue}>95</Text>
              </View>
              <View style={styles.overviewItem}>
                <User size={20} color="#6B7280" />
                <Text style={styles.overviewLabel}>Passengers</Text>
                <Text style={styles.overviewValue}>127</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <View style={styles.activitiesContainer}>
            {recentActivities.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityTime}>
                  <Text style={styles.timeText}>{activity.time}</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{activity.activity}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.metricsCard}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Average Rating</Text>
              <Text style={styles.metricValue}>4.8/5.0</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Customer Satisfaction</Text>
              <Text style={styles.metricValue}>92%</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Trips This Week</Text>
              <Text style={styles.metricValue}>18</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Total Distance</Text>
              <Text style={styles.metricValue}>450 km</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 0,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#DC2626',
  },
  greeting: {
    fontSize: 16,
    color: '#FEF2F2',
    marginBottom: 8,
  },
  driverName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  employeeId: {
    fontSize: 14,
    color: '#FEF2F2',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
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
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  actionDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginTop: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  overviewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewItem: {
    alignItems: 'center',
    flex: 1,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  activitiesContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  activityTime: {
    width: 80,
    marginRight: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  metricsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
});
