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

  describe('Platform-specific behavior', () => {
    it('should schedule notification with proper trigger structure', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notif-123');

      const result = await notificationService.scheduleMedicationNotification(
        'med-1',
        'aspirin',
        'Aspirin',
        '500mg',
        '09:00'
      );

      expect(result.success).toBe(true);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: expect.objectContaining({
            hour: 9,
            minute: 0,
            repeats: true,
          }),
        })
      );
    });

    it('should schedule grouped notification with proper trigger', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('grouped-notif-123');

      const medications = [
        { id: 'med-1', medicationName: 'aspirin', brandName: 'Aspirin', dosage: '500mg' },
        { id: 'med-2', medicationName: 'ibuprofen', brandName: 'Advil', dosage: '200mg' },
      ];

      const result = await notificationService.scheduleGroupedNotification(medications, '14:00');

      expect(result.success).toBe(true);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Time to take 2 medications',
          }),
          trigger: expect.objectContaining({
            hour: 14,
            minute: 0,
            repeats: true,
          }),
        })
      );
    });

    it('should include medication data in notification payload', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notif-data-123');

      const result = await notificationService.scheduleMedicationNotification(
        'med-xyz',
        'vitamin-d',
        'Vitamin D3',
        '1000 IU',
        '08:30'
      );

      expect(result.success).toBe(true);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            data: expect.objectContaining({
              medicationId: 'med-xyz',
              time: '08:30',
              type: 'medication-reminder',
            }),
          }),
        })
      );
    });

    it('should set proper notification content fields', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('content-notif-123');

      const result = await notificationService.scheduleMedicationNotification(
        'med-1',
        'aspirin',
        'Aspirin',
        '500mg',
        '12:00'
      );

      expect(result.success).toBe(true);
      const scheduleCall = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
      expect(scheduleCall.content).toMatchObject({
        title: 'Time to take your medication',
        body: 'Aspirin - 500mg',
        sound: true,
        priority: 'max',
      });
    });
  });

  describe('Error handling', () => {
    // Suppress console.error for expected errors in tests
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should handle network failure when scheduling notification', async () => {
      const networkError = new Error('Network request failed');
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(networkError);

      const result = await notificationService.scheduleMedicationNotification(
        'med-1',
        'aspirin',
        'Aspirin',
        '500mg',
        '09:00'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network request failed');
    });

    it('should handle network failure when scheduling grouped notification', async () => {
      const networkError = new Error('Network request failed');
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(networkError);

      const medications = [
        { id: 'med-1', medicationName: 'aspirin', brandName: 'Aspirin', dosage: '500mg' },
      ];

      const result = await notificationService.scheduleGroupedNotification(medications, '09:00');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network request failed');
    });

    it('should handle permission revocation scenario', async () => {
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

    it('should handle permission request failure', async () => {
      const permissionError = new Error('Permission request crashed');
      (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValue(permissionError);

      const result = await notificationService.requestPermissions();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission request crashed');
    });

    it('should handle invalid time format in medication notification', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('Invalid time format')
      );

      const result = await notificationService.scheduleMedicationNotification(
        'med-1',
        'aspirin',
        'Aspirin',
        '500mg',
        'invalid-time'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid time format');
    });

    it('should handle missing medication data gracefully', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('Missing required data')
      );

      const result = await notificationService.scheduleMedicationNotification(
        '',
        '',
        '',
        '',
        '09:00'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty medications array in grouped notification', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('No medications provided')
      );

      const result = await notificationService.scheduleGroupedNotification([], '09:00');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No medications provided');
    });

    it('should handle cancellation failure', async () => {
      const cancelError = new Error('Notification not found');
      (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockRejectedValue(cancelError);

      const result = await notificationService.cancelNotification('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Notification not found');
    });

    it('should handle getAllScheduledNotifications failure', async () => {
      const fetchError = new Error('Failed to fetch notifications');
      (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockRejectedValue(fetchError);

      const result = await notificationService.getAllScheduledNotifications();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch notifications');
      expect(result.notifications).toEqual([]);
    });

    it('should handle cancelAllNotifications failure', async () => {
      const cancelError = new Error('Failed to cancel all');
      (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockRejectedValue(
        cancelError
      );

      const result = await notificationService.cancelAllNotifications();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to cancel all');
    });

    it('should handle notification scheduling with invalid hour', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('Hour must be between 0 and 23')
      );

      const result = await notificationService.scheduleMedicationNotification(
        'med-1',
        'aspirin',
        'Aspirin',
        '500mg',
        '25:00'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle notification scheduling with negative time values', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('Invalid time value')
      );

      const result = await notificationService.scheduleMedicationNotification(
        'med-1',
        'aspirin',
        'Aspirin',
        '500mg',
        '-1:00'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
