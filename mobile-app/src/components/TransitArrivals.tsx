import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, AppState } from 'react-native';
import { Text, useTheme, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import { TransitArrival, TransitStopInfo } from '../types/utility';
import { apiService } from '../services/apiService';

interface TransitArrivalsProps {
  utilityId: string;
}

const REFRESH_INTERVAL_MS = 30_000;

const TransitArrivalsComponent: React.FC<TransitArrivalsProps> = ({ utilityId }) => {
  const theme = useTheme();
  const [arrivals, setArrivals] = useState<TransitArrival[]>([]);
  const [stopInfo, setStopInfo] = useState<TransitStopInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const fetchArrivals = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const data = await apiService.getTransitArrivals(utilityId);
      setArrivals(data);
    } catch {
      setError('Could not load arrival times');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [utilityId]);

  const fetchStopInfo = useCallback(async () => {
    try {
      const data = await apiService.getTransitStopInfo(utilityId);
      setStopInfo(data);
    } catch {
      // Non-critical — we still show arrivals
    }
  }, [utilityId]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchArrivals(), fetchStopInfo()]);
      setLoading(false);
    };
    load();
  }, [fetchArrivals, fetchStopInfo]);

  // Auto-refresh every 30s (pauses when app backgrounded)
  useEffect(() => {
    const startInterval = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => fetchArrivals(false), REFRESH_INTERVAL_MS);
    };

    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        fetchArrivals(false);
        startInterval();
      } else if (nextState.match(/inactive|background/)) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      appStateRef.current = nextState;
    });

    startInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, [fetchArrivals]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on time': return '#2ED573';
      case 'early': return '#06B6D4';
      case 'delayed': return '#F59E0B';
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const formatTime = (epochMs: number) => {
    const d = new Date(epochMs);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="titleSmall" style={{ color: theme.colors.primary, fontWeight: '700' }}>
            Live Arrivals
          </Text>
        </View>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.skeletonRow, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View style={[styles.skeletonBadge, { backgroundColor: theme.colors.outline }]} />
            <View style={{ flex: 1, gap: 4 }}>
              <View style={[styles.skeletonLine, { width: '60%', backgroundColor: theme.colors.outline }]} />
              <View style={[styles.skeletonLine, { width: '40%', backgroundColor: theme.colors.outline }]} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="titleSmall" style={{ color: theme.colors.primary, fontWeight: '700' }}>
          Live Arrivals
        </Text>
        {arrivals.some((a) => a.isRealTime) && (
          <View style={styles.liveIndicator}>
            <View style={[styles.liveDot, { backgroundColor: '#2ED573' }]} />
            <Text variant="labelSmall" style={{ color: '#2ED573' }}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Route chips from stop info */}
      {stopInfo && stopInfo.routes.length > 0 && (
        <View style={styles.routeChips}>
          {stopInfo.routes.slice(0, 8).map((route) => (
            <Chip
              key={route.shortName}
              compact
              mode="outlined"
              style={[styles.routeChip, { borderColor: theme.colors.primary }]}
              textStyle={{ fontSize: 13, color: theme.colors.primary, fontWeight: '600' }}
            >
              {route.shortName}
            </Chip>
          ))}
        </View>
      )}

      <Divider style={{ marginVertical: 8 }} />

      {/* Arrivals list */}
      {arrivals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            No upcoming arrivals in the next hour
          </Text>
        </View>
      ) : (
        arrivals.slice(0, 6).map((arrival, idx) => (
          <View key={`${arrival.routeShortName}-${arrival.scheduledArrival}-${idx}`}>
            <View style={styles.arrivalRow}>
              {/* Route badge */}
              <View style={[styles.routeBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.routeBadgeText}>
                  {arrival.routeShortName.length > 4
                    ? arrival.routeShortName.substring(0, 4)
                    : arrival.routeShortName}
                </Text>
              </View>

              {/* Headsign + status */}
              <View style={styles.arrivalInfo}>
                <Text
                  variant="bodyMedium"
                  numberOfLines={1}
                  style={{ color: theme.colors.onSurface, fontWeight: '600' }}
                >
                  {arrival.tripHeadsign || 'Unknown'}
                </Text>
                <View style={styles.statusRow}>
                  {arrival.isRealTime && (
                    <View style={[styles.realTimeDot, { backgroundColor: '#2ED573' }]} />
                  )}
                  <Text
                    variant="labelSmall"
                    style={{ color: getStatusColor(arrival.status) }}
                  >
                    {arrival.status.charAt(0).toUpperCase() + arrival.status.slice(1)}
                  </Text>
                </View>
              </View>

              {/* Time */}
              <View style={styles.arrivalTime}>
                {arrival.minutesUntil <= 1 ? (
                  <Text style={[styles.minutesText, { color: '#FF6B6B' }]}>NOW</Text>
                ) : arrival.minutesUntil <= 30 ? (
                  <>
                    <Text style={[styles.minutesText, { color: theme.colors.primary }]}>
                      {arrival.minutesUntil}
                    </Text>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      min
                    </Text>
                  </>
                ) : (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {formatTime(arrival.scheduledArrival)}
                  </Text>
                )}
              </View>
            </View>
            {idx < Math.min(arrivals.length, 6) - 1 && (
              <Divider style={{ marginLeft: 52, opacity: 0.4 }} />
            )}
          </View>
        ))
      )}

      {error && (
        <Text variant="bodySmall" style={{ color: theme.colors.error, textAlign: 'center', marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  routeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  routeChip: {
    height: 32,
    justifyContent: 'center',
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  arrivalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  routeBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  arrivalInfo: {
    flex: 1,
    gap: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  realTimeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  arrivalTime: {
    alignItems: 'center',
    minWidth: 44,
  },
  minutesText: {
    fontSize: 20,
    fontWeight: '800',
  },
  // Loading skeleton
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 6,
    gap: 12,
    opacity: 0.4,
  },
  skeletonBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 4,
  },
});

export const TransitArrivals = React.memo(TransitArrivalsComponent);
