import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user, updateSettings, loading } = useAuth();
  const [settings, setSettings] = useState(user?.settings || {
    pushNotifications: true,
    emailNotifications: true,
    soundEnabled: true,
  });

  useEffect(() => {
    if (user?.settings) {
      setSettings(user.settings);
    }
  }, [user?.settings]);

  const toggleSetting = async (key: keyof typeof settings) => {
    try {
      const newSettings = {
        ...settings,
        [key]: !settings[key],
      };
      
      // Если отключаем push-уведомления, удаляем токен
      if (key === 'pushNotifications' && !newSettings.pushNotifications) {
        await Notifications.unregisterForNotificationsAsync();
      }
      
      // Если включаем push-уведомления, запрашиваем разрешение
      if (key === 'pushNotifications' && newSettings.pushNotifications) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Ошибка',
            'Для включения push-уведомлений необходимо предоставить разрешение'
          );
          return;
        }
      }

      await updateSettings(newSettings);
      setSettings(newSettings);
      // Alert.alert('Успех', 'Настройки успешно обновлены');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить настройки');
    }
  };

  if (loading) {
    return (
      <LoadingScreen message="Загрузка..." />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Уведомления</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Настройки уведомлений</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={24} color="#000" />
              <Text style={styles.settingText}>Push-уведомления</Text>
            </View>
            <Switch
              value={settings.pushNotifications}
              onValueChange={() => toggleSetting('pushNotifications')}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="mail-outline" size={24} color="#000" />
              <Text style={styles.settingText}>Email-уведомления</Text>
            </View>
            <Switch
              value={settings.emailNotifications}
              onValueChange={() => toggleSetting('emailNotifications')}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="volume-high-outline" size={24} color="#000" />
              <Text style={styles.settingText}>Звук уведомлений</Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={() => toggleSetting('soundEnabled')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>История уведомлений</Text>
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={48} color="#666" />
            <Text style={styles.emptyStateText}>Нет новых уведомлений</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
}); 