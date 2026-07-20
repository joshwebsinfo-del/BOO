import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

export default function ProgressScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Your Statistics</Text>
      <Text style={styles.pageSubtitle}>Track your offline fluency milestones and streak.</Text>

      {/* Fluency Level badge */}
      <View style={styles.levelCard}>
        <Text style={styles.levelLabel}>CURRENT LEVEL</Text>
        <Text style={styles.levelName}>Upper Intermediate 🚀</Text>
        <Text style={styles.levelNext}>Next: Confident Speaker (+150 XP)</Text>
      </View>

      {/* Statistics Table */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detailed Activity</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Lessons Completed</Text>
          <Text style={styles.statValue}>12</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Words Mastered</Text>
          <Text style={styles.statValue}>154</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Grammar Accuracy</Text>
          <Text style={styles.statValue}>88%</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Speaking Hours</Text>
          <Text style={styles.statValue}>2.4 hrs</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 20,
  },
  levelCard: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  levelName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  levelNext: {
    fontSize: 12,
    color: '#E0F2FE',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
});
