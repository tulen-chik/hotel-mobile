import { useAuth } from '@/contexts/AuthContext';
import { useCleaningRequest } from '@/contexts/CleaningRequestContext';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CleaningScreen() {
  const { user } = useAuth();
  const { requests, loading } = useCleaningRequest();
  const router = useRouter();

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Запросы на уборку</Text>
      </View>

      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>У вас нет запросов на уборку</Text>
        </View>
      ) : (
        <View style={styles.requestsList}>
          {requests.map((request) => (
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
            </View>
          ))}
        </View>
      )}
    </View>
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusCompleted: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  statusPending: {
    backgroundColor: '#fff3e0',
    color: '#f57c00',
  },
  statusApproved: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
  },
  statusRejected: {
    backgroundColor: '#ffebee',
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
}); 