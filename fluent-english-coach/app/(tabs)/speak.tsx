import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

export default function SpeakScreen() {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Speaking Coach</Text>
      <Text style={styles.pageSubtitle}>Simulate standard conversation scenarios fully offline.</Text>

      {/* Challenge Card */}
      <View style={styles.card}>
        <Text style={styles.accentLabel}>TODAY'S TOPIC</Text>
        <Text style={styles.promptTitle}>"Describe your dream job and why it excites you."</Text>
        <Text style={styles.durationTag}>Recommended: Speak for 1 minute</Text>

        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordingActive]}
          onPress={() => setIsRecording(!isRecording)}
        >
          <Text style={styles.recordButtonText}>
            {isRecording ? '⏹ Stop Recording' : '🎤 Start Challenge'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Simulator Section */}
      <Text style={styles.sectionTitle}>Conversation Simulators</Text>
      <View style={styles.listContainer}>
        {['Job Interview', 'Dating', 'Business Meeting', 'Ordering at Coffee Shop'].map(scenario => (
          <TouchableOpacity key={scenario} style={styles.scenarioRow}>
            <View>
              <Text style={styles.scenarioName}>{scenario}</Text>
              <Text style={styles.scenarioDesc}>Learn natural phrases and swap roles</Text>
            </View>
            <Text style={styles.goIcon}>➔</Text>
          </TouchableOpacity>
        ))}
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
  listContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  scenarioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  scenarioName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  scenarioDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  goIcon: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '700',
  },
});
