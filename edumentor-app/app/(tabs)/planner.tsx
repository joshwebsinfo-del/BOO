import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Checkbox } from 'react-native-paper';

export default function PlannerScreen() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Read database normalization notes', checked: true },
    { id: 2, text: 'Review past midterm exams', checked: false },
    { id: 3, text: 'Consult EduMentor AI about TCP handshakes', checked: false }
  ]);

  const toggleCheck = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, checked: !t.checked } : t));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Study Planner</Text>
        <Text style={styles.subtitle}>Daily milestones & countdown goals</Text>
      </View>

      <Card style={styles.cardHighlight}>
        <Card.Content>
          <Text style={styles.tag}>🚨 UPCOMING EXAM</Text>
          <Text style={styles.examTitle}>Database Normalization Quiz</Text>
          <Text style={styles.countdown}>Term deadline: 4 days remaining</Text>
        </Card.Content>
      </Card>

      <Text style={styles.sectionHeader}>Daily Learning Goals</Text>

      <Card style={styles.card}>
        <Card.Content>
          {tasks.map(t => (
            <View key={t.id} style={styles.taskRow}>
              <Checkbox
                status={t.checked ? 'checked' : 'unchecked'}
                onPress={() => toggleCheck(t.id)}
                color="#4f46e5"
              />
              <Text style={[styles.taskText, t.checked && styles.completed]}>{t.text}</Text>
            </View>
          ))}
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
    marginTop: 40,
    marginBottom: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2
  },
  cardHighlight: {
    backgroundColor: '#312e81',
    borderRadius: 14,
    marginBottom: 20,
    borderColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1
  },
  tag: {
    backgroundColor: '#f59e0b',
    color: '#1e1b4b',
    fontSize: 9,
    fontWeight: '800',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8
  },
  examTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  },
  countdown: {
    color: '#c7d2fe',
    fontSize: 12,
    marginTop: 4
  },
  sectionHeader: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 10
  },
  card: {
    backgroundColor: '#1e293b',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 14
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5
  },
  taskText: {
    color: '#ffffff',
    fontSize: 13,
    marginLeft: 8,
    flex: 1
  },
  completed: {
    textDecorationLine: 'line-through',
    color: '#94a3b8'
  }
});
