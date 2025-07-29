import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  MapPin,
  Bus,
  Ticket,
  Star,
} from 'lucide-react-native';

interface Notification {
  id: string;
  type: 'booking' | 'trip' | 'system' | 'delay' | 'cancellation' | 'feedback';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Mock notifications data
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'booking',
      title: 'Booking Confirmed',
      message: 'Your ticket for Chennai to Madurai has been confirmed. Seat A12.',
      timestamp: new Date('2024-01-25T08:00:00'),
      read: false,
      priority: 'high',
    },
    {
      id: '2',
      type: 'trip',
      title: 'Trip Started',
      message: 'Your bus TN-01-AB-1234 has started its journey from Chennai.',
      timestamp: new Date('2024-01-25T08:15:00'),
      read: false,
      priority: 'medium',
    },
    {
      id: '3',
      type: 'delay',
      title: 'Trip Delayed',
      message: 'Your bus is running 15 minutes behind schedule due to traffic.',
      timestamp: new Date('2024-01-25T08:30:00'),
      read: true,
      priority: 'medium',
    },
    {
      id: '4',
      type: 'feedback',
      title: 'Rate Your Trip',
      message: 'How was your journey? Please rate your experience.',
      timestamp: new Date('2024-01-24T18:00:00'),
      read: true,
      priority: 'low',
    },
    {
      id: '5',
      type: 'system',
      title: 'App Update Available',
      message: 'A new version of TNSTC Bus Booking app is available.',
      timestamp: new Date('2024-01-23T10:00:00'),
      read: true,
      priority: 'low',
    },
    {
      id: '6',
      type: 'booking',
      title: 'Payment Successful',
      message: 'Payment of ₹450 for your ticket has been processed successfully.',
      timestamp: new Date('2024-01-22T15:30:00'),
      read: true,
      priority: 'high',
    },
  ];

  // Filter options for notification types
  const typeOptions = [
    { key: 'all', label: 'All', icon: <Bell size={16} color="#6B7280" /> },
    { key: 'booking', label: 'Booking', icon: <Ticket size={16} color="#059669" /> },
    { key: 'trip', label: 'Trip', icon: <Bus size={16} color="#3B82F6" /> },
    { key: 'delay', label: 'Delay', icon: <Clock size={16} color="#F59E0B" /> },
    { key: 'cancellation', label: 'Cancel', icon: <AlertTriangle size={16} color="#DC2626" /> },
    { key: 'feedback', label: 'Feedback', icon: <Star size={16} color="#7C3AED" /> },
    { key: 'system', label: 'System', icon: <Info size={16} color="#6B7280" /> },
  ];

  const [selectedType, setSelectedType] = React.useState('all');

  const filteredNotifications =
    selectedType === 'all'
      ? notifications
      : notifications.filter((n) => n.type === selectedType);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Ticket size={20} color="#059669" />;
      case 'trip':
        return <Bus size={20} color="#3B82F6" />;
      case 'delay':
        return <Clock size={20} color="#F59E0B" />;
      case 'cancellation':
        return <AlertTriangle size={20} color="#DC2626" />;
      case 'feedback':
        return <Star size={20} color="#7C3AED" />;
      case 'system':
        return <Info size={20} color="#6B7280" />;
      default:
        return <Bell size={20} color="#6B7280" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking':
        return '#059669';
      case 'trip':
        return '#3B82F6';
      case 'delay':
        return '#F59E0B';
      case 'cancellation':
        return '#DC2626';
      case 'feedback':
        return '#7C3AED';
      case 'system':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#DC2626';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#059669';
      default:
        return '#6B7280';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return timestamp.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      <Navbar title="Notifications" notificationCount={unreadCount} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            Stay updated with your trip information
          </Text>
        </View>

        {/* Filter Bar */}
        <View style={styles.filtersContainer}>
          <View style={styles.filtersHeader}>
            <Bell size={16} color="#6B7280" />
            <Text style={styles.filtersTitle}>Filter by Type</Text>
          </View>
          <View style={styles.filtersGrid}>
            {typeOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterButton,
                  selectedType === option.key && styles.selectedFilterButton,
                ]}
                onPress={() => setSelectedType(option.key)}
              >
                {option.icon}
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedType === option.key && styles.selectedFilterButtonText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notifications List */}
        <View style={styles.notificationsList}>
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Bell size={48} color="#E5E7EB" />
              <Text style={styles.emptyText}>No notifications found.</Text>
              <Text style={styles.emptySubtext}>
                You're all caught up! Check back later for updates.
              </Text>
            </View>
          ) : (
            filteredNotifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.card,
                  !notification.read && styles.unreadNotification,
                ]}
              >
                <View style={styles.notificationIcon}>
                  {getNotificationIcon(notification.type)}
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <View style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(notification.priority) + '20' }
                    ]}>
                      <Text style={[
                        styles.priorityText,
                        { color: getPriorityColor(notification.priority) }
                      ]}>
                        {notification.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                  <View style={styles.notificationFooter}>
                    <Text style={styles.notificationTime}>
                      {formatTimestamp(notification.timestamp)}
                    </Text>
                    {!notification.read && (
                      <View style={styles.unreadIndicator} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// Updated styles for trips.tsx look
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  filtersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    marginRight: 8,
  },
  selectedFilterButton: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
  },
  selectedFilterButtonText: {
    color: '#FFFFFF',
  },
  notificationsList: {
    padding: 16,
    marginBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 15,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 8,
    fontWeight: '600',
  },
  notificationMessage: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
});