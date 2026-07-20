import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

export default function PracticeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Practice Hub</Text>
      <Text style={styles.pageSubtitle}>Polish your intermediate English fluency, reading, and listening skills.</Text>

      {/* Grid Menu of labs */}
      <View style={styles.grid}>
        <TouchableOpacity style={styles.gridItem}>
          <Text style={styles.icon}>🎙️</Text>
          <Text style={styles.itemTitle}>Pronunciation Lab</Text>
          <Text style={styles.itemDesc}>Perfect the TH, R, and L sounds.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem}>
          <Text style={styles.icon}>🎧</Text>
          <Text style={styles.itemTitle}>Listening Lab</Text>
          <Text style={styles.itemDesc}>Audio stories & comprehension.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem}>
          <Text style={styles.icon}>📖</Text>
          <Text style={styles.itemTitle}>Reading Club</Text>
          <Text style={styles.itemDesc}>Curated intermediate passages.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem}>
          <Text style={styles.icon}>✍️</Text>
          <Text style={styles.itemTitle}>Writing Coach</Text>
          <Text style={styles.itemDesc}>Get grammar corrections.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem}>
          <Text style={styles.icon}>✨</Text>
          <Text style={styles.itemTitle}>Grammar Master</Text>
          <Text style={styles.itemDesc}>Clear explanations and tests.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem}>
          <Text style={styles.icon}>🗂️</Text>
          <Text style={styles.itemTitle}>Flashcards</Text>
          <Text style={styles.itemDesc}>Spaced repetition learning.</Text>
        </TouchableOpacity>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    width: '48%',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  icon: {
    fontSize: 28,
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  itemDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
  },
});
