import { useRooms } from '@/contexts/RoomContext';
import { Room } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RoomsScreen() {
  const { rooms, loading, error } = useRooms();
  const router = useRouter();

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
});
