import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface DebugBadgeProps {
  apiCount: number;
  filteredCount: number;
  mountedCount: number;
  error?: string | null;
  catCounts?: Record<string, number>;
}

/**
 * Temporary on-device debug overlay.
 * Shows live pipeline counts so we can diagnose missing pins on Release builds
 * where console.log is invisible. Remove after diagnosis.
 */
export const DebugBadge: React.FC<DebugBadgeProps> = ({
  apiCount,
  filteredCount,
  mountedCount,
  error,
  catCounts,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.container, expanded && styles.containerExpanded]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <Text style={styles.text}>
        API:{apiCount} | Filt:{filteredCount} | Mt:{mountedCount}
      </Text>
      {expanded && error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
      {expanded && !error ? (
        <Text style={styles.okText}>No errors</Text>
      ) : null}
      {expanded && catCounts ? (
        <ScrollView style={styles.catScroll}>
          {Object.entries(catCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => (
              <Text key={cat} style={styles.catText}>
                {cat}: {count}
              </Text>
            ))}
        </ScrollView>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 170,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 999,
    maxWidth: 280,
  },
  containerExpanded: {
    maxHeight: 300,
  },
  text: {
    color: '#0f0',
    fontSize: 11,
    fontFamily: 'Courier',
    fontWeight: '700',
  },
  errorText: {
    color: '#f44',
    fontSize: 10,
    fontFamily: 'Courier',
    marginTop: 4,
  },
  okText: {
    color: '#0f0',
    fontSize: 10,
    fontFamily: 'Courier',
    marginTop: 4,
  },
  catScroll: {
    marginTop: 4,
    maxHeight: 200,
  },
  catText: {
    color: '#0ff',
    fontSize: 9,
    fontFamily: 'Courier',
  },
});
