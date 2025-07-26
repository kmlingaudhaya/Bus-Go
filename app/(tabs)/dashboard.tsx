import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import {
  Bus,
  Ticket,
  MapPin,
  Clock,
  Star,
  TrendingUp,
  Calendar,
  AlertTriangle,
  User,
  Phone,
  Mail,
  Navigation,
} from 'lucide-react-native';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  route: string;
}

interface TripStats {
  totalTrips: number;
  completedTrips: number;
  averageRating: number;
  totalDistance: number;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Get user name safely
  const userName = user && typeof user === 'object' && 'firstname' in user
    ? (user as any).firstname || 'User'
    : 'User';

  // Mock trip statistics
  const tripStats: TripStats = {
    totalTrips: 24,
    completedTrips: 22,
    averageRating: 4.5,
    totalDistance: 1250,
  };

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Book Ticket',
      subtitle: 'Find and book your journey',
      icon: <Ticket size={24} color="#FFFFFF" />,
      color: '#DC2626',
      route: '/(tabs)/index',
    },
    {
      id: '2',
      title: 'Track Bus',
      subtitle: 'Real-time bus tracking',
      icon: <MapPin size={24} color="#FFFFFF" />,
      color: '#059669',
      route: '/(tabs)/track',
    },
    {
      id: '3',
      title: 'My Tickets',
      subtitle: 'View booking history',
      icon: <Ticket size={24} color="#FFFFFF" />,
      color: '#7C3AED',
      route: '/(tabs)/tickets',
    },
    {
      id: '4',
      title: 'Trip Details',
      subtitle: 'Current trip information',
      icon: <Bus size={24} color="#FFFFFF" />,
      color: '#EA580C',
      route: '/(tabs)/trip-details',
    },
    {
      id: '5',
      title: 'Grievances',
      subtitle: 'Report issues',
      icon: <AlertTriangle size={24} color="#FFFFFF" />,
      color: '#DC2626',
      route: '/(tabs)/grievances',
    },
    {
      id: '6',
      title: 'Notifications',
      subtitle: 'Stay updated',
      icon: <Clock size={24} color="#FFFFFF" />,
      color: '#0891B2',
      route: '/(tabs)/notifications',
    },
  ];

  const handleQuickAction = (route: string) => {
    router.push(route as any);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      <Navbar title="Dashboard" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeContent}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{userName}!</Text>
            <Text style={styles.welcomeSubtitle}>
              Welcome to TNSTC Bus Booking
            </Text>
          </View>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={32} color="#DC2626" />
            </View>
          </View>
        </View>

        {/* Trip Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Journey Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Bus size={20} color="#DC2626" />
              </View>
              <Text style={styles.statNumber}>{tripStats.totalTrips}</Text>
              <Text style={styles.statLabel}>Total Trips</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Star size={20} color="#F59E0B" />
              </View>
              <Text style={styles.statNumber}>{tripStats.averageRating}</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <TrendingUp size={20} color="#059669" />
              </View>
              <Text style={styles.statNumber}>{tripStats.completedTrips}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Navigation size={20} color="#7C3AED" />
              </View>
              <Text style={styles.statNumber}>{tripStats.totalDistance}km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickActionCard, { backgroundColor: action.color }]}
                onPress={() => handleQuickAction(action.route)}
              >
                <View style={styles.quickActionIcon}>{action.icon}</View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ticket size={16} color="#059669" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Ticket booked for Chennai to Madurai</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Star size={16} color="#F59E0B" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Rated your last trip 5 stars</Text>
                <Text style={styles.activityTime}>1 day ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <MapPin size={16} color="#7C3AED" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Tracked bus TN-01-AB-1234</Text>
                <Text style={styles.activityTime}>3 days ago</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Support Contact */}
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Need Help?</Text>
          <View style={styles.supportCard}>
            <View style={styles.supportItem}>
              <Phone size={20} color="#DC2626" />
              <Text style={styles.supportText}>Call: 1800-425-1234</Text>
            </View>
            <View style={styles.supportItem}>
              <Mail size={20} color="#DC2626" />
              <Text style={styles.supportText}>Email: support@tnstc.in</Text>
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
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  welcomeContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  avatarContainer: {
    marginLeft: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FECACA',
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
    width: (width - 48) / 2,
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
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 48) / 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  quickActionIcon: {
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 10,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  recentActivitySection: {
    marginBottom: 24,
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  supportSection: {
    marginBottom: 24,
  },
  supportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  supportText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 12,
  },
}); 