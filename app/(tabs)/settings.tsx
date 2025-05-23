import LoginPrompt from '@/components/LoginPrompt';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const { user, logout, updateSettings } = useAuth();
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
        soundEnabled,
      });
      Alert.alert('Успех', 'Настройки сохранены');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить настройки');
    }
  };

  return (
    <SafeAreaView style={{flex:1, backgroundColor:'#fff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 32 : 16}}>
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
          <Text style={styles.sectionTitle}>Настройки</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Звуковые эффекты</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
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
    backgroundColor: '#007AFF',
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutText: {
    color: '#fff',
  },
}); 