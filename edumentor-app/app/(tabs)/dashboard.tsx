import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { Text, Card, ProgressBar, Button, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';

interface VideoTutorial {
  id: string | number;
  title: string;
  module_name: string;
  topic_name: string;
  video_url: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [tutorials, setTutorials] = useState<VideoTutorial[]>([]);

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    try {
      // Connect to local server IP or fallback list
      const res = await fetch('http://10.0.2.2:3000/api/video_tutorials');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setTutorials(data);
          return;
        }
      }
    } catch (err) {
      // Fallback fallback lists if server is unreachable
    }
    // Hardcode polished default fallback tutorials
    setTutorials([
      {
        id: 1,
        title: 'Database Systems Crash Course',
        module_name: 'Module 1: Relational Algebra',
        topic_name: '1.2 Schema Design & Normalization Rules',
        video_url: 'https://www.youtube.com/watch?v=KwekwePolyCS301'
      },
      {
        id: 2,
        title: 'SQL JOINs and Subqueries Demystified',
        module_name: 'Module 3: Advanced SQL',
        topic_name: 'Relational JOIN types',
        video_url: 'https://www.youtube.com/watch?v=CS301JOINs'
      }
    ]);
  };

  const watchVideo = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <ScrollView style={styles.container}>
      {/* Premium IT Student Welcome Panel */}
      <View style={styles.itGreeting}>
        <Text style={styles.itGreetTitle}>Welcome back, Student! 👋</Text>
        <Text style={styles.itGreetSub}>Kwekwe Poly Information Technology • Division of CS & IS</Text>
        <View style={styles.focusPill}>
          <Text style={styles.focusPillText}>💻 Focus Area: Database Systems & Software Engineering</Text>
        </View>
      </View>

      <View style={styles.header}>
        <View>
          <Text style={styles.greet}>EduMentor Hub</Text>
          <Text style={styles.role}>Kwekwe Poly AI Academic Assistant</Text>
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

      {/* DYNAMIC VIDEO TUTORIALS FEED */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionText}>🎥 Video Tutorials Hub</Text>
        <Text style={styles.adminBadge}>Admin Verified</Text>
      </View>

      {tutorials.map((t) => (
        <Card key={t.id} style={styles.tutorialCard}>
          <Card.Content style={styles.tutorialContent}>
            <View style={styles.playIconContainer}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
            <View style={styles.tutorialDetails}>
              <Text style={styles.moduleTag}>{t.module_name}</Text>
              <Text style={styles.tutorialTitle}>{t.title}</Text>
              <Text style={styles.topicLabel}>Topic: {t.topic_name}</Text>
            </View>
            <Button
              mode="contained"
              compact
              style={styles.watchBtn}
              labelStyle={styles.watchBtnLabel}
              onPress={() => watchVideo(t.video_url)}
            >
              Watch
            </Button>
          </Card.Content>
        </Card>
      ))}

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
    padding: 16
  },
  itGreeting: {
    marginTop: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10
  },
  itGreetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'System'
  },
  itGreetSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4
  },
  focusPill: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: 'rgba(168, 85, 247, 0.3)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
    alignSelf: 'flex-start'
  },
  focusPillText: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '700'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14
  },
  greet: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9'
  },
  role: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2
  },
  streak: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },
  streakText: {
    color: '#f59e0b',
    fontWeight: '700',
    fontSize: 11
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
    fontSize: 11,
    marginVertical: 10
  },
  chatBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    marginTop: 5
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12
  },
  sectionTitle: {
    marginVertical: 12
  },
  sectionText: {
    color: '#cbd5e1',
    fontWeight: 'bold',
    fontSize: 15
  },
  adminBadge: {
    fontSize: 10,
    color: '#818cf8',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '700'
  },
  tutorialCard: {
    backgroundColor: '#111b2e',
    borderColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8
  },
  tutorialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  playIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  playIcon: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold'
  },
  tutorialDetails: {
    flex: 1
  },
  moduleTag: {
    fontSize: 9,
    color: '#818cf8',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  tutorialTitle: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '800',
    marginVertical: 2
  },
  topicLabel: {
    fontSize: 10,
    color: '#94a3b8'
  },
  watchBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 8
  },
  watchBtnLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginHorizontal: 8
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
