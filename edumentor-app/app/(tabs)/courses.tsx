import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, Card } from 'react-native-paper';

export default function CoursesScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Course Curriculum</Text>
        <Text style={styles.subtitle}>BSc Information Technology</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <List.Section title="Syllabus Directory">
            <List.Accordion
              title="CS301 - Database Systems"
              left={props => <List.Icon {...props} icon="database" />}
            >
              <List.Item title="Module 1: Relational Data Models" description="Schemas, relational algebra, primary/foreign keys" />
              <List.Item title="Module 2: Database Normalization" description="Anomalies, dependencies, 1NF, 2NF, 3NF, BCNF" />
            </List.Accordion>

            <List.Accordion
              title="CS302 - Computer Networks"
              left={props => <List.Icon {...props} icon="lan" />}
            >
              <List.Item title="Module 1: Transport Protocols" description="TCP transmission handshake, UDP connectionless streams" />
            </List.Accordion>
          </List.Section>
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
    marginBottom: 20
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
  card: {
    backgroundColor: '#1e293b',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 14
  }
});
