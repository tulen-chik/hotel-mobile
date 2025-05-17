import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function UserLayout() {
  const { user, isCleaner } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isCleaner) {
      router.replace('/(cleaner)' as any);
    }
  }, [user, isCleaner]);

  if (!user || isCleaner) {
    return null;
  }

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
        name="index"
        options={{
          title: 'Номера',
          tabBarIcon: (props) => <Ionicons name="bed-outline" {...props} />,
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Бронирования',
          tabBarIcon: (props) => <Ionicons name="calendar-outline" {...props} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Настройки',
          tabBarIcon: (props) => <Ionicons name="settings-outline" {...props} />,
        }}
      />
    </Tabs>
  );
} 