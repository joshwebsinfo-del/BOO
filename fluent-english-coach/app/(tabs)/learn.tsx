import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { getAllVocabulary, getAllIdioms, getAllPhrasalVerbs } from '../../services/db';

export default function LearnScreen() {
  const [vocab, setVocab] = useState<any[]>([]);
  const [idioms, setIdioms] = useState<any[]>([]);
  const [phrasals, setPhrasals] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const vocabData = await getAllVocabulary();
      const idiomData = await getAllIdioms();
      const phrasalData = await getAllPhrasalVerbs();
      setVocab(vocabData || []);
      setIdioms(idiomData || []);
      setPhrasals(phrasalData || []);
    } catch (err) {
      console.warn('Could not query content from local SQLite:', err);
    }
  };

  const filteredVocab = vocab.filter(item => {
    const matchesCat = category === 'All' || item.category === category;
    const matchesSearch = item.word.toLowerCase().includes(search.toLowerCase()) ||
                          item.meaning.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Vocabulary Builder</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search vocabulary offline..."
        value={search}
        onChangeText={setSearch}
      />

      {/* Category Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {['All', 'Business', 'Travel', 'Daily Life', 'Work'].map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, category === cat && styles.activeChip]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.chipText, category === cat && styles.activeChipText]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Dynamic SQLite Vocabulary Results */}
      <Text style={styles.sectionTitle}>Vocabulary Words ({filteredVocab.length})</Text>
      {filteredVocab.map((v: any) => (
        <View key={v.id} style={styles.card}>
          <Text style={styles.sectionHeader}>{v.category}</Text>
          <Text style={styles.phraseTitle}>{v.word}</Text>
          <Text style={styles.pronunciation}>{v.pronunciation}</Text>
          <Text style={styles.meaningText}>Meaning: {v.meaning}</Text>
          <Text style={styles.exampleText}>Example: "{v.example_sentence}"</Text>
        </View>
      ))}

      {/* Dynamic SQLite Idioms */}
      <Text style={styles.sectionTitle}>Idioms</Text>
      {idioms.map((idm: any) => (
        <View key={idm.id} style={styles.card}>
          <Text style={styles.phraseTitle}>{idm.phrase}</Text>
          <Text style={styles.meaningText}>Meaning: {idm.meaning}</Text>
          <Text style={styles.exampleText}>Example: "{idm.example_sentence}"</Text>
        </View>
      ))}
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
    marginBottom: 12,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 10,
    marginBottom: 10,
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
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  phraseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  pronunciation: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  meaningText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  exampleText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
