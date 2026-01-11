// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  AndroidImportance: {
    MAX: 5,
  },
  AndroidNotificationPriority: {
    MAX: 'max',
  },
  SchedulableTriggerInputTypes: {
    CALENDAR: 'calendar',
    DAILY: 'daily',
  },
}));

import * as Notifications from 'expo-notifications';
import { notificationService } from '../notificationService';

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPermissions', () => {
    it('should request permissions if not already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await notificationService.requestPermissions();

      expect(result.success).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('should not request if already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await notificationService.requestPermissions();

      expect(result.success).toBe(true);
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('should return error if permission denied', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await notificationService.requestPermissions();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission not granted');
    });
  });

  describe('scheduleMedicationNotification', () => {
    it('should schedule a notification for a specific time', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-123');

      const result = await notificationService.scheduleMedicationNotification(
        'med-1',
        'aspirin',
        'Aspirin',
        '500mg',
        '09:00'
      );

      expect(result.success).toBe(true);
      expect(result.notificationId).toBe('notification-123');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Time to take your medication',
            body: 'Aspirin - 500mg',
          }),
          trigger: expect.objectContaining({
            hour: 9,
            minute: 0,
            repeats: true,
          }),
        })
      );
    });

    it('should handle errors when scheduling fails', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('Schedule failed')
      );

      const result = await notificationService.scheduleMedicationNotification(
        'med-1',
        'aspirin',
        'Aspirin',
        '500mg',
        '09:00'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Schedule failed');
    });
  });

  describe('scheduleGroupedNotification', () => {
    it('should schedule a grouped notification for multiple medications', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-456');

      const medications = [
        { id: 'med-1', medicationName: 'aspirin', brandName: 'Aspirin', dosage: '500mg' },
        { id: 'med-2', medicationName: 'ibuprofen', brandName: 'Advil', dosage: '200mg' },
      ];

      const result = await notificationService.scheduleGroupedNotification(medications, '09:00');

      expect(result.success).toBe(true);
      expect(result.notificationId).toBe('notification-456');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Time to take 2 medications',
            body: expect.stringContaining('Aspirin - 500mg'),
          }),
        })
      );
    });

    it('should show singular title for single medication', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-789');

      const medications = [
        { id: 'med-1', medicationName: 'aspirin', brandName: 'Aspirin', dosage: '500mg' },
      ];

      const result = await notificationService.scheduleGroupedNotification(medications, '09:00');

      expect(result.success).toBe(true);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Time to take your medication',
          }),
        })
      );
    });
  });

  describe('cancelNotification', () => {
    it('should cancel a specific notification', async () => {
      (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await notificationService.cancelNotification('notification-123');

      expect(result.success).toBe(true);
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notification-123');
    });
  });

  describe('cancelAllNotifications', () => {
    it('should cancel all scheduled notifications', async () => {
      (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await notificationService.cancelAllNotifications();

      expect(result.success).toBe(true);
      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('getAllScheduledNotifications', () => {
    it('should return all scheduled notifications', async () => {
      const mockNotifications = [
        { identifier: 'notif-1' },
        { identifier: 'notif-2' },
      ];
      (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(
        mockNotifications
      );

      const result = await notificationService.getAllScheduledNotifications();

      expect(result.success).toBe(true);
      expect(result.notifications).toEqual(mockNotifications);
    });
  });

  describe('listeners', () => {
    it('should add notification response listener', () => {
      const mockCallback = jest.fn();
      const mockSubscription = { remove: jest.fn() };
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue(
        mockSubscription
      );

      const subscription = notificationService.addNotificationResponseListener(mockCallback);

      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalledWith(
        mockCallback
      );
      expect(subscription).toBe(mockSubscription);
    });

    it('should add notification received listener', () => {
      const mockCallback = jest.fn();
      const mockSubscription = { remove: jest.fn() };
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(
        mockSubscription
      );

      const subscription = notificationService.addNotificationReceivedListener(mockCallback);

      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalledWith(mockCallback);
      expect(subscription).toBe(mockSubscription);
    });
  });
});
