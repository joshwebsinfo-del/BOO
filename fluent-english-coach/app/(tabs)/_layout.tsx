import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          height: 60,
          paddingBottom: 8,
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: '#111827',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Fluent English Coach',
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          headerTitle: 'Vocabulary & Expressions',
        }}
      />
      <Tabs.Screen
        name="speak"
        options={{
          title: 'Speak',
          headerTitle: 'Speaking Simulator',
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          headerTitle: 'Practice & Labs',
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          headerTitle: 'Your Progress',
        }}
      />
    </Tabs>
  );
}
