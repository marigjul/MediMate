import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, // Don't show alert when app is open
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

export interface ScheduledNotification {
  id: string;
  notificationId?: string;
}

export const notificationService = {
  // Request notification permissions
  requestPermissions: async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission not granted');
        return { success: false, error: 'Permission not granted' };
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('medication-reminders', {
          name: 'Medication Reminders',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3B82F6',
          sound: 'default',
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error requesting notification permissions:', error);
      return { success: false, error: error.message };
    }
  },

  // Schedule a notification for a specific medication time
  scheduleMedicationNotification: async (
    medicationId: string,
    medicationName: string,
    brandName: string | undefined,
    dosage: string,
    time: string // HH:MM format
  ) => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time to take your medication',
          body: `${brandName || medicationName} - ${dosage}`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          ...(Platform.OS === 'android' && { icon: 'ic_launcher' }),
          data: {
            medicationId,
            time,
            type: 'medication-reminder',
          },
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true, // Repeat daily
          channelId: Platform.OS === 'android' ? 'medication-reminders' : undefined,
        } as any,
      });

      return { success: true, notificationId };
    } catch (error: any) {
      console.error('Error scheduling notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Schedule multiple medications at the same time as a grouped notification
  scheduleGroupedNotification: async (
    medications: Array<{
      id: string;
      medicationName: string;
      brandName?: string;
      dosage: string;
    }>,
    time: string
  ) => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      
      const medList = medications
        .map(med => `${med.brandName || med.medicationName} - ${med.dosage}`)
        .join('\n');

      const title = medications.length === 1 
        ? 'Time to take your medication'
        : `Time to take ${medications.length} medications`;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: medList,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          ...(Platform.OS === 'android' && { icon: 'ic_launcher' }),
          data: {
            medications: medications.map(m => ({ id: m.id, time })),
            time,
            type: 'medication-reminder-group',
          },
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
          channelId: Platform.OS === 'android' ? 'medication-reminders' : undefined,
        } as any,
      });

      return { success: true, notificationId };
    } catch (error: any) {
      console.error('Error scheduling grouped notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Cancel a specific notification
  cancelNotification: async (notificationId: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      return { success: true };
    } catch (error: any) {
      console.error('Error canceling notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Cancel all scheduled notifications
  cancelAllNotifications: async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return { success: true };
    } catch (error: any) {
      console.error('Error canceling all notifications:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all scheduled notifications
  getAllScheduledNotifications: async () => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return { success: true, notifications };
    } catch (error: any) {
      console.error('Error getting scheduled notifications:', error);
      return { success: false, error: error.message, notifications: [] };
    }
  },

  // Add a notification response listener (for when user taps notification)
  addNotificationResponseListener: (
    callback: (response: Notifications.NotificationResponse) => void
  ) => {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  // Add a notification received listener (for when notification arrives while app is open)
  addNotificationReceivedListener: (
    callback: (notification: Notifications.Notification) => void
  ) => {
    return Notifications.addNotificationReceivedListener(callback);
  },
};
