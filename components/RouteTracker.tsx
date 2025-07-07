import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { RouteStop, StopStatus } from '@/types';

const { width } = Dimensions.get('window');

interface RouteTrackerProps {
  route: RouteStop[];
  currentLocation?: string;
}

export default function RouteTracker({ route, currentLocation }: RouteTrackerProps) {
  const getStopColor = (status: StopStatus) => {
    switch (status) {
      case 'pending': return '#D1D5DB';
      case 'reached': return '#3B82F6';
      case 'completed': return '#10B981';
      case 'overdue': return '#EF4444';
      default: return '#D1D5DB';
    }
  };

  const getStopIcon = (status: StopStatus) => {
    switch (status) {
      case 'pending': return '○';
      case 'reached': return '●';
      case 'completed': return '✓';
      case 'overdue': return '⚠';
      default: return '○';
    }
  };

  const getProgressPercentage = () => {
    const completedStops = route.filter(stop => stop.status === 'completed').length;
    return (completedStops / route.length) * 100;
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${getProgressPercentage()}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(getProgressPercentage())}% Complete
        </Text>
      </View>

      {/* Horizontal Route Line with Stops */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routeScrollContainer}>
        <View style={styles.routeContainer}>
          {route.map((stop, index) => (
            <View key={index} style={styles.stopContainer}>
              {/* Stop Dot */}
              <View style={[
                styles.stopDot,
                { backgroundColor: getStopColor(stop.status) }
              ]}>
                <Text style={styles.stopIcon}>{getStopIcon(stop.status)}</Text>
              </View>
              
              {/* Stop Label */}
              <Text style={[
                styles.stopLabel,
                { color: getStopColor(stop.status) }
              ]} numberOfLines={1}>
                {stop.name}
              </Text>
              
              {/* Connecting Line */}
              {index < route.length - 1 && (
                <View style={[
                  styles.connectingLine,
                  { 
                    backgroundColor: route[index + 1].status === 'pending' 
                      ? '#E5E7EB' 
                      : '#10B981' 
                  }
                ]} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#D1D5DB' }]} />
          <Text style={styles.legendText}>Pending</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>Reached</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Overdue</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  routeScrollContainer: {
    marginBottom: 12,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stopContainer: {
    alignItems: 'center',
    minWidth: 60,
    marginHorizontal: 3,
  },
  stopDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  stopIcon: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stopLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 50,
  },
  connectingLine: {
    width: 30,
    height: 1.5,
    marginHorizontal: 3,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#6B7280',
  },
}); 