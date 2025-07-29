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
  ChartBar as BarChart3,
  Bus,
  Users,
  Ticket,
  MapPin,
  TrendingUp,
  Clock,
  CircleAlert as AlertCircle,
  Car,
  UserCheck,
  DollarSign,
  Activity,
} from 'lucide-react-native';

export default function StaffDashboardScreen() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const unreadNotifications = mockNotifications.filter(
    (n) => !n.read && n.userId === String(user?.user_id || '')
  ).length;

  const stats = [
    {
      icon: Car,
      label: 'Active Vehicles',
      value: '45',
      color: '#DC2626',
    },
    {
      icon: UserCheck,
      label: 'Available Drivers',
      value: '23',
      color: '#F59E0B',
    },
    {
      icon: Activity,
      label: 'Active Trips',
      value: '12',
      color: '#10B981',
    },
    {
      icon: DollarSign,
      label: "Today's Revenue",
      value: '₹1.2L',
      color: '#3B82F6',
    },
  ];

  const quickActions = [
    {
      icon: Car,
      title: 'Vehicles Management',
      subtitle: 'Manage fleet, add/edit vehicles',
      route: '/manager/vehicles',
      description:
        'Add new vehicles, track maintenance, monitor fuel levels, and manage your entire fleet.',
    },
    {
      icon: UserCheck,
      title: 'Drivers Management',
      subtitle: 'Manage drivers and their profiles',
      route: '/manager/drivers',
      description:
        'Add new drivers, update profiles, track performance, and manage driver assignments.',
    },
    {
      icon: Activity,
      title: 'Trip Management',
      subtitle: 'Monitor and manage all trips',
      route: '/manager/trips',
      description:
        'Track active trips, view completed journeys, monitor driver performance, and manage schedules.',
    },
    {
      icon: TrendingUp,
      title: 'Leaderboard',
      subtitle: 'View performance rankings',
      route: '/manager/leaderboard',
      description:
        'See top-performing drivers, track metrics, and recognize achievements across your team.',
    },
    {
      icon: Users,
      title: 'Profile',
      subtitle: 'Manage your account settings',
      route: '/manager/profile',
      description:
        'Update your profile information, change settings, and manage your account preferences.',
    },
  ];

  const recentActivities = [
    {
      time: '10:30 AM',
      activity: t('recent_activity_1'),
    },
    {
      time: '10:15 AM',
      activity: t('recent_activity_2'),
    },
    {
      time: '09:45 AM',
      activity: t('recent_activity_3'),
    },
    {
      time: '09:30 AM',
      activity: t('recent_activity_4'),
    },
  ];

  return (
    <View style={styles.container}>
      <Navbar
        title={t('staff_dashboard')}
        notificationCount={unreadNotifications}
      />
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back Manager</Text>
          <Text style={styles.staffName}>{user?.username}</Text>
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
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <Text style={styles.sectionSubtitle}>
            Tap to navigate to any page
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
          <Text style={styles.sectionTitle}>{t('todays_overview')}</Text>
          <View style={styles.overviewCard}>
            <View style={styles.overviewRow}>
              <View style={styles.overviewItem}>
                <Clock size={20} color="#6B7280" />
                <Text style={styles.overviewLabel}>{t('on_time')}</Text>
                <Text style={styles.overviewValue}>85%</Text>
              </View>
              <View style={styles.overviewItem}>
                <AlertCircle size={20} color="#6B7280" />
                <Text style={styles.overviewLabel}>{t('delayed')}</Text>
                <Text style={styles.overviewValue}>7</Text>
              </View>
              <View style={styles.overviewItem}>
                <Users size={20} color="#6B7280" />
                <Text style={styles.overviewLabel}>{t('occupancy')}</Text>
                <Text style={styles.overviewValue}>78%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('recent_activities')}</Text>
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
          <Text style={styles.sectionTitle}>{t('performance_metrics')}</Text>
          <View style={styles.metricsCard}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>{t('average_rating')}</Text>
              <Text style={styles.metricValue}>4.2/5.0</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>
                {t('customer_satisfaction')}
              </Text>
              <Text style={styles.metricValue}>87%</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>{t('fleet_utilization')}</Text>
              <Text style={styles.metricValue}>92%</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>{t('revenue_growth')}</Text>
              <Text style={styles.metricValue}>+12%</Text>
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
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  staffName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  employeeId: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    margin: '1%',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
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
    color: '#DC2626', // changed from blue
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
  overviewContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  overviewText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 4,
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
    fontWeight: '600',
    color: '#1F2937',
  },
});
