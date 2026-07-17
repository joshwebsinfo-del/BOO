import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, ProgressBar, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greet}>Hello, Learner 👋</Text>
          <Text style={styles.role}>Student Profile</Text>
        </View>
        <View style={styles.streak}>
          <Text style={styles.streakText}>🔥 5 Days</Text>
        </View>
      </View>

      <Card style={[styles.card, styles.hero]}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.heroTitle}>Ask your Academic Assistant</Text>
          <Text style={styles.heroDesc}>Gemini-powered syllabus and notes semantic lookup</Text>
          <Button
            mode="contained"
            style={styles.chatBtn}
            onPress={() => router.push('/(tabs)/chat')}
          >
            Launch AI Chat Tutor
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.sectionTitle}>
        <Text style={styles.sectionText}>My Active Courses</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.courseCode}>CS301</Text>
          <Text style={styles.courseTitle}>Database Systems</Text>
          <ProgressBar progress={0.75} color="#4f46e5" style={styles.progress} />
          <Text style={styles.percent}>75% Completed</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.courseCode}>CS302</Text>
          <Text style={styles.courseTitle}>Computer Networks</Text>
          <ProgressBar progress={0.45} color="#10b981" style={styles.progress} />
          <Text style={styles.percent}>45% Completed</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
    padding: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20
  },
  greet: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f1f5f9'
  },
  role: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2
  },
  streak: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  streakText: {
    color: '#f59e0b',
    fontWeight: '700',
    fontSize: 12
  },
  card: {
    backgroundColor: '#1e293b',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 12
  },
  hero: {
    backgroundColor: '#312e81'
  },
  heroTitle: {
    color: '#ffffff',
    fontWeight: 'bold'
  },
  heroDesc: {
    color: '#c7d2fe',
    fontSize: 12,
    marginVertical: 10
  },
  chatBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    marginTop: 5
  },
  sectionTitle: {
    marginVertical: 10
  },
  sectionText: {
    color: '#cbd5e1',
    fontWeight: 'bold',
    fontSize: 16
  },
  courseCode: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '700'
  },
  courseTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginVertical: 4
  },
  progress: {
    height: 6,
    borderRadius: 3,
    marginTop: 8
  },
  percent: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 6
  }
});
