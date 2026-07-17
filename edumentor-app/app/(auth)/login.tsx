import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Navigate straight to tabs dashboard on success
    router.replace('/(tabs)/dashboard');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🎓</Text>
        <Text variant="headlineMedium" style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your EduMentor Workspace</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Username or Institution Email"
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          style={styles.input}
          theme={{ colors: { primary: '#4f46e5' }}}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry
          style={styles.input}
          theme={{ colors: { primary: '#4f46e5' }}}
        />

        <Button mode="contained" onPress={handleLogin} style={styles.btn}>
          Sign In
        </Button>

        <Button mode="text" onPress={() => router.push('/(auth)/register')} style={styles.subBtn} labelStyle={{ color: '#818cf8' }}>
          Create an Account
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#0a0e1a',
    justifyContent: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: 40
  },
  logo: {
    fontSize: 48,
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
    gap: 15
  },
  input: {
    backgroundColor: 'transparent'
  },
  btn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10
  },
  subBtn: {
    marginTop: 5
  }
});
