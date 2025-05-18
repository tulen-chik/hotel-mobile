import { useRooms } from '@/contexts/RoomContext';
import { Room } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  from: 'user' | 'bot';
}

const quickReplies = [
  { label: 'Заказать номер', value: 'Я хочу заказать номер' },
  { label: 'Связаться с поддержкой', value: 'Связаться с поддержкой' },
  { label: 'Цены', value: 'Какие цены?' },
];

interface DeepSeekModalProps {
  visible: boolean;
  onClose: () => void;
  onOpen: () => void;
}

function DeepSeekModal({ visible, onClose, onOpen }: DeepSeekModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Здравствуйте! Чем могу помочь?', from: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const DEEPSEEK_API_KEY = 'sk-0f39de11eefe408c9c9600489ce34a86';

  const sendMessage = async (msg?: string) => {
    const text = msg ?? input;
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), text, from: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: text }
          ],
          stream: false
        }),
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: data.choices?.[0]?.message?.content || 'Нет ответа', from: 'bot' }
      ]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: 'Ошибка связи с поддержкой.', from: 'bot' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) {
    return (
      <TouchableOpacity style={styles.fab} onPress={onOpen} activeOpacity={0.8}>
        <Text style={styles.fabText}>💬</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.modal}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[styles.message, item.from === 'user' ? styles.user : styles.bot]}>
              <Text style={styles.text}>{item.text}</Text>
            </View>
          )}
          style={styles.list}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
        <View style={styles.quickReplies}>
          {quickReplies.map(qr => (
            <TouchableOpacity
              key={qr.value}
              style={styles.quickReplyButton}
              onPress={() => sendMessage(qr.value)}
              disabled={loading}
            >
              <Text style={styles.quickReplyText}>{qr.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Введите сообщение..."
            editable={!loading}
          />
          <TouchableOpacity onPress={() => sendMessage()} style={styles.sendButton} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Отправить</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function RoomsScreen() {
  const { rooms, loading, error } = useRooms();
  const router = useRouter();
  const [isChatVisible, setIsChatVisible] = useState(false);

  const renderRoom = ({ item }: { item: Room }) => {
    return (
      <TouchableOpacity
        style={[styles.roomCard, item.isOccupied && styles.occupiedRoom]}
        onPress={() => router.push({ pathname: '/room/[id]' as any, params: { id: item.id } })}
      >
        {item.imageUrl ? (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.roomImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.roomImage, styles.placeholderImage]}>
            <Ionicons name="bed-outline" size={32} color={item.isOccupied ? '#fff' : '#666'} />
          </View>
        )}
        <View style={styles.roomContent}>
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
            <View style={styles.priceContainer}>
              <Text style={[styles.price, item.isOccupied && styles.textWhite]}>
                {item.price.perNight} {item.price.currency}
              </Text>
              <Text style={[styles.priceLabel, item.isOccupied && styles.textWhite]}>
                за ночь
              </Text>
            </View>
          </View>

          <Text style={[styles.description, item.isOccupied && styles.textWhite]}>
            {item.description}
          </Text>

          <View style={styles.additionalInfo}>
            <View style={styles.infoItem}>
              <Ionicons 
                name="square-outline" 
                size={16} 
                color={item.isOccupied ? '#fff' : '#666'} 
              />
              <Text style={[styles.infoText, item.isOccupied && styles.textWhite]}>
                {item.additionalInfo.area} м²
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons 
                name="people-outline" 
                size={16} 
                color={item.isOccupied ? '#fff' : '#666'} 
              />
              <Text style={[styles.infoText, item.isOccupied && styles.textWhite]}>
                до {item.additionalInfo.maxGuests} гостей
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons 
                name={item.additionalInfo.view === 'sea' ? 'water-outline' : 
                      item.additionalInfo.view === 'mountain' ? 'image-outline' :
                      item.additionalInfo.view === 'garden' ? 'leaf-outline' : 'business-outline'} 
                size={16} 
                color={item.isOccupied ? '#fff' : '#666'} 
              />
              <Text style={[styles.infoText, item.isOccupied && styles.textWhite]}>
                {item.additionalInfo.view === 'sea' ? 'Вид на море' :
                 item.additionalInfo.view === 'mountain' ? 'Вид на горы' :
                 item.additionalInfo.view === 'garden' ? 'Вид на сад' : 'Вид на город'}
              </Text>
            </View>
          </View>

          <View style={styles.roomFeatures}>
            <View style={styles.featureItem}>
              <Ionicons 
                name={item.additionalInfo.bedType === 'king' ? 'bed' : 
                      item.additionalInfo.bedType === 'twin' ? 'bed-outline' :
                      item.additionalInfo.bedType === 'single' ? 'bed-outline' : 'bed'} 
                size={16} 
                color={item.isOccupied ? '#fff' : '#666'} 
              />
              <Text style={[styles.featureText, item.isOccupied && styles.textWhite]}>
                {item.additionalInfo.bedType === 'king' ? 'King-size кровать' :
                 item.additionalInfo.bedType === 'twin' ? 'Две односпальные кровати' :
                 item.additionalInfo.bedType === 'single' ? 'Односпальная кровать' : 'Двуспальная кровать'}
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons 
                name={item.additionalInfo.bathroomType === 'private' ? 'water' : 'water-outline'} 
                size={16} 
                color={item.isOccupied ? '#fff' : '#666'} 
              />
              <Text style={[styles.featureText, item.isOccupied && styles.textWhite]}>
                {item.additionalInfo.bathroomType === 'private' ? 'Собственная ванная' : 'Общая ванная'}
              </Text>
            </View>
            {item.additionalInfo.smokingAllowed && (
              <View style={styles.featureItem}>
                <Ionicons name="flame" size={16} color={item.isOccupied ? '#fff' : '#666'} />
                <Text style={[styles.featureText, item.isOccupied && styles.textWhite]}>
                  Разрешено курение
                </Text>
              </View>
            )}
            {item.additionalInfo.petsAllowed && (
              <View style={styles.featureItem}>
                <Ionicons name="paw" size={16} color={item.isOccupied ? '#fff' : '#666'} />
                <Text style={[styles.featureText, item.isOccupied && styles.textWhite]}>
                  Разрешены питомцы
                </Text>
              </View>
            )}
          </View>

          <View style={styles.amenities}>
            {item.additionalInfo?.amenities?.map((amenity, index) => (
              <View key={index} style={styles.amenityBadge}>
                <Text style={[styles.amenityText, item.isOccupied && styles.textWhite]}>
                  {amenity}
                </Text>
              </View>
            ))}
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
    <View style={styles.container}>
      <FlatList
        data={rooms}
        renderItem={renderRoom}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
      <DeepSeekModal
        visible={isChatVisible}
        onClose={() => setIsChatVisible(false)}
        onOpen={() => setIsChatVisible(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  occupiedRoom: {
    backgroundColor: '#000',
  },
  roomImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomContent: {
    padding: 20,
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
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  additionalInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  amenityBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  amenityText: {
    fontSize: 12,
    color: '#666',
  },
  cleaningStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  roomFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
  },
  overlay: {
    position: 'absolute',
    bottom: 24,
    right: 6,
    zIndex: 1000,
    width: width * 0.9,
    maxWidth: 300,
    alignItems: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: 300,
    maxHeight: 420,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    padding: 4,
  },
  closeText: {
    fontSize: 24,
    color: '#6200EA',
    fontWeight: 'bold',
  },
  list: { 
    flexGrow: 0, 
    marginBottom: 8, 
    marginTop: 28 
  },
  message: { 
    padding: 10, 
    borderRadius: 8, 
    marginVertical: 4, 
    maxWidth: '80%' 
  },
  user: { 
    alignSelf: 'flex-end', 
    backgroundColor: '#e1d7f3' 
  },
  bot: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#f1f1f1' 
  },
  text: { 
    fontSize: 15 
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginRight: 2,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 2,
  },
  sendButton: {
    backgroundColor: '#6200EA',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  quickReplies: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginBottom: 8, 
    gap: 8 
  },
  quickReplyButton: { 
    backgroundColor: '#eee', 
    borderRadius: 16, 
    paddingVertical: 6, 
    paddingHorizontal: 14, 
    marginRight: 8, 
    marginBottom: 4 
  },
  quickReplyText: { 
    color: '#6200EA', 
    fontWeight: 'bold' 
  },
  fab: {
    position: 'absolute',
    bottom: 65,
    right: 12,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6200EA',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 32,
  },
});
