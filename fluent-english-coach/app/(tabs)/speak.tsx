import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { getConversationScenarios, updateDailyStats } from '../../services/db';

export default function SpeakScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [activeScenario, setActiveScenario] = useState<any>(null);
  const [dialogueIndex, setDialogueIndex] = useState(1);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      const data = await getConversationScenarios();
      setScenarios(data || []);
      if (data && data.length > 0) {
        setActiveScenario(data[0]);
      }
    } catch (err) {
      console.warn('Could not query conversations from SQLite:', err);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop and save time stats
      setIsRecording(false);
      try {
        await updateDailyStats(1, 0, 0, 0, 30);
        alert('Challenge complete! Awarded +30 XP.');
      } catch (err) {
        console.error(err);
      }
    } else {
      setIsRecording(true);
    }
  };

  const advanceDialogue = () => {
    if (!activeScenario) return;
    const parsed = JSON.parse(activeScenario.dialogue_json);
    if (dialogueIndex < parsed.length) {
      setDialogueIndex(dialogueIndex + 1);
    } else {
      alert('Scenario dialogue completed!');
    }
  };

  const parsedDialogue = activeScenario ? JSON.parse(activeScenario.dialogue_json).slice(0, dialogueIndex) : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Speaking Coach</Text>
      <Text style={styles.pageSubtitle}>Simulate conversation role-plays fully offline.</Text>

      {/* Challenge Card */}
      <View style={styles.card}>
        <Text style={styles.accentLabel}>TOPIC CHALLENGE</Text>
        <Text style={styles.promptTitle}>"Describe your favorite travel journey in English."</Text>
        <Text style={styles.durationTag}>Recommended speaking duration: 1 min</Text>

        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordingActive]}
          onPress={toggleRecording}
        >
          <Text style={styles.recordButtonText}>
            {isRecording ? '⏹ Stop & Analyze' : '🎤 Record Response'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Simulator Section */}
      <Text style={styles.sectionTitle}>Conversation Simulator</Text>
      {activeScenario ? (
        <View style={styles.simulatorCard}>
          <Text style={styles.scenarioTitle}>{activeScenario.title}</Text>
          <ScrollView style={styles.dialogueBox}>
            {parsedDialogue.map((d: any, idx: number) => (
              <View key={idx} style={[styles.bubble, d.role === 'coach' ? styles.coachBubble : styles.userBubble]}>
                <Text style={styles.bubbleRole}>{d.role === 'coach' ? 'Coach' : 'You'}</Text>
                <Text style={styles.bubbleText}>{d.text}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.advanceBtn} onPress={advanceDialogue}>
              <Text style={styles.btnText}>Next Dialogue ➔</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={styles.emptyText}>No conversation scenarios available.</Text>
      )}
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
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  accentLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  durationTag: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 20,
  },
  recordButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 100,
    width: '100%',
    alignItems: 'center',
  },
  recordingActive: {
    backgroundColor: '#EF4444',
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  simulatorCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  dialogueBox: {
    maxHeight: 220,
    marginBottom: 16,
  },
  bubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    maxWidth: '85%',
  },
  coachBubble: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  userBubble: {
    backgroundColor: '#2563EB',
    alignSelf: 'flex-end',
  },
  bubbleRole: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: '#111827',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  advanceBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyText: {
    color: '#6B7280',
    fontStyle: 'italic',
  },
});
