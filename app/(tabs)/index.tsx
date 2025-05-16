import { useRooms } from '@/contexts/RoomContext';
import { Room } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RoomsScreen() {
  const { rooms, loading, error } = useRooms();
  const router = useRouter();


  const renderRoom = ({ item }: { item: Room }) => {

    return (
      <TouchableOpacity
        style={[styles.roomCard, item.isOccupied && styles.occupiedRoom]}
        onPress={() => router.push({ pathname: '/room/[id]' as any, params: { id: item.id } })}
      >
        <View style={styles.roomHeader}>
          <View style={styles.roomInfo}>
            <Text style={[styles.roomNumber, item.isOccupied && styles.textWhite]}>
              №{item.number}
            </Text>
            <View style={styles.roomDetails}>
              <View style={styles.detailItem}>
                <Ionicons 
                  name="bed-outline" 
                  size={16} 
                  color={item.isOccupied ? '#fff' : '#666'} 
                />
                <Text style={[styles.detailText, item.isOccupied && styles.textWhite]}>
                  {item.beds} {item.beds === 1 ? 'кровать' : item.beds < 5 ? 'кровати' : 'кроватей'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons 
                  name="home-outline" 
                  size={16} 
                  color={item.isOccupied ? '#fff' : '#666'} 
                />
                <Text style={[styles.detailText, item.isOccupied && styles.textWhite]}>
                  {item.rooms} {item.rooms === 1 ? 'комната' : item.rooms < 5 ? 'комнаты' : 'комнат'}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: item.isOccupied ? '#000' : '#f8f9fa' }]}>
            <Ionicons
              name={item.isOccupied ? 'person' : 'person-outline'}
              size={16}
              color={item.isOccupied ? '#fff' : '#000'}
            />
            <Text style={[styles.statusText, item.isOccupied && styles.textWhite]}>
              {item.isOccupied ? 'Занято' : 'Свободно'}
            </Text>
          </View>
        </View>

        <View style={styles.cleaningStatus}>
          {item.currentGuest && (
            <View style={styles.guestInfo}>
              <Ionicons name="person-outline" size={16} color={item.isOccupied ? '#fff' : '#666'} />
              <Text style={[styles.guestText, item.isOccupied && styles.textWhite]}>
                {item.currentGuest.name}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
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

  if (rooms.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="bed-outline" size={64} color="#666" />
          <Text style={styles.emptyText}>Нет доступных номеров</Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={rooms}
      renderItem={renderRoom}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  roomCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  occupiedRoom: {
    backgroundColor: '#000',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  roomInfo: {
    flex: 1,
  },
  roomNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roomDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cleaningStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cleaningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  cleaningText: {
    fontSize: 14,
    fontWeight: '500',
  },
  guestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guestText: {
    fontSize: 14,
    color: '#666',
  },
  textWhite: {
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    padding: 16,
  },
});
