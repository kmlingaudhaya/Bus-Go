import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Star,
  Users,
} from 'lucide-react-native';

interface LeaderboardEntry {
  id: string;
  name: string;
  role: 'driver' | 'manager';
  score: number;
  rank: number;
  avatar?: string;
  metrics: {
    trips: number;
    rating: number;
    onTime: number;
    safety: number;
  };
}

export default function ManagerLeaderboardScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Mock leaderboard data
  const mockLeaderboard: LeaderboardEntry[] = [
    {
      id: '1',
      name: 'Ravi Kumar',
      role: 'driver',
      score: 950,
      rank: 1,
      metrics: {
        trips: 45,
        rating: 4.8,
        onTime: 95,
        safety: 98,
      },
    },
    {
      id: '2',
      name: 'Suresh Babu',
      role: 'driver',
      score: 920,
      rank: 2,
      metrics: {
        trips: 42,
        rating: 4.7,
        onTime: 92,
        safety: 96,
      },
    },
    {
      id: '3',
      name: 'Priya Sharma',
      role: 'driver',
      score: 890,
      rank: 3,
      metrics: {
        trips: 38,
        rating: 4.6,
        onTime: 88,
        safety: 94,
      },
    },
    {
      id: '4',
      name: 'Muthu Raja',
      role: 'driver',
      score: 875,
      rank: 4,
      metrics: {
        trips: 40,
        rating: 4.5,
        onTime: 90,
        safety: 92,
      },
    },
    {
      id: '5',
      name: 'Lakshmi Devi',
      role: 'manager',
      score: 860,
      rank: 5,
      metrics: {
        trips: 35,
        rating: 4.4,
        onTime: 85,
        safety: 90,
      },
    },
  ];

  useEffect(() => {
    loadLeaderboard();
  }, [selectedPeriod]);

  const loadLeaderboard = () => {
    // In a real app, this would fetch from an API based on selectedPeriod
    setLeaderboard(mockLeaderboard);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    loadLeaderboard();
    setRefreshing(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy size={24} color="#FFD700" />;
      case 2:
        return <Medal size={24} color="#C0C0C0" />;
      case 3:
        return <Award size={24} color="#CD7F32" />;
      default:
        return (
          <View style={styles.rankNumber}>
            <Text style={styles.rankText}>{rank}</Text>
          </View>
        );
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'driver' ? '#3B82F6' : '#10B981';
  };

  const renderLeaderboardEntry = ({ item }: { item: LeaderboardEntry }) => (
    <View style={[styles.entryCard, item.rank <= 3 && styles.topThreeCard]}>
      <View style={styles.entryHeader}>
        <View style={styles.rankContainer}>
          {getRankIcon(item.rank)}
        </View>
        <View style={styles.entryInfo}>
          <Text style={styles.entryName}>{item.name}</Text>
          <View style={styles.roleContainer}>
            <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
              {item.role.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{item.score}</Text>
          <Text style={styles.scoreLabel}>points</Text>
        </View>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Users size={16} color="#6B7280" />
          <Text style={styles.metricValue}>{item.metrics.trips}</Text>
          <Text style={styles.metricLabel}>Trips</Text>
        </View>
        <View style={styles.metricItem}>
          <Star size={16} color="#F59E0B" />
          <Text style={styles.metricValue}>{item.metrics.rating}</Text>
          <Text style={styles.metricLabel}>Rating</Text>
        </View>
        <View style={styles.metricItem}>
          <TrendingUp size={16} color="#10B981" />
          <Text style={styles.metricValue}>{item.metrics.onTime}%</Text>
          <Text style={styles.metricLabel}>On Time</Text>
        </View>
        <View style={styles.metricItem}>
          <Award size={16} color="#DC2626" />
          <Text style={styles.metricValue}>{item.metrics.safety}%</Text>
          <Text style={styles.metricLabel}>Safety</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('leaderboard') || 'Leaderboard'}</Text>
      </View>

      <View style={styles.periodSelector}>
        {(['week', 'month', 'year'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.selectedPeriodButton,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.selectedPeriodButtonText,
              ]}
            >
              {t(period) || period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Trophy size={20} color="#FFD700" />
          <Text style={styles.summaryLabel}>Top Performer</Text>
          <Text style={styles.summaryValue}>
            {leaderboard[0]?.name || 'N/A'}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <TrendingUp size={20} color="#10B981" />
          <Text style={styles.summaryLabel}>Avg Score</Text>
          <Text style={styles.summaryValue}>
            {Math.round(
              leaderboard.reduce((sum, entry) => sum + entry.score, 0) /
                leaderboard.length || 0
            )}
          </Text>
        </View>
      </View>

      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.id}
        renderItem={renderLeaderboardEntry}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Trophy size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {t('no_leaderboard_data') || 'No leaderboard data available'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  selectedPeriodButton: {
    backgroundColor: '#DC2626',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedPeriodButtonText: {
    color: '#FFFFFF',
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  listContainer: {
    padding: 16,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topThreeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  roleContainer: {
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DC2626',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 12,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
});