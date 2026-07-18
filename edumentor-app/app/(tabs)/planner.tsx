import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Checkbox, TextInput, Button, IconButton } from 'react-native-paper';

type Task = {
  id: string | number;
  text: string;
  checked: boolean;
  priority: 'High' | 'Medium' | 'Low';
};

export default function PlannerScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('https://edumentor-backend-fbe9.onrender.com/api/planner_tasks');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const loaded: Task[] = data.map((item: any) => ({
            id: item.id,
            text: item.task_text,
            checked: item.completed == 1 || item.completed === true,
            priority: (item.priority?.charAt(0).toUpperCase() + item.priority?.slice(1)) || 'Medium'
          }));
          setTasks(loaded);
          return;
        }
      }
    } catch (err) {
      // Offline fallback
    }
    // Set seed list defaults
    setTasks([
      { id: 1, text: 'Read database normalization notes', checked: true, priority: 'High' },
      { id: 2, text: 'Review past midterm exams', checked: false, priority: 'Medium' },
      { id: 3, text: 'Consult EduMentor AI about TCP handshakes', checked: false, priority: 'Low' }
    ]);
  };

  const toggleCheck = async (id: string | number) => {
    const updated = tasks.map(t => t.id === id ? { ...t, checked: !t.checked } : t);
    setTasks(updated);

    const task = tasks.find(t => t.id === id);
    if (task) {
      try {
        await fetch(`https://edumentor-backend-fbe9.onrender.com/api/planner_tasks/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: !task.checked ? 1 : 0 })
        });
      } catch (err) {
        // Safe fail
      }
    }
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;

    const localId = Date.now();
    const newTask: Task = {
      id: localId,
      text: newTaskText.trim(),
      checked: false,
      priority: newTaskPriority
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTaskText('');

    try {
      await fetch('https://edumentor-backend-fbe9.onrender.com/api/planner_tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'student@kwekwe.ac.zw',
          task_text: newTask.text,
          priority: newTaskPriority.toLowerCase(),
          completed: 0
        })
      });
    } catch (err) {
      // Safe offline
    }
  };

  const handleDeleteTask = async (id: string | number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await fetch(`https://edumentor-backend-fbe9.onrender.com/api/planner_tasks/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      // Safe fail
    }
  };

  const handleClearCompleted = async () => {
    const completed = tasks.filter(t => t.checked);
    setTasks(prev => prev.filter(t => !t.checked));
    for (const t of completed) {
      try {
        await fetch(`https://edumentor-backend-fbe9.onrender.com/api/planner_tasks/${t.id}`, {
          method: 'DELETE'
        });
      } catch (e) {}
    }
  };

  const getPriorityColor = (prio: string) => {
    if (prio === 'High') return '#ef4444';
    if (prio === 'Medium') return '#f59e0b';
    return '#4f46e5';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
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

      {/* NEW ADD TASK FORM PANEL */}
      <Text style={styles.sectionHeader}>➕ Add New Task</Text>
      <Card style={styles.addCard}>
        <Card.Content>
          <TextInput
            placeholder="Type task description..."
            value={newTaskText}
            onChangeText={setNewTaskText}
            mode="flat"
            style={styles.taskInput}
            textColor="#fff"
            placeholderTextColor="#94a3b8"
            activeUnderlineColor="#4f46e5"
          />

          <View style={styles.prioritySelectorRow}>
            <Text style={styles.priorityLabel}>Priority:</Text>
            <View style={styles.priorityButtons}>
              <Button
                mode={newTaskPriority === 'High' ? 'contained' : 'outlined'}
                onPress={() => setNewTaskPriority('High')}
                style={styles.prioButton}
                labelStyle={{ fontSize: 9 }}
                textColor={newTaskPriority === 'High' ? '#fff' : '#ef4444'}
                buttonColor={newTaskPriority === 'High' ? '#ef4444' : 'transparent'}
              >
                High
              </Button>
              <Button
                mode={newTaskPriority === 'Medium' ? 'contained' : 'outlined'}
                onPress={() => setNewTaskPriority('Medium')}
                style={styles.prioButton}
                labelStyle={{ fontSize: 9 }}
                textColor={newTaskPriority === 'Medium' ? '#fff' : '#f59e0b'}
                buttonColor={newTaskPriority === 'Medium' ? '#f59e0b' : 'transparent'}
              >
                Medium
              </Button>
              <Button
                mode={newTaskPriority === 'Low' ? 'contained' : 'outlined'}
                onPress={() => setNewTaskPriority('Low')}
                style={styles.prioButton}
                labelStyle={{ fontSize: 9 }}
                textColor={newTaskPriority === 'Low' ? '#fff' : '#4f46e5'}
                buttonColor={newTaskPriority === 'Low' ? '#4f46e5' : 'transparent'}
              >
                Low
              </Button>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleAddTask}
            style={styles.addTaskBtn}
            buttonColor="#4f46e5"
          >
            Add Task
          </Button>
        </Card.Content>
      </Card>

      {/* TASKS CHECKLIST SECTION */}
      <View style={styles.checklistHeaderRow}>
        <Text style={styles.sectionHeader}>Daily Learning Goals</Text>
        <Button mode="text" onPress={handleClearCompleted} textColor="#ef4444" labelStyle={{ fontSize: 10 }}>
          Clear Completed
        </Button>
      </View>

      <Card style={styles.card}>
        <Card.Content style={{ paddingVertical: 8 }}>
          {tasks.length === 0 ? (
            <Text style={styles.emptyText}>No goals set for today. Add one above!</Text>
          ) : (
            tasks.map(t => (
              <View key={t.id} style={styles.taskRow}>
                <Checkbox
                  status={t.checked ? 'checked' : 'unchecked'}
                  onPress={() => toggleCheck(t.id)}
                  color="#4f46e5"
                />
                <Text style={[styles.taskText, t.checked && styles.completed]}>
                  {t.text}
                </Text>
                <View style={[styles.prioTag, { backgroundColor: getPriorityColor(t.priority) + '20' }]}>
                  <Text style={[styles.prioTagText, { color: getPriorityColor(t.priority) }]}>
                    {t.priority}
                  </Text>
                </View>
                <IconButton
                  icon="trash-can-outline"
                  iconColor="#94a3b8"
                  size={16}
                  onPress={() => handleDeleteTask(t.id)}
                  style={{ margin: 0, padding: 0 }}
                />
              </View>
            ))
          )}
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
    marginBottom: 16
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
    marginBottom: 10,
    marginTop: 5
  },
  addCard: {
    backgroundColor: '#1e293b',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 20
  },
  taskInput: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    height: 40,
    marginBottom: 12,
    fontSize: 12
  },
  prioritySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  priorityLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 10
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 4,
    flex: 1
  },
  prioButton: {
    flex: 1,
    borderRadius: 6,
    height: 32,
    justifyContent: 'center',
    padding: 0
  },
  addTaskBtn: {
    borderRadius: 8
  },
  checklistHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
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
    marginVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.02)',
    paddingBottom: 4
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
  },
  prioTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4
  },
  prioTagText: {
    fontSize: 8,
    fontWeight: '800'
  },
  emptyText: {
    color: '#cbd5e1',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 16
  }
});
