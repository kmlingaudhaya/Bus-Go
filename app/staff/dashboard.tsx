import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
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
} from 'lucide-react-native';

export default function StaffDashboardScreen() {
  const { user } = useAuth();
  const unreadNotifications = mockNotifications.filter(
    (n) => !n.read && n.userId === user?.user_id
  ).length;

  const stats = [
    { icon: Bus, label: 'Active Buses', value: '45', color: '#DC2626' },
    { icon: Users, label: 'Waiting List', value: '23', color: '#F59E0B' },
    { icon: Ticket, label: "Today's Bookings", value: '287', color: '#10B981' },
    { icon: TrendingUp, label: 'Revenue', value: '₹1.2L', color: '#3B82F6' },
  ];

  const quickActions = [
    {
      icon: Bus,
      title: 'Add New Bus',
      subtitle: 'Schedule new route',
      route: '/staff/buses',
    },
    {
      icon: Ticket,
      title: 'Offline Booking',
      subtitle: 'Manual ticket booking',
      route: '/staff/booking',
    },
    {
      icon: Users,
      title: 'Manage Waitlist',
      subtitle: 'Process waiting passengers',
      route: '/staff/waitlist',
    },
    {
      icon: MapPin,
      title: 'Track Buses',
      subtitle: 'Monitor live locations',
      route: '/staff/tracking',
    },
  ];

  const recentActivities = [
    {
      time: '10:30 AM',
      activity: 'New bus TN 09 Z 5678 added to Chennai-Salem route',
    },
    {
      time: '10:15 AM',
      activity: '15 passengers moved from waitlist to confirmed',
    },
    {
      time: '09:45 AM',
      activity: 'Bus TN 11 X 1234 reported 30 minutes delay',
    },
    {
      time: '09:30 AM',
      activity: 'Offline booking completed for 5 passengers',
    },
  ];

  return (
    <View style={styles.container}>
      <Navbar title="Staff Dashboard" notificationCount={unreadNotifications} />

      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.staffName}>{user?.username}</Text>
          <Text style={styles.employeeId}>Employee ID: {user?.user_id}</Text>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <stat.icon size={24} color={stat.color} />
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
              >
                <action.icon size={24} color="#DC2626" />
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
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
                <Text style={styles.overviewValue}>85%</Text>
              </View>
              <View style={styles.overviewItem}>
                <AlertCircle size={20} color="#6B7280" />
                <Text style={styles.overviewLabel}>Delayed</Text>
                <Text style={styles.overviewValue}>7</Text>
              </View>
              <View style={styles.overviewItem}>
                <Users size={20} color="#6B7280" />
                <Text style={styles.overviewLabel}>Occupancy</Text>
                <Text style={styles.overviewValue}>78%</Text>
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
              <Text style={styles.metricValue}>4.2/5.0</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Customer Satisfaction</Text>
              <Text style={styles.metricValue}>87%</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Fleet Utilization</Text>
              <Text style={styles.metricValue}>92%</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Revenue Growth</Text>
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
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
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
