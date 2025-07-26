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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            Stay updated with your trip information
          </Text>
        </View>

        {/* Notifications List */}
        <View style={styles.notificationsList}>
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={48} color="#E5E7EB" />
              <Text style={styles.emptyStateTitle}>No Notifications</Text>
              <Text style={styles.emptyStateSubtitle}>
                You're all caught up! Check back later for updates.
              </Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
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

        {/* Notification Types Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Notification Types</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ticket size={16} color="#059669" />
              <Text style={styles.infoText}>Booking</Text>
            </View>
            <View style={styles.infoItem}>
              <Bus size={16} color="#3B82F6" />
              <Text style={styles.infoText}>Trip</Text>
            </View>
            <View style={styles.infoItem}>
              <Clock size={16} color="#F59E0B" />
              <Text style={styles.infoText}>Delay</Text>
            </View>
            <View style={styles.infoItem}>
              <Star size={16} color="#7C3AED" />
              <Text style={styles.infoText}>Feedback</Text>
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
  header: {
    marginTop: 16,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  notificationsList: {
    marginBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  infoSection: {
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
});