import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Avatar, Card, List, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

interface ProfileData {
  full_name: string;
  email: string;
  course: string;
  studentNo: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>({
    full_name: 'Loading Student...',
    email: '',
    course: 'Information Technology',
    studentNo: 'KP-2026-993F'
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://10.0.2.2:5000/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile({
          full_name: data.full_name || 'Kwekwe Poly Student',
          email: data.email || 'student@kwekwe.ac.zw',
          course: data.course || 'Information Technology',
          studentNo: data.student_no || data.studentNo || 'KP-2026-993F'
        });
      }
    } catch (err) {
      // Fallback
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          router.replace('/(auth)/login');
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text
          size={56}
          label={profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'S'}
          style={styles.avatar}
          labelStyle={{ fontWeight: 'bold' }}
        />
        <Text style={styles.name}>{profile.full_name}</Text>
        <Text style={styles.meta}>{profile.course} • Semester 5</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.row}>
            <Text style={styles.label}>Institution</Text>
            <Text style={styles.val}>Kwekwe Poly</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Student ID</Text>
            <Text style={styles.val}>{profile.studentNo}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Academic Email</Text>
            <Text style={styles.val}>{profile.email || 'student@kwekwe.ac.zw'}</Text>
          </View>
        </Card.Content>
      </Card>

      <List.Section title="App Settings" titleStyle={{ color: '#94a3b8' }}>
        <List.Item
          title="Notification Preferences"
          left={props => <List.Icon {...props} icon="bell" color="#fff" />}
          titleStyle={{ color: '#fff', fontSize: 14 }}
          style={styles.listItem}
        />
        <List.Item
          title="Theme (Dark Mode)"
          left={props => <List.Icon {...props} icon="weather-night" color="#fff" />}
          titleStyle={{ color: '#fff', fontSize: 14 }}
          style={styles.listItem}
        />
      </List.Section>

      <Button mode="contained" onPress={handleLogout} style={styles.logoutBtn}>
        Log Out Session
      </Button>
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
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20
  },
  avatar: {
    backgroundColor: '#4f46e5',
    marginBottom: 10
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  meta: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2
  },
  card: {
    backgroundColor: '#1e293b',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 20
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  label: {
    color: '#94a3b8',
    fontSize: 13
  },
  val: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 40,
    paddingVertical: 4
  }
});
