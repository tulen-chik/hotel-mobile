import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

type TabIconProps = {
  name: 'bed-outline' | 'calendar-outline' | 'person-outline' | 'settings-outline' | 'water-outline' | 'restaurant-outline';
  color: string;
  size: number;
};

const TabIcon = ({ name, color, size }: TabIconProps) => {
  return <Ionicons name={name} size={size} color={color} />;
};

Ionicons.loadFont();

export default function TabLayout() {
  const { user, isCleaner } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
            <Tabs.Screen
        name="reservations"
        options={{
          title: 'Бронирования',
          tabBarIcon: (props) => <Ionicons name="calendar-outline" {...props} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: (props) => <TabIcon name="bed-outline" {...props} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: (props) => <TabIcon name="settings-outline" {...props} />,
        }}
      />
    </Tabs>
  );
}