import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { getStatistics, updateDailyStats } from '../../services/db';

export default function HomeDashboard() {
  const [streak, setStreak] = useState(5);
  const [xp, setXp] = useState(480);
  const [speakingTime, setSpeakingTime] = useState(15);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const stats = await getStatistics();
      if (stats && stats.length > 0) {
        let totalXp = 480;
        let totalSpeak = 15;
        stats.forEach((row: any) => {
          totalXp += (row.xp_earned || 0);
          totalSpeak += (row.speaking_time || 0);
        });
        setXp(totalXp);
        setSpeakingTime(totalSpeak);
      }
    } catch (err) {
      console.warn('Could not load sqlite stats, using default values:', err);
    }
  };

  const completeChallenge = async () => {
    try {
      await updateDailyStats(5, 0, 0, 0, 50);
      alert('Congratulations! You completed the Daily Speaking Challenge and earned +50 XP!');
      loadStats();
    } catch (err) {
      console.error(err);
    }
  };

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
            <Text style={styles.statValue}>{speakingTime}m</Text>
            <Text style={styles.statLabel}>Speaking</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{streak} 🔥</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{xp}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
        </View>
      </View>

      {/* Challenge Section */}
      <TouchableOpacity style={[styles.card, styles.challengeCard]} onPress={completeChallenge}>
        <Text style={styles.challengeLabel}>DAILY CHALLENGE</Text>
        <Text style={styles.challengeText}>"Speak about your career objectives for 1 minute."</Text>
        <Text style={styles.challengeReward}>Tap to Complete Challenge (+50 XP)</Text>
      </TouchableOpacity>

      {/* Daily Motivation */}
      <View style={styles.quoteCard}>
        <Text style={styles.quoteText}>"Fluency is not about speaking fast; it's about speaking with clear confidence."</Text>
        <Text style={styles.quoteAuthor}>— Your Pocket Coach</Text>
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
