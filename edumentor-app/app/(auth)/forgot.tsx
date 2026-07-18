import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function ForgotScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleReset = () => {
    alert('Reset link sent to email!');
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🔒</Text>
        <Text variant="headlineMedium" style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter email to receive password reset link</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          theme={{ colors: { primary: '#4f46e5' }}}
        />

        <Button mode="contained" onPress={handleReset} style={styles.btn}>
          Send Reset Instructions
        </Button>

        <Button mode="text" onPress={() => router.replace('/(auth)/login')} style={styles.backBtn} labelStyle={{ color: '#818cf8' }}>
          Back to Login
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
    fontSize: 14,
    textAlign: 'center'
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
  backBtn: {
    marginTop: 5
  }
});
