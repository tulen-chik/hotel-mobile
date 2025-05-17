import { DatePicker } from '@/components/DatePicker';
import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useReservations } from '@/contexts/ReservationContext';
import { useRooms } from '@/contexts/RoomContext';
import { isRoomOccupied } from '@/services/rooms';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RoomScreen() {
  const { id } = useLocalSearchParams();
  const { user, isCleaner } = useAuth();
  const { getRoom, loading: roomLoading } = useRooms();
  const { addReservation, loading: reservationLoading } = useReservations();
  const router = useRouter();
  const [room, setRoom] = useState<any>(null);
  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [isAvailable, setIsAvailable] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [doorLocked, setDoorLocked] = useState(true);
  const [lightsOn, setLightsOn] = useState(false);

  useEffect(() => {
    loadRoom();
  }, [id]);

  useEffect(() => {
    if (!isCleaner) {
      checkAvailability();
    }
  }, [checkIn, checkOut, isCleaner]);

  const loadRoom = async () => {
    try {
      const roomData = await getRoom(id as string);
      setRoom(roomData);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить информацию о номере');
    }
  };

  const checkAvailability = async () => {
    if (!room || isCleaner) return;
    
    setCheckingAvailability(true);
    try {
      const occupied = await isRoomOccupied(id as string, checkIn, checkOut).then((res) => {
        console.log('occupied', res);
        setIsAvailable(!res);
        return res;
      });
    } catch (error) {
      console.error('Error checking availability:', error);
      setIsAvailable(false);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleBookRoom = async () => {
    if (isCleaner) {
      Alert.alert('Ошибка', 'Уборщики не могут бронировать номера');
      return;
    }

    if (!user) {
      Alert.alert(
        'Требуется авторизация',
        'Для бронирования номера необходимо войти в систему',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Войти', onPress: () => router.push('/(auth)/login') }
        ]
      );
      return;
    }

    if (checkIn >= checkOut) {
      Alert.alert('Ошибка', 'Дата выезда должна быть позже даты заезда');
      return;
    }

    try {
      await addReservation({
        userId: user.uid,
        roomId: room.id,
        checkIn,
        checkOut,
      });
      Alert.alert('Успех', 'Номер успешно забронирован');
      router.back();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось забронировать номер');
    }
  };

  const handleControlDevice = async (device: 'door' | 'lights') => {
    if (!user) {
      Alert.alert('Ошибка', 'Необходимо войти в систему');
      return;
    }

    try {
      if (device === 'door') {
        setDoorLocked(!doorLocked);
        // Здесь будет API вызов для управления дверью
        Alert.alert('Успех', `Дверь ${doorLocked ? 'разблокирована' : 'заблокирована'}`);
      } else {
        setLightsOn(!lightsOn);
        // Здесь будет API вызов для управления светом
        Alert.alert('Успех', `Свет ${lightsOn ? 'выключен' : 'включен'}`);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось управлять устройством');
    }
  };

  if (roomLoading || !room) {
    return <LoadingScreen />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Номер {room.number}</Text>
      </View>

      {room.imageUrl ? (
        <Image 
          source={{ uri: room.imageUrl }} 
          style={styles.roomImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.roomImage, styles.placeholderImage]}>
          <Ionicons name="bed-outline" size={64} color="#666" />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.roomInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="bed-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {room.beds} {room.beds === 1 ? 'кровать' : room.beds < 5 ? 'кровати' : 'кроватей'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="home-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {room.rooms} {room.rooms === 1 ? 'комната' : room.rooms < 5 ? 'комнаты' : 'комнат'}
            </Text>
          </View>
        </View>

        {!isCleaner && (
          <View style={styles.dateSelection}>
            <Text style={styles.dateSelectionTitle}>Выберите даты</Text>
            <DatePicker
              label="Дата заезда"
              value={checkIn}
              onChange={(date) => {
                setCheckIn(date);
                if (checkOut <= date) {
                  const nextDay = new Date(date);
                  nextDay.setDate(nextDay.getDate() + 1);
                  setCheckOut(nextDay);
                }
              }}
              minimumDate={new Date()}
            />
            <DatePicker
              label="Дата выезда"
              value={checkOut}
              onChange={setCheckOut}
              minimumDate={checkIn}
            />
            {checkingAvailability ? (
              <Text style={styles.availabilityText}>Проверка доступности...</Text>
            ) : !isAvailable ? (
              <Text style={[styles.availabilityText, styles.notAvailableText]}>
                Номер занят на выбранные даты
              </Text>
            ) : (
              <Text style={[styles.availabilityText, styles.availableText]}>
                Номер доступен для бронирования
              </Text>
            )}
          </View>
        )}

        <View style={styles.actions}>
          {!isCleaner && isAvailable && (
            <TouchableOpacity
              style={[styles.button, styles.bookButton]}
              onPress={handleBookRoom}
              disabled={reservationLoading}
            >
              <Text style={styles.buttonText}>
                {reservationLoading ? 'Бронирование...' : 'Забронировать'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
  roomImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  roomInfo: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
  },
  dateSelection: {
    marginBottom: 24,
  },
  dateSelectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  availabilityText: {
    fontSize: 16,
    marginTop: 16,
  },
  notAvailableText: {
    color: '#ff3b30',
  },
  availableText: {
    color: '#34c759',
  },
  actions: {
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButton: {
    backgroundColor: '#007aff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 