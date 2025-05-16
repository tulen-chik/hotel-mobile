import { useCleaningRequest } from '@/contexts/CleaningRequestContext';
import { useReservations } from '@/contexts/ReservationContext';
import { useRooms } from '@/contexts/RoomContext';
import { Reservation } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ReservationsScreen() {
  const { reservations, loading, error, cancel } = useReservations();
  const { getRoom } = useRooms();
  const { createRequest } = useCleaningRequest();
  const router = useRouter();
  const [rooms, setRooms] = useState<Record<string, any>>({});
  const [showCleaningModal, setShowCleaningModal] = useState(false);
  const [showDoorModal, setShowDoorModal] = useState(false);
  const [showLightModal, setShowLightModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [cleaningTime, setCleaningTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [doorLocked, setDoorLocked] = useState(true);
  const [lightsOn, setLightsOn] = useState(false);

  useEffect(() => {
    loadRooms();
  }, [reservations]);

  const loadRooms = async () => {
    const roomsData: Record<string, any> = {};
    for (const reservation of reservations) {
      if (!roomsData[reservation.roomId]) {
        const room = await getRoom(reservation.roomId);
        if (room) {
          roomsData[reservation.roomId] = room;
        }
      }
    }
    setRooms(roomsData);
  };

  const handleCancelReservation = async (reservation: Reservation) => {
    Alert.alert(
      'Отмена бронирования',
      'Вы уверены, что хотите отменить бронирование?',
      [
        { text: 'Нет', style: 'cancel' },
        {
          text: 'Да',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancel(reservation.id);
              Alert.alert('Успех', 'Бронирование отменено');
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось отменить бронирование');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return {
          text: 'Активно',
          color: '#4CAF50',
          icon: 'checkmark-circle',
          bgColor: '#E8F5E9'
        };
      case 'cancelled':
        return {
          text: 'Отменено',
          color: '#F44336',
          icon: 'close-circle',
          bgColor: '#FFEBEE'
        };
      case 'completed':
        return {
          text: 'Завершено',
          color: '#2196F3',
          icon: 'checkmark-done-circle',
          bgColor: '#E3F2FD'
        };
      default:
        return {
          text: status,
          color: '#666',
          icon: 'help-circle',
          bgColor: '#F5F5F5'
        };
    }
  };

  const calculateDuration = (checkIn: Date, checkOut: Date) => {
    const diffTime = Math.abs(new Date(checkOut).getTime() - new Date(checkIn).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isReservationActive = (reservation: Reservation) => {
    const now = new Date();
    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(reservation.checkOut);
    return (
      reservation.status === 'active' && 
      (checkIn <= now && checkOut >= now) || // текущие резервации
      (checkIn > now) // будущие резервации
    );
  };

  const activeReservations = reservations.filter(isReservationActive);

  const handleRequestCleaning = async () => {
    if (!selectedReservation) return;

    try {
      await createRequest(
        selectedReservation.roomId,
        selectedReservation.id,
        'regular',
        `Запрошена уборка на ${cleaningTime.toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit'
        })}`
      );
      setShowCleaningModal(false);
      Alert.alert('Успех', 'Запрос на уборку создан');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось создать запрос на уборку');
    }
  };

  const handleControlDevice = async (device: 'door' | 'light', value: boolean) => {
    try {
      // Здесь будет логика управления устройствами
      if (device === 'door') {
        setDoorLocked(value);
        Alert.alert('Успех', value ? 'Дверь заблокирована' : 'Дверь разблокирована');
      } else {
        setLightsOn(value);
        Alert.alert('Успех', value ? 'Свет включен' : 'Свет выключен');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось управлять устройством');
    }
  };

  const CleaningModal = () => {
    const timeSlots = [
      { label: 'Утро (8:00 - 12:00)', value: new Date().setHours(8, 0, 0, 0) },
      { label: 'День (12:00 - 16:00)', value: new Date().setHours(12, 0, 0, 0) },
      { label: 'Вечер (16:00 - 20:00)', value: new Date().setHours(16, 0, 0, 0) },
    ];

    return (
      <Modal
        visible={showCleaningModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCleaningModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Заказать уборку</Text>
              <TouchableOpacity onPress={() => setShowCleaningModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.cleaningTimeSection}>
              <Text style={styles.sectionTitle}>Выберите удобное время</Text>
              <View style={styles.timeSlotsContainer}>
                {timeSlots.map((slot, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeSlotButton,
                      cleaningTime.getHours() === new Date(slot.value).getHours() && styles.selectedTimeSlot
                    ]}
                    onPress={() => setCleaningTime(new Date(slot.value))}
                  >
                    <Ionicons 
                      name="time-outline" 
                      size={20} 
                      color={cleaningTime.getHours() === new Date(slot.value).getHours() ? "#fff" : "#666"} 
                    />
                    <Text style={[
                      styles.timeSlotText,
                      cleaningTime.getHours() === new Date(slot.value).getHours() && styles.selectedTimeSlotText
                    ]}>
                      {slot.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleRequestCleaning}
            >
              <Text style={styles.confirmButtonText}>Подтвердить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const DoorControlModal = () => (
    <Modal
      visible={showDoorModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowDoorModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Управление дверью</Text>
            <TouchableOpacity onPress={() => setShowDoorModal(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.controlSection}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: doorLocked ? '#E3F2FD' : '#FFEBEE' }]}
              onPress={() => handleControlDevice('door', !doorLocked)}
            >
              <Ionicons 
                name={doorLocked ? "lock-closed" : "lock-open"} 
                size={24} 
                color={doorLocked ? "#2196F3" : "#F44336"} 
              />
              <Text style={[styles.controlButtonText, { color: doorLocked ? "#2196F3" : "#F44336" }]}>
                {doorLocked ? 'Разблокировать дверь' : 'Заблокировать дверь'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const LightControlModal = () => (
    <Modal
      visible={showLightModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowLightModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Управление светом</Text>
            <TouchableOpacity onPress={() => setShowLightModal(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.controlSection}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: lightsOn ? '#E8F5E9' : '#F5F5F5' }]}
              onPress={() => handleControlDevice('light', !lightsOn)}
            >
              <Ionicons 
                name={lightsOn ? "bulb" : "bulb-outline"} 
                size={24} 
                color={lightsOn ? "#4CAF50" : "#666"} 
              />
              <Text style={[styles.controlButtonText, { color: lightsOn ? "#4CAF50" : "#666" }]}>
                {lightsOn ? 'Выключить свет' : 'Включить свет'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

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
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (activeReservations.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#666" />
          <Text style={styles.emptyText}>У вас пока нет активных бронирований</Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.browseButtonText}>Посмотреть номера</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {activeReservations.map((reservation) => {
        const statusInfo = getStatusInfo(reservation.status);
        const duration = calculateDuration(reservation.checkIn, reservation.checkOut);
        const room = rooms[reservation.roomId];

        return (
          <TouchableOpacity
            key={reservation.id}
            style={styles.reservationCard}
            onPress={() => router.push(`/room/${reservation.roomId}`)}
          >
            <View style={styles.reservationHeader}>
              <View style={styles.roomInfo}>
                <Text style={styles.roomNumber}>
                  №{room?.number || '...'}
                </Text>
                <Text style={styles.roomDetails}>
                  {room?.beds} кровати • {room?.rooms} комнаты
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                <Ionicons name={statusInfo.icon as any} size={16} color={statusInfo.color} />
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {statusInfo.text}
                </Text>
              </View>
            </View>

            <View style={styles.datesContainer}>
              <View style={styles.dateItem}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <View style={styles.dateInfo}>
                  <Text style={styles.dateLabel}>Заезд</Text>
                  <Text style={styles.dateValue}>{formatDate(reservation.checkIn)}</Text>
                </View>
              </View>
              <View style={styles.dateDivider} />
              <View style={styles.dateItem}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <View style={styles.dateInfo}>
                  <Text style={styles.dateLabel}>Выезд</Text>
                  <Text style={styles.dateValue}>{formatDate(reservation.checkOut)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.durationContainer}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.durationText}>
                {duration} {duration === 1 ? 'день' : duration < 5 ? 'дня' : 'дней'}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              {reservation.status === 'active' && (
                <>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => {
                      setSelectedReservation(reservation);
                      setShowDoorModal(true);
                    }}
                  >
                    <Ionicons name="lock-closed-outline" size={20} color="#2196F3" />
                    <Text style={styles.controlButtonText}>Управление дверью</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => {
                      setSelectedReservation(reservation);
                      setShowLightModal(true);
                    }}
                  >
                    <Ionicons name="bulb-outline" size={20} color="#4CAF50" />
                    <Text style={styles.controlButtonText}>Управление светом</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => {
                      setSelectedReservation(reservation);
                      setShowCleaningModal(true);
                    }}
                  >
                    <Ionicons name="water-outline" size={20} color="#2196F3" />
                    <Text style={styles.controlButtonText}>Заказать уборку</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.controlButton, styles.cancelButton]}
                    onPress={() => handleCancelReservation(reservation)}
                  >
                    <Ionicons name="close-circle-outline" size={20} color="#d32f2f" />
                    <Text style={styles.cancelButtonText}>Отменить бронирование</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      <CleaningModal />
      <DoorControlModal />
      <LightControlModal />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  error: {
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  reservationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  reservationHeader: {
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
    marginBottom: 4,
  },
  roomDetails: {
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
  datesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
  },
  dateItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  dateDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#dee2e6',
    marginHorizontal: 12,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  durationText: {
    fontSize: 14,
    color: '#666',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 8,
  },
  controlButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
  },
  controlSection: {
    marginBottom: 20,
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#d32f2f',
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
  cleaningTimeSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  timeSlotsContainer: {
    gap: 12,
  },
  timeSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    gap: 12,
  },
  selectedTimeSlot: {
    backgroundColor: '#2196F3',
  },
  timeSlotText: {
    fontSize: 16,
    color: '#666',
  },
  selectedTimeSlotText: {
    color: '#fff',
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
  actionButtons: {
    gap: 8,
  },
}); 