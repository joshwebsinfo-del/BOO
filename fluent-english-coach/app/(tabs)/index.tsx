import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

export default function HomeDashboard() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.greetingContainer}>
        <Text style={styles.greeting}>Good Morning ☀️</Text>
        <Text style={styles.subtitle}>Let's improve your English today.</Text>
      </View>

      {/* Daily Stats Panel */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Progress</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>15m</Text>
            <Text style={styles.statLabel}>Speaking</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>5 🔥</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>240</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
        </View>
      </View>

      {/* Challenge Section */}
      <TouchableOpacity style={[styles.card, styles.challengeCard]}>
        <Text style={styles.challengeLabel}>DAILY CHALLENGE</Text>
        <Text style={styles.challengeText}>"Speak about your favorite book or movie for 1 minute."</Text>
        <Text style={styles.challengeReward}>+50 XP</Text>
      </TouchableOpacity>

      {/* Daily Motivation */}
      <View style={styles.quoteCard}>
        <Text style={styles.quoteText}>"Fluency is not about speaking fast; it's about speaking with clear confidence."</Text>
        <Text style={styles.quoteAuthor}>— Fluent English Coach</Text>
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
  greetingContainer: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  challengeCard: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  challengeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 1,
    marginBottom: 8,
  },
  challengeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E1B4B',
    lineHeight: 22,
    marginBottom: 8,
  },
  challengeReward: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2563EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  quoteCard: {
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    marginTop: 8,
  },
  quoteText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#B45309',
    lineHeight: 20,
  },
  quoteAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
    marginTop: 8,
    textAlign: 'right',
  },
});
