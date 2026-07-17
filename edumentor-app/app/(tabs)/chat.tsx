import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';

export default function ChatScreen() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'student' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'I am your EduMentor AI Academic Tutor. Ask me any course queries based on your curriculum.' }
  ]);

  const handleSend = () => {
    if (!query.trim()) return;
    const studentQuery = query.trim();
    setMessages(prev => [...prev, { sender: 'student', text: studentQuery }]);
    setQuery('');

    // Simulate RAG pipeline output
    setTimeout(() => {
      let aiAns = 'This topic is not available in your current course materials. Please upload relevant notes or consult your lecturer.';
      if (studentQuery.toLowerCase().includes('normal') || studentQuery.toLowerCase().includes('database')) {
        aiAns = 'Database Normalization minimizes redundancy. 1NF forces atomic values, 2NF resolves partial dependency, and 3NF eliminates transitive dependencies.';
      } else if (studentQuery.toLowerCase().includes('tcp') || studentQuery.toLowerCase().includes('udp')) {
        aiAns = 'TCP is connection-oriented (handshake mechanism, ordering), while UDP is connectionless (unreliable but faster, low overhead).';
      }
      setMessages(prev => [...prev, { sender: 'ai', text: aiAns }]);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>EduMentor AI Tutor</Text>
        <Text style={styles.status}>Gemini AI (RAG active)</Text>
      </View>

      <ScrollView style={styles.messageList}>
        {messages.map((m, idx) => (
          <Card
            key={idx}
            style={[
              styles.bubble,
              m.sender === 'student' ? styles.studentBubble : styles.aiBubble
            ]}
          >
            <Card.Content>
              <Text style={styles.msgText}>{m.text}</Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          placeholder="Ask database normalization, TCP, etc."
          value={query}
          onChangeText={setQuery}
          style={styles.input}
          mode="flat"
          activeUnderlineColor="#4f46e5"
        />
        <Button mode="contained" onPress={handleSend} style={styles.sendBtn}>➔</Button>
      </View>
    </View>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 10,
    marginBottom: 10
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  status: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2
  },
  messageList: {
    flex: 1
  },
  bubble: {
    maxWidth: '85%',
    marginBottom: 10,
    borderRadius: 12
  },
  studentBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#4f46e5'
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1
  },
  msgText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  input: {
    flex: 1,
    height: 46,
    backgroundColor: '#1e293b',
    borderRadius: 8
  },
  sendBtn: {
    backgroundColor: '#4f46e5',
    minWidth: 50,
    height: 46,
    justifyContent: 'center'
  }
});
