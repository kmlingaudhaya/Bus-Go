import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import {
  Menu,
  Bell,
  X,
  Bus,
  User,
  Ticket,
  MapPin,
  Settings,
  ChartBar as BarChart3,
  QrCode,
  Users,
  LogOut,
} from 'lucide-react-native';
import RaiseTicketScreen from '@/app/raise-ticket';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavbarProps {
  title: string;
  notificationCount?: number;
}

export default function Navbar({ title, notificationCount = 0 }: NavbarProps) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [showRaiseTicket, setShowRaiseTicket] = useState(false);

  const handleLogout = async () => {
    setShowMenu(false);
    await logout();
    router.replace('/auth');
  };

  const getMenuItems = () => {
    const commonItems = [
      { icon: User, label: t('profile') || 'Profile', route: '/profile' },
      {
        icon: Bell,
        label: t('notifications') || 'Notifications',
        route: '/notifications',
      },
      {
        icon: Settings,
        label: t('settings') || 'Settings',
        route: '/settings',
      },
    ];

    let raiseTicketItem = null;
    if (user?.role === 'passenger' || user?.role === 'conductor') {
      raiseTicketItem = {
        icon: Ticket,
        label: t('complaint'),
        action: () => {
          setShowMenu(false);
          setShowRaiseTicket(true);
        },
      };
    }

    switch (user?.role) {
      case 'passenger':
        return [
          {
            icon: Bus,
            label: t('search_buses') ,
            route: '/(tabs)',
          },
          {
            icon: Ticket,
            label: t('my_tickets'),
            route: '/(tabs)/tickets',
          },
          {
            icon: MapPin,
            label: t('track_trip'),
            route: '/(tabs)/tracking',
          },
          ...(raiseTicketItem ? [raiseTicketItem] : []),
          ...commonItems,
        ];
      case 'conductor':
        return [
          {
            icon: Bus,
            label: t('my_trips') || 'My Trips',
            route: '/conductor/trips',
          },
          {
            icon: QrCode,
            label: t('qr_scanner') || 'QR Scanner',
            route: '/conductor/scanner',
          },
          {
            icon: MapPin,
            label: t('trip_tracking') || 'Trip Tracking',
            route: '/conductor/tracking',
          },
          {
            icon: Ticket,
            label: t('manual_booking') || 'Manual Booking',
            route: '/conductor/booking',
          },
          ...(raiseTicketItem ? [raiseTicketItem] : []),
          ...commonItems,
        ];
      case 'staff':
        return [
          {
            icon: BarChart3,
            label: t('dashboard') || 'Dashboard',
            route: '/staff/dashboard',
          },
          {
            icon: Bus,
            label: t('manage_buses') || 'Manage Buses',
            route: '/staff/buses',
          },
          {
            icon: Users,
            label: t('waiting_list') || 'Waiting List',
            route: '/staff/waitlist',
          },
          {
            icon: MapPin,
            label: t('trip_tracking') || 'Trip Tracking',
            route: '/staff/tracking',
          },
          {
            icon: Ticket,
            label: t('offline_booking') || 'Offline Booking',
            route: '/staff/booking',
          },
          ...commonItems,
        ];
      default:
        return commonItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowMenu(true)}
        >
          <Menu size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.title}>{title}</Text>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push('/notifications')}
        >
          <Bell size={24} color="#FFFFFF" />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>
                {notificationCount > 99 ? '99+' : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showMenu}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.userName}>{user?.username}</Text>
                  <Text style={styles.userRole}>
                    {user?.role === 'passenger'
                      ? t('passenger') || 'Passenger'
                      : user?.role === 'conductor'
                      ? t('conductor') || 'Conductor'
                      : t('staff_member') || 'Staff Member'}
                  </Text>
                  {user?.user_id && (
                    <Text style={styles.employeeId}>
                      {(t('id_colon') || 'ID: {id}').replace(
                        '{id}',
                        String(user.user_id)
                      )}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowMenu(false)}
              >
                <X size={24} color="#DC2626" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.menuItems}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => {
                    if (item.action) {
                      item.action();
                    } else {
                      setShowMenu(false);
                      router.push(item.route as any);
                    }
                  }}
                >
                  <item.icon size={20} color="#DC2626" />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.menuItem, styles.logoutItem]}
                onPress={handleLogout}
              >
                <LogOut size={20} color="#DC2626" />
                <Text style={styles.menuItemText}>
                  {t('logout') || 'Logout'}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.menuFooter}>
              <Text style={styles.footerText}>
                {t('tamil_nadu_state_transport') ||
                  'Tamil Nadu State Transport'}
              </Text>
              <Text style={styles.footerSubtext}>
                {t('government_of_tamil_nadu') || 'Government of Tamil Nadu'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Raise Ticket Modal */}
      <Modal
        visible={showRaiseTicket}
        animationType="slide"
        onRequestClose={() => setShowRaiseTicket(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <TouchableOpacity
            style={{ alignSelf: 'flex-end', padding: 16 }}
            onPress={() => setShowRaiseTicket(false)}
          >
            <X size={28} color="#DC2626" />
            <Text
              style={{ color: '#DC2626', fontWeight: '600', marginLeft: 8 }}
            >
              {t('close') || 'Close'}
            </Text>
          </TouchableOpacity>
          <RaiseTicketScreen />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 12,
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  menuButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  notificationCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: '85%',
    maxWidth: 320,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#DC2626',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DC2626',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userRole: {
    fontSize: 14,
    color: '#FEF2F2',
    marginTop: 2,
  },
  employeeId: {
    fontSize: 12,
    color: '#FEF2F2',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  menuItems: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  logoutItem: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 20,
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  menuFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});
