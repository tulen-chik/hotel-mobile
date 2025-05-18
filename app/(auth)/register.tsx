import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

type UserRole = 'user' | 'cleaner' | 'repairer';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const { register, loading, error } = useAuth();

  const handleRegister = async () => {
    try {
      await register(email, password, name, phone, role);
      router.dismiss();
    } catch (err) {
      // Error is handled by the auth context
    }
  };

  const roles: { value: UserRole; label: string }[] = [
    { value: 'user', label: 'Гость' },
    { value: 'cleaner', label: 'Уборщик' },
    { value: 'repairer', label: 'Ремонтник' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.dismiss()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Регистрация</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Имя"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Пароль"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Телефон (необязательно)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.sectionTitle}>Выберите роль:</Text>
        <View style={styles.roleContainer}>
          {roles.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[
                styles.roleButton,
                role === r.value && styles.selectedRoleButton,
              ]}
              onPress={() => setRole(r.value)}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  role === r.value && styles.selectedRoleButtonText,
                ]}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity 
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Зарегистрироваться</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push('/(auth)/login')}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>Уже есть аккаунт? Войти</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 40,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 36,
    textAlign: 'center',
    color: '#222',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d1d1',
    padding: 14,
    borderRadius: 12,
    marginBottom: 22,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#5d3472',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 18,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  error: {
    color: '#d32f2f',
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 15,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 0,
  },
  linkText: {
    color: '#222',
    fontSize: 15,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d1d1',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedRoleButton: {
    backgroundColor: '#5d3472',
    borderColor: '#5d3472',
  },
  roleButtonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedRoleButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
}); 