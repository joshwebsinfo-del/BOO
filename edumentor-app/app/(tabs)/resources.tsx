import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Card, Button } from 'react-native-paper';

export default function ResourcesScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const mockResources = [
    { title: 'Syllabus_CS301.pdf', type: 'Syllabus', size: '254 KB' },
    { title: 'Lecture_Notes_DB_Normalization.pdf', type: 'Notes', size: '1.2 MB' },
    { title: 'Networking_TCP_vs_UDP.pdf', type: 'Notes', size: '920 KB' },
    { title: 'Exam_PastPaper_2024.pdf', type: 'Past Paper', size: '412 KB' }
  ];

  const filtered = mockResources.filter(res =>
    res.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Study Resources</Text>
        <Text style={styles.subtitle}>Browse syllabi, notes, past papers, and slides</Text>
      </View>

      <TextInput
        placeholder="Search documents..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.search}
        mode="outlined"
        theme={{ colors: { primary: '#4f46e5' }}}
      />

      <View style={styles.list}>
        {filtered.map((item, idx) => (
          <Card key={idx} style={styles.card}>
            <Card.Content style={styles.cardRow}>
              <View style={styles.iconBox}>
                <Text style={styles.icon}>📄</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.docTitle}>{item.title}</Text>
                <Text style={styles.docMeta}>{item.type} • {item.size}</Text>
              </View>
              <Button mode="outlined" style={styles.downloadBtn} labelStyle={{ fontSize: 10, paddingHorizontal: 0 }}>
                Download
              </Button>
            </Card.Content>
          </Card>
        ))}
      </View>
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
    marginBottom: 15
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
  search: {
    backgroundColor: '#1e293b',
    marginBottom: 15
  },
  list: {
    gap: 10
  },
  card: {
    backgroundColor: '#1e293b',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 12
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  icon: {
    fontSize: 18
  },
  info: {
    flex: 1,
    marginLeft: 12
  },
  docTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  docMeta: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2
  },
  downloadBtn: {
    borderColor: '#4f46e5',
    borderRadius: 8
  }
});
