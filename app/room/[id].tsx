import { DatePicker } from '@/components/DatePicker';
import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useReservations } from '@/contexts/ReservationContext';
import { useRooms } from '@/contexts/RoomContext';
import { isRoomOccupied } from '@/services/rooms';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const paymentStyles = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.25)', justifyContent:'center', alignItems:'center' },
  modal: { backgroundColor:'#fff', borderRadius:28, width:'92%', padding:22, shadowColor:'#6924cc', shadowOpacity:0.12, shadowRadius:16, elevation:8 },
  card: { backgroundColor:'#ede7f6', borderRadius:18, padding:18, alignItems:'center', marginBottom:18, shadowColor:'#6924cc', shadowOpacity:0.06, shadowRadius:8, elevation:2 },
  location: { color:'#aaa', fontSize:15, marginBottom:4 },
  price: { fontSize:26, fontWeight:'bold', color:'#6924cc', marginBottom:2 },
  infoBlock: { backgroundColor:'#fafafa', borderRadius:14, padding:14, marginBottom:14, shadowColor:'#6924cc', shadowOpacity:0.04, shadowRadius:4, elevation:1 },
  infoRow: { flexDirection:'row', justifyContent:'space-between', marginBottom:7 },
  label: { color:'#aaa', fontSize:13 },
  paymentRow: { flexDirection:'row', alignItems:'center', backgroundColor:'#ede7f6', borderRadius:12, padding:10, marginBottom:14 },
  confirmBtn: { backgroundColor:'#6924cc', borderRadius:14, padding:16, alignItems:'center', marginBottom:10, shadowColor:'#6924cc', shadowOpacity:0.12, shadowRadius:8, elevation:2 },
  confirmText: { color:'#fff', fontWeight:'bold', fontSize:17, letterSpacing:0.5 },
  closeBtn: { alignItems:'center', marginTop:2 },
  input: {
    borderWidth: 1,
    borderColor: '#ede7f6',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    color: '#222',
    shadowColor: '#6924cc',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
}); 

const PaymentModal = ({ visible, onClose, onConfirm, price, nights, currency }: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  price: number;
  nights: number;
  currency: string;
}) => {
  const offer = 0.05;
  const total = price * nights;
  const discount = total * offer;
  const final = total - discount;
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const isValid =
    cardNumber.replace(/\s/g, '').length === 16 &&
    cardName.trim().length > 0 &&
    /^\d{2}\/\d{2}$/.test(expiry) &&
    cvc.length === 3;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={paymentStyles.overlay}>
        <View style={paymentStyles.modal}>
          <View style={paymentStyles.card}>
            <Text style={paymentStyles.location}>Florida, USA <Text style={{fontSize: 14}}>⭐ 4.8</Text></Text>
            <Text style={paymentStyles.price}>{currency}{price}/night</Text>
          </View>
          <View style={paymentStyles.infoBlock}>
            <View style={paymentStyles.infoRow}><Text style={paymentStyles.label}>Check in</Text><Text>May 19, 2022</Text></View>
            <View style={paymentStyles.infoRow}><Text style={paymentStyles.label}>Check out</Text><Text>May 19, 2022</Text></View>
            <View style={paymentStyles.infoRow}><Text style={paymentStyles.label}>Guest</Text><Text>2</Text></View>
          </View>
          <View style={paymentStyles.infoBlock}>
            <View style={paymentStyles.infoRow}><Text>5 Nights</Text><Text>{currency}{total.toFixed(2)}</Text></View>
            <View style={paymentStyles.infoRow}><Text style={{color:'#aaa'}}>Offers (5%)</Text><Text style={{color:'#aaa'}}>{currency}{discount.toFixed(2)}</Text></View>
            <View style={paymentStyles.infoRow}><Text style={{fontWeight:'bold'}}>Total</Text><Text style={{fontWeight:'bold'}}>{currency}{final.toFixed(2)}</Text></View>
          </View>
          <View style={paymentStyles.paymentRow}>
            <Image source={{uri:'https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png'}} style={{width:40,height:24,marginRight:8}} />
            <Text style={{flex:1}}>Mastercard</Text>
            <TouchableOpacity><Text style={{color:'#6924cc'}}>Change</Text></TouchableOpacity>
          </View>
          <View style={{marginBottom:12}}>
            <TextInput
              style={paymentStyles.input}
              placeholder="Card Number"
              keyboardType="numeric"
              maxLength={19}
              value={cardNumber}
              onChangeText={text => setCardNumber(text.replace(/[^0-9]/g, '').replace(/(.{4})/g, '$1 ').trim())}
            />
            <TextInput
              style={paymentStyles.input}
              placeholder="Cardholder Name"
              value={cardName}
              onChangeText={setCardName}
              autoCapitalize="words"
            />
            <View style={{flexDirection:'row', gap:8}}>
              <TextInput
                style={[paymentStyles.input, {flex:0.8, width:50}]}
                placeholder="MM/YY"
                value={expiry}
                onChangeText={setExpiry}
                maxLength={5}
                keyboardType="numeric"
              />
              <TextInput
                style={[paymentStyles.input, {flex:0.8, width:80}]}
                placeholder="CVC"
                value={cvc}
                onChangeText={setCvc}
                maxLength={3}
                keyboardType="numeric"
                secureTextEntry
              />
            </View>
          </View>
          <TouchableOpacity style={[paymentStyles.confirmBtn, {opacity: isValid ? 1 : 0.5}]} onPress={isValid ? onConfirm : undefined} disabled={!isValid}>
            <Text style={paymentStyles.confirmText}>Confirm Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={paymentStyles.closeBtn} onPress={onClose}>
            <Text style={{color:'#aaa'}}>Отмена</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

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
  const [showPayment, setShowPayment] = useState(false);

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

  const handleBookRoom = () => {
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
    setShowPayment(true);
  };

  const handlePaymentConfirm = async () => {
    setShowPayment(false);
    if (!user) return;
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
    <SafeAreaView style={{flex:1, backgroundColor:'#fff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 32 : 16}}>
      <ScrollView style={styles.container} contentContainerStyle={{paddingBottom:32}}>
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
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{room.price.perNight} {room.price.currency}</Text>
            <Text style={styles.priceLabel}>за ночь</Text>
          </View>

          <Text style={styles.description}>{room.description}</Text>

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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Дополнительная информация</Text>
            <View style={styles.additionalInfo}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="square-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>{room.additionalInfo?.area || 0} м²</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="people-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>до {room.additionalInfo?.maxGuests || 2} гостей</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons 
                    name={room.additionalInfo?.view === 'sea' ? 'water-outline' : 
                          room.additionalInfo?.view === 'mountain' ? 'image-outline' :
                          room.additionalInfo?.view === 'garden' ? 'leaf-outline' : 'business-outline'} 
                    size={20} 
                    color="#666" 
                  />
                  <Text style={styles.infoText}>
                    {room.additionalInfo?.view === 'sea' ? 'Вид на море' :
                     room.additionalInfo?.view === 'mountain' ? 'Вид на горы' :
                     room.additionalInfo?.view === 'garden' ? 'Вид на сад' : 'Вид на город'}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="bed" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    {room.additionalInfo?.bedType === 'king' ? 'King-size кровать' :
                     room.additionalInfo?.bedType === 'twin' ? 'Две односпальные кровати' :
                     room.additionalInfo?.bedType === 'single' ? 'Односпальная кровать' : 'Двуспальная кровать'}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons 
                    name={room.additionalInfo?.bathroomType === 'private' ? 'water' : 'water-outline'} 
                    size={20} 
                    color="#666" 
                  />
                  <Text style={styles.infoText}>
                    {room.additionalInfo?.bathroomType === 'private' ? 'Собственная ванная' : 'Общая ванная'}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="business-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>{room.additionalInfo?.floor || 1} этаж</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Удобства</Text>
            <View style={styles.amenities}>
              {room.additionalInfo?.amenities?.map((amenity: string, index: number) => (
                <View key={index} style={styles.amenityBadge}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              )) || (
                <Text style={styles.amenityText}>Нет доступных удобств</Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Правила</Text>
            <View style={styles.rules}>
              <View style={styles.ruleItem}>
                <Ionicons 
                  name={room.additionalInfo?.smokingAllowed ? 'checkmark-circle' : 'close-circle'} 
                  size={20} 
                  color={room.additionalInfo?.smokingAllowed ? '#4CAF50' : '#F44336'} 
                />
                <Text style={styles.ruleText}>
                  {room.additionalInfo?.smokingAllowed ? 'Разрешено курение' : 'Курение запрещено'}
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Ionicons 
                  name={room.additionalInfo?.petsAllowed ? 'checkmark-circle' : 'close-circle'} 
                  size={20} 
                  color={room.additionalInfo?.petsAllowed ? '#4CAF50' : '#F44336'} 
                />
                <Text style={styles.ruleText}>
                  {room.additionalInfo?.petsAllowed ? 'Разрешены питомцы' : 'Питомцы запрещены'}
                </Text>
              </View>
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

        <PaymentModal
          visible={showPayment}
          onClose={() => setShowPayment(false)}
          onConfirm={handlePaymentConfirm}
          price={room.price.perNight}
          nights={Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000*60*60*24)))}
          currency={room.price.currency}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  roomImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#ede7f6',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 12,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
    gap: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5d3472',
    marginRight: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: '#888',
    marginLeft: 2,
    marginBottom: 2,
  },
  description: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 18,
  },
  roomInfo: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  infoText: {
    fontSize: 13,
    color: '#5d3472',
    textAlign: 'center',
    marginTop: 4,
  },
  dateSelection: {
    marginBottom: 24,
  },
  dateSelectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
  },
  availabilityText: {
    fontSize: 15,
    marginTop: 12,
  },
  notAvailableText: {
    color: '#ff3b30',
  },
  availableText: {
    color: '#34c759',
  },
  actions: {
    gap: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: '#5d3472',
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  bookButton: {
    backgroundColor: '#5d3472',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
  },
  additionalInfo: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  amenityBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  amenityText: {
    fontSize: 13,
    color: '#5d3472',
    marginTop: 2,
  },
  rules: {
    gap: 12,
    flexDirection: 'row',
    marginBottom: 8,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleText: {
    fontSize: 14,
    color: '#333',
  },
}); 