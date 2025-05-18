import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useKitchen } from '../../contexts/KitchenContext';
import { useRooms } from '../../contexts/RoomContext';
import { useRoomService } from '../../contexts/RoomServiceContext';
import { MenuItem } from '../../services/kitchen';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;

const categories = ['Все', 'Основные блюда', 'Закуски', 'Десерты', 'Напитки'];

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export default function MenuScreen() {
  const { menuItems, loading: menuLoading, fetchMenuItems, fetchMenuItemsByCategory } = useKitchen();
  const { createOrder, loading: orderLoading, orders, fetchOrdersByUser } = useRoomService();
  const { user } = useAuth();
  const { rooms, loading: roomsLoading } = useRooms();
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('menu');
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (user && rooms.length > 0) {
      const userRoom = rooms.find(room => room.currentGuest?.uid === user.uid);
      if (userRoom) {
        setCurrentRoom(userRoom.id);
      }
    }
  }, [user, rooms]);

  useEffect(() => {
    if (user) {
      fetchOrdersByUser(user.uid);
    }
  }, [user]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    if (category === 'Все') {
      fetchMenuItems();
    } else {
      fetchMenuItemsByCategory(category);
    }
  };

  const addToCart = (menuItem: MenuItem) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.menuItem.id === menuItem.id);
      if (existingItem) {
        return prev.map(item =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => prev.filter(item => item.menuItem.id !== menuItemId));
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(menuItemId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.menuItem.id === menuItemId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  };

  const handleOrder = async () => {
    if (!user || !currentRoom) {
      Alert.alert('Error', 'User or room information is missing');
      return;
    }

    if (cart.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    try {
      await createOrder({
        userId: user.uid,
        roomId: currentRoom,
        items: cart.map(item => ({
          menuItemId: item.menuItem.id!,
          name: item.menuItem.name,
          quantity: item.quantity,
          price: item.menuItem.price
        })),
        totalAmount: calculateTotal(),
        status: 'pending',
        notes
      });

      Alert.alert('Success', 'Your order has been placed');
      setCart([]);
      setNotes('');
    } catch (error) {
      Alert.alert('Error', 'Failed to place order');
    }
  };

  const showCart = () => {
    setIsCartVisible(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const hideCart = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsCartVisible(false));
  };

  const renderCartModal = () => {
    const translateY = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [height, 0],
    });

    return (
      <Modal
        visible={isCartVisible}
        transparent
        animationType="none"
        onRequestClose={hideCart}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={hideCart}
        >
          <Animated.View
            style={[
              styles.cartModal,
              {
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={styles.cartHeader}>
              <Text style={styles.cartTitle}>Ваш заказ</Text>
              <TouchableOpacity onPress={hideCart} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {cart.length > 0 ? (
              <>
                <ScrollView style={styles.cartItems}>
                  {cart.map(renderCartItem)}
                </ScrollView>
                <View style={styles.orderDetails}>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="Добавьте примечания к заказу..."
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                  />
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalText}>Итого:</Text>
                    <Text style={styles.totalAmount}>{calculateTotal().toFixed(2)} ₽</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.orderButton, orderLoading && styles.orderButtonDisabled]}
                    onPress={handleOrder}
                    disabled={orderLoading}
                  >
                    <Text style={styles.orderButtonText}>
                      {orderLoading ? 'Оформление...' : 'Оформить заказ'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.emptyCart}>Корзина пуста</Text>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <View style={styles.menuItem}>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.menuItemImage} />
      )}
      <View style={styles.menuItemInfo}>
        <Text style={styles.menuItemName}>{item.name}</Text>
        <Text style={styles.menuItemDescription}>{item.description}</Text>
        <View style={styles.menuItemDetails}>
          <Text style={styles.menuItemPrice}>{item.price.toFixed(2)} ₽</Text>
          <Text style={styles.menuItemTime}>{item.preparationTime} мин</Text>
        </View>
        <View style={[styles.availabilityBadge, { backgroundColor: item.isAvailable ? '#E8F5E9' : '#FFEBEE' }]}>
          <Text style={[styles.availabilityText, { color: item.isAvailable ? '#2E7D32' : '#C62828' }]}>
            {item.isAvailable ? 'Доступно' : 'Недоступно'}
          </Text>
        </View>
        {item.isAvailable && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addToCart(item)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#6200EA" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderCartItem = (item: CartItem) => (
    <View key={item.menuItem.id} style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.menuItem.name}</Text>
        <Text style={styles.cartItemPrice}>{(item.menuItem.price * item.quantity).toFixed(2)} ₽</Text>
      </View>
      <View style={styles.quantityControls}>
        <TouchableOpacity
          onPress={() => updateQuantity(item.menuItem.id!, item.quantity - 1)}
          style={styles.quantityButton}
        >
          <Ionicons name="remove-circle-outline" size={24} color="#6200EA" />
        </TouchableOpacity>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <TouchableOpacity
          onPress={() => updateQuantity(item.menuItem.id!, item.quantity + 1)}
          style={styles.quantityButton}
        >
          <Ionicons name="add-circle-outline" size={24} color="#6200EA" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOrder = (order: any) => (
    <View key={order.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderDate}>
          {new Date(order.createdAt).toLocaleString('ru-RU')}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        {order.items.map((item: any, index: number) => (
          <View key={index} style={styles.orderItem}>
            <Text style={styles.itemName}>
              {item.quantity}x {item.name}
            </Text>
            <Text style={styles.itemPrice}>
              {(item.price * item.quantity).toFixed(2)} ₽
            </Text>
          </View>
        ))}
      </View>

      {order.notes && (
        <View style={styles.notesContainer}>
          <Ionicons name="chatbubble-outline" size={16} color="#666" />
          <Text style={styles.notesText}>{order.notes}</Text>
        </View>
      )}

      <View style={styles.orderFooter}>
        <Text style={styles.totalText}>Итого:</Text>
        <Text style={styles.totalAmount}>{order.totalAmount.toFixed(2)} ₽</Text>
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#6200EA';
      case 'preparing':
        return '#7B1FA2';
      case 'delivering':
        return '#9C27B0';
      case 'completed':
        return '#4A148C';
      case 'cancelled':
        return '#C62828';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ожидает';
      case 'preparing':
        return 'Готовится';
      case 'delivering':
        return 'Доставляется';
      case 'completed':
        return 'Завершен';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

  if (menuLoading || roomsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EA" />
      </View>
    );
  }

  if (!currentRoom) {
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
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'menu' && styles.activeTab]}
          onPress={() => setActiveTab('menu')}
        >
          <Text style={[styles.tabText, activeTab === 'menu' && styles.activeTabText]}>
            Меню
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
            Заказы
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'menu' ? (
        <>
          <View style={styles.categoriesContainer}>
            <FlatList
              horizontal
              data={categories}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    selectedCategory === item && styles.selectedCategory,
                  ]}
                  onPress={() => handleCategorySelect(item)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === item && styles.selectedCategoryText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
            />
          </View>

          <View style={styles.contentContainer}>
            <FlatList
              data={menuItems}
              renderItem={renderMenuItem}
              keyExtractor={(item) => item.id!}
              contentContainerStyle={styles.menuList}
            />

            {cart.length > 0 && (
              <TouchableOpacity
                style={styles.cartButton}
                onPress={showCart}
              >
                <View style={styles.cartButtonContent}>
                  <Ionicons name="cart" size={24} color="#fff" />
                  <Text style={styles.cartButtonText}>
                    {cart.length} {cart.length === 1 ? 'товар' : 'товара'} • {calculateTotal().toFixed(2)} ₽
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <ScrollView style={styles.ordersContainer}>
          {orders.length === 0 ? (
            <Text style={styles.emptyText}>Нет заказов</Text>
          ) : (
            orders.map(renderOrder)
          )}
        </ScrollView>
      )}

      {renderCartModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#C62828',
    textAlign: 'center',
    fontSize: 16,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6200EA',
  },
  tabText: {
    fontSize: isSmallScreen ? 14 : 16,
    color: '#666',
  },
  activeTabText: {
    color: '#6200EA',
    fontWeight: '600',
  },
  categoriesContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  categoryButton: {
    paddingHorizontal: isSmallScreen ? 12 : 20,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  selectedCategory: {
    backgroundColor: '#6200EA',
  },
  categoryText: {
    color: '#333',
    fontSize: isSmallScreen ? 12 : 14,
  },
  selectedCategoryText: {
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  menuList: {
    padding: 12,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  menuItemImage: {
    width: isSmallScreen ? 80 : 100,
    height: isSmallScreen ? 80 : 100,
    borderRadius: 8,
    marginRight: 12,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#666',
    marginBottom: 8,
  },
  menuItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  menuItemPrice: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: 'bold',
    color: '#6200EA',
  },
  menuItemTime: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#666',
  },
  availabilityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  availabilityText: {
    fontSize: isSmallScreen ? 10 : 12,
  },
  addButton: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  cartContainer: {
    width: isSmallScreen ? 280 : 300,
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#6200EA',
  },
  cartItems: {
    maxHeight: height * 0.4,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  cartItemName: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#6200EA',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 4,
  },
  quantityButton: {
    padding: 4,
  },
  quantity: {
    fontSize: isSmallScreen ? 14 : 16,
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  orderDetails: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#F8F8F8',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    minHeight: 80,
    fontSize: isSmallScreen ? 14 : 16,
    backgroundColor: '#fff',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  totalText: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: 'bold',
    color: '#6200EA',
  },
  orderButton: {
    backgroundColor: '#6200EA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  orderButtonDisabled: {
    opacity: 0.5,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
  },
  emptyCart: {
    textAlign: 'center',
    color: '#666',
    fontSize: isSmallScreen ? 14 : 16,
    marginTop: 32,
    padding: 20,
  },
  ordersContainer: {
    flex: 1,
    padding: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: isSmallScreen ? 14 : 16,
    marginTop: 24,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderDate: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: isSmallScreen ? 10 : 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  itemsContainer: {
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: isSmallScreen ? 14 : 16,
    flex: 1,
  },
  itemPrice: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '500',
    color: '#6200EA',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesText: {
    marginLeft: 8,
    fontSize: isSmallScreen ? 12 : 14,
    color: '#666',
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  cartModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: height * 0.8,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cartTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: 'bold',
    color: '#6200EA',
  },
  closeButton: {
    padding: 4,
  },
  cartButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#6200EA',
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cartButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartButtonText: {
    color: '#fff',
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  browseButton: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: "# 6200 EA" },
  browseButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});