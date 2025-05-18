import { useAuth } from '@/contexts/AuthContext';
import { useRepair } from '@/contexts/RepairContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RepairRequestDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { repairRequests, loading, error, updateRequest } = useRepair();
  const { user } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const request = repairRequests.find(r => r.id === id);

  useEffect(() => {
    if (request?.notes) {
      setNotes(request.notes);
    }
  }, [request]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6200EA" />
      </View>
    );
  }

  if (error || !request) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'Заявка не найдена'}</Text>
      </View>
    );
  }

  const handleStatusChange = async (newStatus: 'in_progress' | 'completed' | 'cancelled') => {
    if (!request?.id) return;
    
    try {
      setIsUpdating(true);
      await updateRequest(request.id, {
        status: newStatus,
        notes: notes,
        completedAt: newStatus === 'completed' ? Date.now() : undefined,
        assignedTo: newStatus === 'in_progress' ? user?.uid : undefined
      });
      Alert.alert('Успех', 'Статус заявки обновлен');
      router.back();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить статус заявки');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFA000';
      case 'in_progress': return '#1976D2';
      case 'completed': return '#388E3C';
      case 'cancelled': return '#D32F2F';
      default: return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'in_progress': return 'В работе';
      case 'completed': return 'Завершено';
      case 'cancelled': return 'Отменено';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'plumbing': return 'Сантехника';
      case 'electrical': return 'Электрика';
      case 'furniture': return 'Мебель';
      case 'other': return 'Другое';
      default: return type;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#D32F2F';
      case 'medium': return '#FFA000';
      case 'low': return '#388E3C';
      default: return '#757575';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.roomInfo}>
          <Ionicons name="home-outline" size={24} color="#333" />
          <Text style={styles.roomNumber}>№{request.roomId}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
          <Text style={styles.statusText}>{getStatusText(request.status)}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Описание проблемы</Text>
          <Text style={styles.description}>{request.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Детали заявки</Text>
          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Ionicons name="construct-outline" size={20} color="#666" />
              <Text style={styles.detailText}>{getTypeText(request.type)}</Text>
            </View>
            
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(request.priority) }]}>
              <Text style={styles.priorityText}>
                {request.priority === 'high' ? 'Высокий' :
                 request.priority === 'medium' ? 'Средний' : 'Низкий'} приоритет
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Примечания</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Добавьте примечания к заявке..."
            multiline
            numberOfLines={4}
          />
        </View>

        {request.status === 'pending' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={() => handleStatusChange('in_progress')}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>Начать работу</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {request.status === 'in_progress' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleStatusChange('completed')}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>Завершить работу</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleStatusChange('cancelled')}
              disabled={isUpdating}
            >
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Отменить</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#666',
  },
  priorityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  priorityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#1976D2',
  },
  completeButton: {
    backgroundColor: '#388E3C',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d32f2f',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#d32f2f',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    padding: 16,
  },
}); 