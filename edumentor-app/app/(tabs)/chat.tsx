import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { askAI } from '../../services/aiService';

type Message = {
  sender: 'student' | 'ai';
  text: string;
  timestamp: string;
  model?: string;
};

export default function ChatScreen() {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'study' | 'revision'>('chat');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'I am your EduMentor AI Academic Tutor at Kwekwe Poly. Sourced directly from Gemini 2.0 with Groq Llama and OpenRouter fallback networks.',
      timestamp: '10:42 AM',
      model: 'gemini-2.0-flash'
    }
  ]);

  // Study Assistant states
  const [subject, setSubject] = useState('Database Systems');
  const [context, setContext] = useState('');

  // Revision Helper states
  const [quizQuestion, setRevisionQuestion] = useState('What normal form eliminates transitive functional dependencies?');
  const [userAnswer, setRevisionAnswer] = useState('');
  const [revisionFeedback, setRevisionFeedback] = useState('');

  const getFormattedTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = async (customMessage?: string) => {
    const textToSend = customMessage || query;
    if (!textToSend.trim()) return;

    const studentMsg: Message = {
      sender: 'student',
      text: textToSend.trim(),
      timestamp: getFormattedTime()
    };

    setMessages(prev => [...prev, studentMsg]);
    if (!customMessage) setQuery('');
    setLoading(true);

    try {
      const response = await askAI(textToSend.trim(), subject, context);
      const aiMsg: Message = {
        sender: 'ai',
        text: response.answer,
        timestamp: getFormattedTime(),
        model: response.model
      };
      setMessages(prev => [...prev, aiMsg]);

      // POST to persist log dynamically
      try {
        fetch('http://10.0.2.2:3000/api/save_chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: 'student@kwekwe.ac.zw',
            question: textToSend.trim(),
            answer: response.answer,
            subject: subject,
            model: response.model
          })
        });
      } catch (err) {}

    } catch (err: any) {
      const errorMsg: Message = {
        sender: 'ai',
        text: `Sorry, unable to reach the AI. Error details: ${err.message}`,
        timestamp: getFormattedTime()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    alert('Academic answer copied to clipboard!');
  };

  const triggerStudyAction = async (type: 'explain' | 'summarize' | 'quiz') => {
    let actionQuery = '';
    if (type === 'explain') {
      actionQuery = `Explain database normalization and relational keys step-by-step with clear real-world examples.`;
    } else if (type === 'summarize') {
      actionQuery = `Summarize the differences between connection-oriented TCP and connectionless UDP protocols.`;
    } else if (type === 'quiz') {
      actionQuery = `Generate a 3-question evaluation quiz about Relational Schemas and 3NF.`;
    }
    setActiveSubTab('chat');
    await handleSend(actionQuery);
  };

  const checkRevisionAnswer = () => {
    if (!userAnswer.trim()) return;
    if (userAnswer.toLowerCase().includes('third') || userAnswer.toLowerCase().includes('3nf')) {
      setRevisionFeedback('✅ Correct! Third Normal Form (3NF) eliminates transitive functional dependencies (X ➔ Y and Y ➔ Z). Excellent academic understanding!');
    } else {
      setRevisionFeedback('❌ Incorrect. Third Normal Form (3NF) is the correct answer. Please consult the EduMentor Tutor AI for a detailed explanation of dependencies.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>EduMentor Assistant</Text>
        <Text style={styles.status}>● Kwekwe Poly AI • Secure Fallback Mode</Text>
      </View>

      {/* Sub-tab segment switcher */}
      <View style={styles.tabsRow}>
        <Button
          mode={activeSubTab === 'chat' ? 'contained' : 'outlined'}
          onPress={() => setActiveSubTab('chat')}
          style={styles.tabBtn}
          labelStyle={styles.tabBtnLabel}
        >
          Tutor Chat
        </Button>
        <Button
          mode={activeSubTab === 'study' ? 'contained' : 'outlined'}
          onPress={() => setActiveSubTab('study')}
          style={styles.tabBtn}
          labelStyle={styles.tabBtnLabel}
        >
          Study Hub
        </Button>
        <Button
          mode={activeSubTab === 'revision' ? 'contained' : 'outlined'}
          onPress={() => setActiveSubTab('revision')}
          style={styles.tabBtn}
          labelStyle={styles.tabBtnLabel}
        >
          Revision
        </Button>
      </View>

      {/* 1. TUTOR CHAT SUBVIEW */}
      {activeSubTab === 'chat' && (
        <View style={styles.subView}>
          <ScrollView style={styles.messageList} contentContainerStyle={{ paddingBottom: 10 }}>
            {messages.map((m, idx) => (
              <View key={idx} style={m.sender === 'student' ? styles.studentRow : styles.aiRow}>
                <Card style={[styles.bubble, m.sender === 'student' ? styles.studentBubble : styles.aiBubble]}>
                  <Card.Content style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
                    <Text style={styles.msgText}>{m.text}</Text>
                    {m.model && <Text style={styles.modelTag}>Sourced: {m.model}</Text>}
                    <Text style={styles.timeTag}>{m.timestamp}</Text>
                  </Card.Content>
                </Card>
                {m.sender === 'ai' && (
                  <Button mode="text" onPress={() => handleCopy(m.text)} style={styles.copyBtn} labelStyle={{ fontSize: 9 }}>
                    Copy
                  </Button>
                )}
              </View>
            ))}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator animating={true} color="#4f46e5" size="small" />
                <Text style={styles.loadingText}>RAG context matching in progress...</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              placeholder="Ask academic helper..."
              value={query}
              onChangeText={setQuery}
              style={styles.input}
              mode="flat"
              activeUnderlineColor="#4f46e5"
              textColor="#ffffff"
              placeholderTextColor="#94a3b8"
            />
            <Button mode="contained" onPress={() => handleSend()} style={styles.sendBtn} disabled={loading}>
              ➔
            </Button>
          </View>
        </View>
      )}

      {/* 2. STUDY ASSISTANT SUBVIEW (Refined Subject Config Form) */}
      {activeSubTab === 'study' && (
        <ScrollView style={styles.subView} contentContainerStyle={{ paddingBottom: 20 }}>
          <Card style={styles.refinedConfigCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.configTitle}>⚙️ Subject Configuration</Text>
              <Text style={styles.configSub}>Customize your AI mentor context boundaries below.</Text>

              <TextInput
                label="Target Course/Subject"
                value={subject}
                onChangeText={setSubject}
                mode="outlined"
                style={styles.configInput}
                textColor="#fff"
                activeOutlineColor="#4f46e5"
                outlineColor="rgba(255,255,255,0.15)"
              />
              <TextInput
                label="Custom Lecture / PDF Notes Context"
                value={context}
                onChangeText={setContext}
                mode="outlined"
                multiline
                numberOfLines={4}
                placeholder="Paste your lecture notes here to guide your personal mentor's responses..."
                placeholderTextColor="#64748b"
                style={styles.configInputMulti}
                textColor="#fff"
                activeOutlineColor="#4f46e5"
                outlineColor="rgba(255,255,255,0.15)"
              />
            </Card.Content>
          </Card>

          <View style={styles.studyActions}>
            <Card style={styles.actionCard} onPress={() => triggerStudyAction('explain')}>
              <Card.Content style={styles.actionRow}>
                <Text style={styles.actionIcon}>💡</Text>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Explain Topics</Text>
                  <Text style={styles.actionDesc}>Get clean, detailed step-by-step breakdowns of normal forms.</Text>
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.actionCard} onPress={() => triggerStudyAction('summarize')}>
              <Card.Content style={styles.actionRow}>
                <Text style={styles.actionIcon}>📄</Text>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Summarize Lecture Notes</Text>
                  <Text style={styles.actionDesc}>Extract differences between complex transport protocols.</Text>
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.actionCard} onPress={() => triggerStudyAction('quiz')}>
              <Card.Content style={styles.actionRow}>
                <Text style={styles.actionIcon}>📝</Text>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Generate Evaluation Quizzes</Text>
                  <Text style={styles.actionDesc}>Evaluate schema knowledge with a generated AI test.</Text>
                </View>
              </Card.Content>
            </Card>
          </View>
        </ScrollView>
      )}

      {/* 3. REVISION HELPER SUBVIEW */}
      {activeSubTab === 'revision' && (
        <ScrollView style={styles.subView}>
          <Card style={styles.revisionCard}>
            <Card.Content>
              <Text style={styles.revisionLabel}>📚 REVISION CHALLENGE</Text>
              <Text variant="titleMedium" style={styles.revisionTitle}>{quizQuestion}</Text>

              <TextInput
                placeholder="Type your academic answer here..."
                value={userAnswer}
                onChangeText={setRevisionAnswer}
                mode="outlined"
                style={styles.revisionInput}
                textColor="#fff"
              />

              <Button mode="contained" onPress={checkRevisionAnswer} style={styles.checkBtn}>
                Submit For AI Evaluation
              </Button>

              {revisionFeedback !== '' && (
                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackText}>{revisionFeedback}</Text>
                </View>
              )}
            </Card.Content>
          </Card>

          <View style={styles.historySection}>
            <Text style={styles.historyHeader}>Previous Conversations Tracker</Text>
            <Card style={styles.historyCard}>
              <Card.Content>
                <Text style={styles.historyTitle}>Explain 1NF, 2NF, 3NF differences</Text>
                <Text style={styles.historyMeta}>Sourced: gemini-2.0-flash • 10:42 AM</Text>
              </Card.Content>
            </Card>
            <Card style={styles.historyCard}>
              <Card.Content>
                <Text style={styles.historyTitle}>Define TCP three-way handshake latency</Text>
                <Text style={styles.historyMeta}>Sourced: llama-3.3-70b-versatile • Yesterday</Text>
              </Card.Content>
            </Card>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
    padding: 12
  },
  header: {
    marginTop: 35,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 8,
    marginBottom: 8
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  status: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 10
  },
  tabBtn: {
    flex: 1,
    borderRadius: 8,
    borderColor: '#4f46e5'
  },
  tabBtnLabel: {
    fontSize: 10,
    marginVertical: 4
  },
  subView: {
    flex: 1
  },
  messageList: {
    flex: 1
  },
  studentRow: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    marginBottom: 10,
    maxWidth: '85%'
  },
  aiRow: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 10,
    maxWidth: '85%'
  },
  bubble: {
    borderRadius: 14
  },
  studentBubble: {
    backgroundColor: '#4f46e5'
  },
  aiBubble: {
    backgroundColor: '#1e293b',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1
  },
  msgText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18
  },
  modelTag: {
    color: '#a5b4fc',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4
  },
  timeTag: {
    color: '#94a3b8',
    fontSize: 8,
    marginTop: 2,
    alignSelf: 'flex-end'
  },
  copyBtn: {
    marginTop: -2,
    alignSelf: 'flex-start'
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderRadius: 8,
    marginVertical: 10
  },
  loadingText: {
    color: '#cbd5e1',
    fontSize: 11
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    marginTop: 6
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#1e293b',
    borderRadius: 8
  },
  sendBtn: {
    backgroundColor: '#4f46e5',
    minWidth: 46,
    height: 40,
    justifyContent: 'center'
  },
  refinedConfigCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    marginBottom: 16
  },
  configTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2
  },
  configSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 12
  },
  configInput: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginBottom: 10,
    fontSize: 12
  },
  configInputMulti: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    fontSize: 12,
    lineHeight: 16
  },
  studyActions: {
    gap: 10
  },
  actionCard: {
    backgroundColor: '#1e293b',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 12
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12
  },
  actionInfo: {
    flex: 1
  },
  actionTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13
  },
  actionDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2
  },
  revisionCard: {
    backgroundColor: '#1e293b',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
    marginBottom: 15
  },
  revisionLabel: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4
  },
  revisionTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 20
  },
  revisionInput: {
    backgroundColor: 'transparent',
    marginVertical: 12
  },
  checkBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 8
  },
  feedbackBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 12
  },
  feedbackText: {
    color: '#34d399',
    fontSize: 12,
    lineHeight: 18
  },
  historySection: {
    gap: 10,
    marginBottom: 20
  },
  historyHeader: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4
  },
  historyCard: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderRadius: 10
  },
  historyTitle: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700'
  },
  historyMeta: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 4
  }
});
