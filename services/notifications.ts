import { Notification, Reservation, User } from '@/types';
import { get, onValue, push, ref, remove, set, update } from 'firebase/database';
import { db } from './firebase/config';

// Сохранить push-токен пользователя
export async function savePushToken(userId: string, token: string) {
  const userRef = ref(db, `users/${userId}`);
  await update(userRef, { pushToken: token });
}

// Добавить уведомление
export async function addNotification(notification: Omit<Notification, 'id' | 'createdAt'>) {
  const notificationsRef = ref(db, 'notifications');
  const newNotificationRef = push(notificationsRef);
  const notificationId = newNotificationRef.key!;
  
  const newNotification: Notification = {
    id: notificationId,
    ...notification,
    createdAt: new Date(),
    read: false,
  };
  
  await set(newNotificationRef, newNotification);
  return notificationId;
}

// Отметить уведомление как прочитанное
export async function markNotificationAsRead(notificationId: string) {
  const notifRef = ref(db, `notifications/${notificationId}`);
  await update(notifRef, { read: true });
}

// Удалить уведомление
export async function deleteNotification(notificationId: string) {
  const notifRef = ref(db, `notifications/${notificationId}`);
  await remove(notifRef);
}

type NotificationType = 'cleaning' | 'reservation' | 'system';

interface NotificationData {
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, any>;
}

export async function sendNotification(
  userIds: string[],
  notification: NotificationData
) {
  try {
    // Получаем информацию о пользователях
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) return;

    const usersData = snapshot.val();
    const users = Object.entries(usersData)
      .filter(([id]) => userIds.includes(id))
      .map(([id, data]: [string, any]) => ({
        id,
        ...data
      })) as User[];

    // Отправляем push-уведомления
    const pushTokens = users
      .filter(user => user.settings.pushNotifications && user.pushToken)
      .map(user => user.pushToken!);

    if (pushTokens.length > 0) {
      await sendPushNotifications(pushTokens, notification);
    }

    // Отправляем email-уведомления
    const emailUsers = users.filter(user => user.settings.emailNotifications);
    if (emailUsers.length > 0) {
      await sendEmailNotifications(emailUsers, notification);
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
    throw error;
  }
}

async function sendPushNotifications(
  tokens: string[],
  notification: NotificationData
) {
  try {
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data,
    }));

    // Отправляем уведомления через Expo Push Notification Service
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      throw new Error('Failed to send push notifications');
    }
  } catch (error) {
    console.error('Error sending push notifications:', error);
    throw error;
  }
}

async function sendEmailNotifications(
  users: User[],
  notification: NotificationData
) {
  try {
    // Здесь должна быть интеграция с вашим email-сервисом
    // Например, SendGrid, AWS SES, или другой
    const emails = users.map(user => user.email);
    
    // Пример отправки через API вашего email-сервиса
    const response = await fetch('YOUR_EMAIL_SERVICE_API_ENDPOINT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY',
      },
      body: JSON.stringify({
        to: emails,
        subject: notification.title,
        text: notification.body,
        html: `<p>${notification.body}</p>`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email notifications');
    }
  } catch (error) {
    console.error('Error sending email notifications:', error);
    throw error;
  }
}

// Вспомогательные функции для разных типов уведомлений
export async function sendCleaningNotification(
  userIds: string[],
  roomNumber: string,
  status: string
) {
  await sendNotification(userIds, {
    title: 'Обновление статуса уборки',
    body: `Комната ${roomNumber}: ${status}`,
    type: 'cleaning',
    data: {
      roomNumber,
      status,
    },
  });
}

export async function sendReservationNotification(
  userIds: string[],
  roomNumber: string,
  guestName: string
) {
  await sendNotification(userIds, {
    title: 'Новое бронирование',
    body: `Гость ${guestName} заселяется в комнату ${roomNumber}`,
    type: 'reservation',
    data: {
      roomNumber,
      guestName,
    },
  });
}

export async function sendSystemNotification(
  userIds: string[],
  message: string
) {
  await sendNotification(userIds, {
    title: 'Системное уведомление',
    body: message,
    type: 'system',
  });
}

// Получить всех администраторов
async function getAdmins(): Promise<User[]> {
  const usersRef = ref(db, 'users');
  const snapshot = await get(usersRef);
  if (!snapshot.exists()) return [];

  const usersData = snapshot.val();
  return Object.entries(usersData)
    .filter(([_, data]: [string, any]) => data.role === 'admin')
    .map(([id, data]: [string, any]) => ({
      id,
      ...data
    })) as User[];
}

// Уведомление о новой резервации
export async function notifyNewReservation(reservation: Reservation) {
  try {
    const admins = await getAdmins();
    const adminIds = admins.map(admin => admin.id);

    await sendNotification(adminIds, {
      title: 'Новая резервация',
      body: `Создана новая резервация для комнаты ${reservation.roomId}`,
      type: 'reservation',
      data: {
        reservationId: reservation.id,
        roomId: reservation.roomId,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut
      }
    });
  } catch (error) {
    console.error('Error sending reservation notification:', error);
    throw error;
  }
}

export const subscribeToUserNotifications = (
  userId: string,
  onUpdate: (notifications: Notification[]) => void
) => {
  const notificationsRef = ref(db, 'notifications');
  return onValue(notificationsRef, (snapshot) => {
    if (!snapshot.exists()) {
      onUpdate([]);
      return;
    }

    const notificationsData = snapshot.val();
    const notifications = Object.entries(notificationsData)
      .filter(([_, data]: [string, any]) => data.userId === userId)
      .map(([id, data]: [string, any]) => ({
        id,
        ...data
      }))
      .sort((a, b) => b.createdAt - a.createdAt) as Notification[];

    onUpdate(notifications);
  });
};

export const subscribeToUnreadNotifications = (
  userId: string,
  onUpdate: (notifications: Notification[]) => void
) => {
  const notificationsRef = ref(db, 'notifications');
  return onValue(notificationsRef, (snapshot) => {
    if (!snapshot.exists()) {
      onUpdate([]);
      return;
    }

    const notificationsData = snapshot.val();
    const notifications = Object.entries(notificationsData)
      .filter(([_, data]: [string, any]) => data.userId === userId && !data.read)
      .map(([id, data]: [string, any]) => ({
        id,
        ...data
      }))
      .sort((a, b) => b.createdAt - a.createdAt) as Notification[];

    onUpdate(notifications);
  });
}; 