import { DatePicker } from '@/components/DatePicker';
import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useReservations } from '@/contexts/ReservationContext';
import { useRooms } from '@/contexts/RoomContext';
import { isRoomOccupied } from '@/services/rooms';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RoomScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { getRoom, loading: roomLoading } = useRooms();
  const { addReservation, loading: reservationLoading } = useReservations();
  const router = useRouter();
  const [room, setRoom] = useState<any>(null);
  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [isAvailable, setIsAvailable] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [doorLocked, setDoorLocked] = useState(true);
  const [lightsOn, setLightsOn] = useState(false);

  useEffect(() => {
    loadRoom();
  }, [id]);

  useEffect(() => {
    checkAvailability();
  }, [checkIn, checkOut]);

  const loadRoom = async () => {
    try {
      const roomData = await getRoom(id as string);
      setRoom(roomData);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить информацию о номере');
    }
  };

  const checkAvailability = async () => {
    if (!room) return;
    
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
      const reservation = await addReservation({
        roomId: id as string,
        userId: user.uid,
        checkIn,
        checkOut,
      });
      Alert.alert('Успех', 'Номер успешно забронирован');
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


  if (roomLoading) {
    return <LoadingScreen />;
  }

  if (!room) {
    return (
      <View style={styles.container}>
        <Text>Номер не найден</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Номер {room.number}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>{room.description}</Text>
        <Text style={styles.price}>{room.price} ₽/ночь</Text>
        
        <View style={styles.amenities}>
          <Text style={styles.amenitiesTitle}>Удобства:</Text>
          {room.amenities?.map((amenity: string, index: number) => (
            <Text key={index} style={styles.amenity}>• {amenity}</Text>
          ))}
        </View>

        <View style={styles.dateSelection}>
          <Text style={styles.dateSelectionTitle}>Выберите даты:</Text>
          
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

        <View style={styles.actions}>
          {isAvailable && !checkingAvailability && (
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

    </View>
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
  content: {
    padding: 16,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  amenities: {
    marginBottom: 24,
  },
  amenitiesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  amenity: {
    fontSize: 16,
    marginBottom: 4,
  },
  dateSelection: {
    marginBottom: 24,
  },
  dateSelectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  availabilityText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  availableText: {
    color: '#4CAF50',
  },
  notAvailableText: {
    color: '#F44336',
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
    backgroundColor: '#000',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controlButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  controlSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  cleaningButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    gap: 10,
    marginTop: 10,
  },
  cleaningButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  cleaningTimeSection: {
    marginBottom: 20,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    gap: 10,
  },
  timePickerText: {
    fontSize: 16,
    color: '#000',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
}); 