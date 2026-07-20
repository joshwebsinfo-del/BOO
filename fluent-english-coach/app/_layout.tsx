import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { initDatabase } from '../services/db';

export default function RootLayout() {
  useEffect(() => {
    // Initialize standard offline SQLite database tables and seeds automatically on launch
    initDatabase().catch(err => {
      console.error('Failed to initialize local SQLite tables:', err);
    });
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
