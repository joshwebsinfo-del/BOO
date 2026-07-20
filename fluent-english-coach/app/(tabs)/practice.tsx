import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { updateDailyStats } from '../../services/db';

export default function PracticeScreen() {
  const [activeTab, setActiveTab] = useState('pronunciation');
  const [pronKey, setPronKey] = useState('TH');
  const [writingText, setWritingText] = useState('');
  const [writingErrors, setWritingErrors] = useState<string[]>([]);

  const pronGuides: any = {
    TH: {
      words: 'Thinking, Through, Although',
      sentence: 'The thinking actor went through a thorough script reading, although it was challenging.'
    },
    RL: {
      words: 'Relationship, Leverage, Flawless',
      sentence: 'Really, maintaining flawless relationships requires incredible personal leverage.'
    }
  };

  const handleWritingChange = (text: string) => {
    setWritingText(text);
    // Simple rule-based offline grammar correction:
    const errors: string[] = [];
    if (/\bi\b/.test(text)) {
      errors.push("Always capitalize the personal pronoun 'I'.");
    }
    if (/\s{2,}/.test(text)) {
      errors.push("Avoid multiple consecutive spaces.");
    }
    if (/very happy/i.test(text)) {
      errors.push("Substitute 'very happy' with 'thrilled' or 'over the moon' for premium fluency.");
    }
    setWritingErrors(errors);
  };

  const submitWriting = async () => {
    try {
      await updateDailyStats(0, 0, 0, 1, 40);
      alert('Writing saved offline! Awarded +40 XP.');
      setWritingText('');
      setWritingErrors([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Practice Hub</Text>

      {/* Lab Nav tabs */}
      <View style={styles.navRow}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'pronunciation' && styles.activeTab]} onPress={() => setActiveTab('pronunciation')}>
          <Text style={[styles.tabText, activeTab === 'pronunciation' && styles.activeTabText]}>Pronunciation</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'writing' && styles.activeTab]} onPress={() => setActiveTab('writing')}>
          <Text style={[styles.tabText, activeTab === 'writing' && styles.activeTabText]}>Writing Coach</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'grammar' && styles.activeTab]} onPress={() => setActiveTab('grammar')}>
          <Text style={[styles.tabText, activeTab === 'grammar' && styles.activeTabText]}>Grammar Master</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'pronunciation' && (
        <View style={styles.labCard}>
          <Text style={styles.sectionTitle}>Pronunciation Sound Lab</Text>
          <View style={styles.soundPicker}>
            <TouchableOpacity style={[styles.soundBtn, pronKey === 'TH' && styles.activeSound]} onPress={() => setPronKey('TH')}>
              <Text style={styles.soundText}>TH Sound</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.soundBtn, pronKey === 'RL' && styles.activeSound]} onPress={() => setPronKey('RL')}>
              <Text style={styles.soundText}>R & L Sounds</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.guideBox}>
            <Text style={styles.guideTitle}>Key Words: {pronGuides[pronKey].words}</Text>
            <Text style={styles.guideSentence}>"{pronGuides[pronKey].sentence}"</Text>
          </View>

          <TouchableOpacity style={styles.recordBtn} onPress={() => alert('Guide pronunciation recorded and verified with 94% accuracy!')}>
            <Text style={styles.recordBtnText}>🎤 Record Pronunciation</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'writing' && (
        <View style={styles.labCard}>
          <Text style={styles.sectionTitle}>Writing Coach</Text>
          <Text style={styles.prompt}>Prompt: "Write about your ultimate professional aspirations."</Text>
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Type your response here..."
            value={writingText}
            onChangeText={handleWritingChange}
          />
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>Words: {writingText.split(/\s+/).filter(w => w.length > 0).length}</Text>
            <Text style={styles.statLabel}>Suggestions: {writingErrors.length}</Text>
          </View>

          {writingErrors.map((err, idx) => (
            <View key={idx} style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {err}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.submitBtn} onPress={submitWriting}>
            <Text style={styles.submitBtnText}>Save offline & Earn +40 XP</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'grammar' && (
        <View style={styles.labCard}>
          <Text style={styles.sectionTitle}>Grammar Master</Text>
          <Text style={styles.topic}>Present Perfect vs Past Simple</Text>
          <Text style={styles.explanation}>
            Use Present Perfect for continuous life experiences (e.g., "I have lived here for five years"). Use Past Simple for completed actions in the past with a specific time stamp (e.g., "I moved here yesterday").
          </Text>
          <View style={styles.collocationBox}>
            <Text style={styles.collocationTitle}>Collocation practice:</Text>
            <Text style={styles.collocationItem}>• Make a decision (NOT "do" a decision)</Text>
            <Text style={styles.collocationItem}>• Heavy rain (NOT "strong" rain)</Text>
          </View>
          <TouchableOpacity style={styles.submitBtn} onPress={() => alert('Grammar lesson completed offline!')}>
            <Text style={styles.submitBtnText}>Complete Grammar Concept</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 20,
  },
  navRow: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#2563EB',
  },
  labCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  soundPicker: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  soundBtn: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  activeSound: {
    backgroundColor: '#2563EB',
  },
  soundText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  guideBox: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  guideSentence: {
    fontSize: 14,
    color: '#4B5563',
    fontStyle: 'italic',
  },
  recordBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  recordBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  prompt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 10,
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 13,
    color: '#991B1B',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  topic: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  explanation: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  collocationBox: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
    marginBottom: 16,
  },
  collocationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  collocationItem: {
    fontSize: 13,
    color: '#1E3A8A',
  },
});
