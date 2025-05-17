import { useAuth } from '@/contexts/AuthContext';
import { useCleaningRequest } from '@/contexts/CleaningRequestContext';
import { subscribeToDoorStatus } from '@/services/rooms';
import { CleaningRequest } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CleaningScreen() {
  const { user } = useAuth();
  if (!user || user.role !== 'cleaner') return null;
  const { requests, loading, updateRequestStatus } = useCleaningRequest();
  const router = useRouter();
  const [doorStatuses, setDoorStatuses] = useState<Record<string, 'locked' | 'unlocked'>>({});
  const [lightStatuses, setLightStatuses] = useState<Record<string, 'on' | 'off'>>({});

  useEffect(() => {
    if (user?.role === 'cleaner') {
      // Подписываемся на статусы дверей для всех активных запросов
      const unsubscribers = requests
        .filter(req => ['pending', 'approved'].includes(req.status))
        .map(request => 
          subscribeToDoorStatus(request.roomId, (status) => {
            setDoorStatuses(prev => ({
              ...prev,
              [request.roomId]: status
            }));
          })
        );

      return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
      };
    }
  }, [user?.role, requests]);

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Для просмотра запросов на уборку необходимо войти в систему</Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.loginButtonText}>Войти</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Загрузка...</Text>
      </View>
    );
  }

  // Фильтруем запросы в зависимости от роли пользователя
  const filteredRequests = user.role === 'cleaner' 
    ? requests.filter(request => request.assignedTo === user.id)
    : requests;

  const handleStatusUpdate = async (requestId: string, newStatus: CleaningRequest['status']) => {
    try {
      await updateRequestStatus(requestId, newStatus);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить статус запроса');
    }
  };

  // --- Методы управления светом и дверью ---
  const makeGetRequestLightsOn = async () => {
    try {
      const response = await fetch('http://192.168.43.141:8000/LightOn', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return true;
    } catch (error) {
      console.error('Error fetching data:', error);
      return false;
    }
  };
  const makeGetRequestLightsOff = async () => {
    try {
      const response = await fetch('http://192.168.43.141:8000/LightOff', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return true;
    } catch (error) {
      console.error('Error fetching data:', error);
      return false;
    }
  };
  const makeGetRequestDoorLockOpen = async () => {
    try {
      const response = await fetch('http://192.168.43.141:8000/DoorLockOpen', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return true;
    } catch (error) {
      console.error('Error fetching data:', error);
      return false;
    }
  };
  const makeGetRequestDoorLockClose = async () => {
    try {
      const response = await fetch('http://192.168.43.141:8000/DoorLockClose', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return true;
    } catch (error) {
      console.error('Error fetching data:', error);
      return false;
    }
  };

  // --- handleUnlockDoor ---
  const handleUnlockDoor = async (roomId: string) => {
    try {
      const ok = await makeGetRequestDoorLockOpen();
      if (ok) {
        Alert.alert('Успех', 'Дверь разблокирована');
      } else {
        Alert.alert('Ошибка', 'Не удалось разблокировать дверь');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось разблокировать дверь');
    }
  };
  // --- handleToggleLight ---
  const handleToggleLight = async (roomId: string) => {
    try {
      let ok = false;
      if (lightStatuses[roomId] === 'on') {
        ok = await makeGetRequestLightsOff();
      } else {
        ok = await makeGetRequestLightsOn();
      }
      setLightStatuses(prev => ({
        ...prev,
        [roomId]: prev[roomId] === 'on' ? 'off' : 'on'
      }));
      Alert.alert(ok ? 'Успех' : 'Ошибка', ok ? (lightStatuses[roomId] === 'on' ? 'Свет выключен' : 'Свет включен') : 'Не удалось переключить свет');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось переключить свет');
    }
  };

  const getStatusActions = (request: CleaningRequest) => {
    if (user.role !== 'cleaner' || request.status === 'completed' || request.status === 'rejected') {
      return null;
    }

    return (
      <View style={styles.actionButtons}>
        {request.status === 'pending' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleStatusUpdate(request.id, 'approved')}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#2e7d32" />
              <Text style={[styles.actionButtonText, styles.approveButtonText]}>Принять</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleStatusUpdate(request.id, 'rejected')}
            >
              <Ionicons name="close-circle-outline" size={20} color="#d32f2f" />
              <Text style={[styles.actionButtonText, styles.rejectButtonText]}>Отклонить</Text>
            </TouchableOpacity>
          </>
        )}
        {request.status === 'approved' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleStatusUpdate(request.id, 'completed')}
            >
              <Ionicons name="checkmark-done-circle-outline" size={20} color="#1976d2" />
              <Text style={[styles.actionButtonText, styles.completeButtonText]}>Завершить</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                doorStatuses[request.roomId] === 'unlocked' ? styles.doorUnlockedButton : styles.doorLockedButton
              ]}
              onPress={() => handleUnlockDoor(request.roomId)}
              disabled={doorStatuses[request.roomId] === 'unlocked'}
            >
              <Ionicons 
                name={doorStatuses[request.roomId] === 'unlocked' ? 'lock-open-outline' : 'lock-closed-outline'} 
                size={20} 
                color={doorStatuses[request.roomId] === 'unlocked' ? '#2e7d32' : '#666'} 
              />
              <Text style={[
                styles.actionButtonText,
                doorStatuses[request.roomId] === 'unlocked' ? styles.doorUnlockedText : styles.doorLockedText
              ]}>
                {doorStatuses[request.roomId] === 'unlocked' ? 'Дверь разблокирована' : 'Разблокировать дверь'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.lightButton]}
              onPress={() => handleToggleLight(request.roomId)}
            >
              <Ionicons 
                name={lightStatuses[request.roomId] === 'on' ? 'bulb' : 'bulb-outline'} 
                size={20} 
                color={lightStatuses[request.roomId] === 'on' ? '#2e7d32' : '#666'} 
              />
              <Text style={[
                styles.actionButtonText,
                lightStatuses[request.roomId] === 'on' ? styles.lightOnText : styles.lightOffText
              ]}>
                {lightStatuses[request.roomId] === 'on' ? 'Включено' : 'Выключено'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{flex:1, backgroundColor:'#fff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 32 : 16}}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {user.role === 'cleaner' ? 'Задания на уборку' : 'Запросы на уборку'}
          </Text>
        </View>

        {filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {user.role === 'cleaner' ? 'У вас нет заданий на уборку' : 'У вас нет запросов на уборку'}
            </Text>
          </View>
        ) : (
          <View style={styles.requestsList}>
            {filteredRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestType}>
                    {request.requestType === 'urgent' ? 'Срочная уборка' : 'Обычная уборка'}
                  </Text>
                  <Text style={[
                    styles.requestStatus,
                    request.status === 'completed' && styles.statusCompleted,
                    request.status === 'pending' && styles.statusPending,
                    request.status === 'approved' && styles.statusApproved,
                    request.status === 'rejected' && styles.statusRejected,
                  ]}>
                    {request.status === 'completed' && 'Выполнено'}
                    {request.status === 'pending' && 'Ожидает'}
                    {request.status === 'approved' && 'Одобрено'}
                    {request.status === 'rejected' && 'Отклонено'}
                  </Text>
                </View>

                {request.notes && (
                  <Text style={styles.requestNotes}>{request.notes}</Text>
                )}

                <Text style={styles.requestDate}>
                  Создано: {new Date(request.createdAt).toLocaleDateString()}
                </Text>

                {getStatusActions(request)}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    padding: 16,
  },
  loginButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  requestsList: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  requestStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusCompleted: {
    color: '#2e7d32',
  },
  statusPending: {
    color: '#f57c00',
  },
  statusApproved: {
    color: '#1976d2',
  },
  statusRejected: {
    color: '#d32f2f',
  },
  requestNotes: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    flex: 1,
    minWidth: '45%',
    justifyContent: 'center',
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 14,
  },
  approveButton: {
    backgroundColor: '#e8f5e9',
  },
  approveButtonText: {
    color: '#2e7d32',
  },
  rejectButton: {
    backgroundColor: '#ffebee',
  },
  rejectButtonText: {
    color: '#d32f2f',
  },
  completeButton: {
    backgroundColor: '#e3f2fd',
  },
  completeButtonText: {
    color: '#1976d2',
  },
  doorLockedButton: {
    backgroundColor: '#fff3e0',
  },
  doorUnlockedButton: {
    backgroundColor: '#e8f5e9',
  },
  doorLockedText: {
    color: '#666',
  },
  doorUnlockedText: {
    color: '#2e7d32',
  },
  lightButton: {
    backgroundColor: '#f3e5f5',
  },
  lightOnText: {
    color: '#2e7d32',
  },
  lightOffText: {
    color: '#666',
  },
}); 