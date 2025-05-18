import { useRepair } from '@/contexts/RepairContext';
import { RepairPriority, RepairRequest, RepairStatus, RepairType } from '@/types/repair';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RepairerScreen() {
  const { repairRequests, loading, error, fetchRequests } = useRepair();
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = repairRequests.filter(request => request.status === selectedStatus);

  const renderRequest = ({ item }: { item: RepairRequest }) => {
    const getStatusColor = (status: RepairStatus) => {
      switch (status) {
        case 'pending': return '#FFA000';
        case 'in_progress': return '#1976D2';
        case 'completed': return '#388E3C';
        default: return '#757575';
      }
    };

    const getStatusText = (status: RepairStatus) => {
      switch (status) {
        case 'pending': return 'Ожидает';
        case 'in_progress': return 'В работе';
        case 'completed': return 'Завершено';
        default: return status;
      }
    };

    const getTypeText = (type: RepairType) => {
      switch (type) {
        case 'plumbing': return 'Сантехника';
        case 'electrical': return 'Электрика';
        case 'furniture': return 'Мебель';
        case 'other': return 'Другое';
        default: return type;
      }
    };

    const getPriorityColor = (priority: RepairPriority) => {
      switch (priority) {
        case 'high': return '#D32F2F';
        case 'medium': return '#FFA000';
        case 'low': return '#388E3C';
        default: return '#757575';
      }
    };

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => router.push({ pathname: '/repairer/[id]' as any, params: { id: item.id } })}
      >
        <View style={styles.requestHeader}>
          <View style={styles.roomInfo}>
            <Ionicons name="home-outline" size={20} color="#666" />
            <Text style={styles.roomNumber}>№{item.roomId}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.requestContent}>
          <Text style={styles.description}>{item.description}</Text>
          
          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Ionicons name="construct-outline" size={16} color="#666" />
              <Text style={styles.detailText}>{getTypeText(item.type)}</Text>
            </View>
            
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.priorityText}>
                {item.priority === 'high' ? 'Высокий' :
                 item.priority === 'medium' ? 'Средний' : 'Низкий'} приоритет
              </Text>
            </View>
          </View>

          {item.notes && (
            <View style={styles.notes}>
              <Text style={styles.notesLabel}>Примечания:</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6200EA" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusFilter}>
        <TouchableOpacity
          style={[styles.filterButton, selectedStatus === 'pending' && styles.selectedFilter]}
          onPress={() => setSelectedStatus('pending')}
        >
          <Text style={[styles.filterText, selectedStatus === 'pending' && styles.selectedFilterText]}>
            Ожидают
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedStatus === 'in_progress' && styles.selectedFilter]}
          onPress={() => setSelectedStatus('in_progress')}
        >
          <Text style={[styles.filterText, selectedStatus === 'in_progress' && styles.selectedFilterText]}>
            В работе
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedStatus === 'completed' && styles.selectedFilter]}
          onPress={() => setSelectedStatus('completed')}
        >
          <Text style={[styles.filterText, selectedStatus === 'completed' && styles.selectedFilterText]}>
            Завершённые
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredRequests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestContent: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notes: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
  },
  statusFilter: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedFilter: {
    backgroundColor: '#6200EA',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  selectedFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    padding: 16,
  },
}); 