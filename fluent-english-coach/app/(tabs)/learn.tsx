import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';

export default function LearnScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Travel', 'Business', 'Daily Life', 'Work', 'Money'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Vocabulary Builder</Text>
      <Text style={styles.pageSubtitle}>Learn premium English for confident, natural conversations.</Text>

      {/* Filter Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, activeCategory === cat && styles.activeChip]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.chipText, activeCategory === cat && styles.activeChipText]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Featured Expressions */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Idiom of the Day</Text>
        <Text style={styles.phraseTitle}>"Hit the books"</Text>
        <Text style={styles.meaningText}>Meaning: To study very hard or intensively.</Text>
        <Text style={styles.exampleText}>Example: "I have an intermediate exam tomorrow, so I need to hit the books tonight."</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Instead of "I'm happy", say:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• I'm over the moon</Text>
          <Text style={styles.listItem}>• I'm thrilled</Text>
          <Text style={styles.listItem}>• I'm absolutely delighted</Text>
        </View>
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
  categoryScroll: {
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: '#2563EB',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  phraseTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  meaningText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  exampleText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  list: {
    marginTop: 8,
  },
  listItem: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
});
