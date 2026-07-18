import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function EntryScreen() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      icon: '🤖',
      title: 'Intelligent AI Tutor',
      desc: 'Syllabus-aligned solutions sourced from official institutional documents.'
    },
    {
      icon: '📚',
      title: 'Academic RAG Engine',
      desc: 'Retrieves direct lecture slide contexts, assignments and past exam papers.'
    },
    {
      icon: '📅',
      title: 'Personal Study Planner',
      desc: 'Set custom targets, plan exam milestones, and build consistent habits.'
    }
  ];

  const handleNext = () => {
    if (slide < slides.length - 1) {
      setSlide(slide + 1);
    } else {
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🎓 EduMentor</Text>

      <Card style={styles.card}>
        <Card.Content style={styles.center}>
          <Text style={styles.illustration}>{slides[slide].icon}</Text>
          <Text variant="titleLarge" style={styles.title}>{slides[slide].title}</Text>
          <Text variant="bodyMedium" style={styles.desc}>{slides[slide].desc}</Text>
        </Card.Content>
      </Card>

      <View style={styles.row}>
        <Button mode="text" onPress={() => router.replace('/(auth)/login')}>Skip</Button>
        <Button mode="contained" onPress={handleNext}>Next</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    backgroundColor: '#0a0e1a'
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    color: '#818cf8'
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    padding: 20
  },
  center: {
    alignItems: 'center',
    textAlign: 'center'
  },
  illustration: {
    fontSize: 64,
    marginBottom: 20
  },
  title: {
    fontWeight: '800',
    color: '#f1f5f9',
    marginBottom: 10,
    textAlign: 'center'
  },
  desc: {
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  }
});
