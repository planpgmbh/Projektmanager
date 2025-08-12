import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthState } from './useAuthState';
import type { Notification } from '../types/notifications';

export function useNotifications() {
  const { user } = useAuthState();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Notification[];
      
      setNotifications(notificationsData);
      setIsLoading(false);

      // Show browser notification for new unread notifications
      const unreadNotifications = notificationsData.filter(n => !n.isRead);
      if (unreadNotifications.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
        const latestNotification = unreadNotifications[0];
        if (latestNotification) {
          new Notification('Projektmanagement', {
            body: latestNotification.message,
            icon: '/favicon.ico',
            tag: latestNotification.id
          });
        }
      }
    }, (error) => {
      console.error('Error fetching notifications:', error);
      setError('Fehler beim Laden der Benachrichtigungen');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { isRead: true });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      const updatePromises = unreadNotifications.map(notification => 
        updateDoc(doc(db, 'notifications', notification.id), { isRead: true })
      );
      await Promise.all(updatePromises);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: new Date()
      });
    } catch (err) {
      console.error('Error creating notification:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const hasUnread = unreadCount > 0;

  return {
    notifications,
    unreadCount,
    hasUnread,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    createNotification
  };
}