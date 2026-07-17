import React from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.08)'
        },
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700'
        }
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home'
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Tutor'
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses'
        }}
      />
      <Tabs.Screen
        name="resources"
        options={{
          title: 'Resources'
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner'
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile'
        }}
      />
    </Tabs>
  );
}
