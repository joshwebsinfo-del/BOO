import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, RadioButton } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [studentNo, setStudentNo] = useState('');
  const [role, setRole] = useState('student');

  const handleRegister = () => {
    router.replace('/(tabs)/dashboard');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🎓</Text>
        <Text variant="headlineMedium" style={styles.title}>Join EduMentor</Text>
        <Text style={styles.subtitle}>Create your AI-powered study space</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Full Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          theme={{ colors: { primary: '#4f46e5' }}}
        />
        <TextInput
          label="Email Address"
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          style={styles.input}
          theme={{ colors: { primary: '#4f46e5' }}}
        />

        {role === 'student' && (
          <TextInput
            label="School Student Number"
            value={studentNo}
            onChangeText={setStudentNo}
            placeholder="KP-2026-993F"
            placeholderTextColor="#64748b"
            mode="outlined"
            style={styles.input}
            theme={{ colors: { primary: '#4f46e5' }}}
          />
        )}

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry
          style={styles.input}
          theme={{ colors: { primary: '#4f46e5' }}}
        />

        <View style={styles.roleContainer}>
          <Text style={styles.roleLabel}>I want to register as:</Text>
          <RadioButton.Group onValueChange={value => setRole(value)} value={role}>
            <View style={styles.radioRow}>
              <RadioButton.Item label="Student" value="student" color="#4f46e5" labelStyle={{ color: '#fff' }} />
              <RadioButton.Item label="Lecturer" value="lecturer" color="#4f46e5" labelStyle={{ color: '#fff' }} />
            </View>
          </RadioButton.Group>
        </View>

        <Button mode="contained" onPress={handleRegister} style={styles.btn}>
          Create Account
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#0a0e1a',
    justifyContent: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: 30
  },
  logo: {
    fontSize: 44,
    marginBottom: 10
  },
  title: {
    fontWeight: 'bold',
    color: '#f1f5f9'
  },
  subtitle: {
    color: '#94a3b8',
    marginTop: 5,
    fontSize: 14
  },
  form: {
    gap: 12
  },
  input: {
    backgroundColor: 'transparent'
  },
  roleContainer: {
    marginVertical: 10
  },
  roleLabel: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 5
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  btn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10
  }
});
