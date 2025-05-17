import LoginPrompt from '@/components/LoginPrompt';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const { user, logout, updateSettings } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(user?.settings?.pushNotifications ?? true);
  const [emailNotifications, setEmailNotifications] = useState(user?.settings?.emailNotifications ?? true);
  const [soundEnabled, setSoundEnabled] = useState(user?.settings?.soundEnabled ?? true);

  if (!user) {
    return <LoginPrompt message="Для доступа к настройкам необходимо войти в систему" />;
  }

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выйти из системы');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings({
        pushNotifications,
        emailNotifications,
        soundEnabled,
      });
      Alert.alert('Успех', 'Настройки сохранены');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить настройки');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#666" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Уведомления</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Push-уведомления</Text>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Email-уведомления</Text>
          <Switch
            value={emailNotifications}
            onValueChange={setEmailNotifications}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Звуковые уведомления</Text>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
          />
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSaveSettings}
        >
          <Text style={styles.buttonText}>Сохранить настройки</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.signOutButton]}
          onPress={handleSignOut}
        >
          <Text style={[styles.buttonText, styles.signOutText]}>Выйти</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  saveButton: {
    backgroundColor: '#000',
  },
  signOutButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutText: {
    color: '#ff3b30',
  },
}); 