import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { medicationService } from '../services/medicationService';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

interface MedicationNotificationContextType {
  permissionsGranted: boolean;
  requestPermissions: () => Promise<void>;
}

const MedicationNotificationContext = createContext<MedicationNotificationContextType | undefined>(undefined);

export function useMedicationNotification() {
  const context = useContext(MedicationNotificationContext);
  if (!context) {
    throw new Error('useMedicationNotification must be used within MedicationNotificationProvider');
  }
  return context;
}

export function MedicationNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [medications, setMedications] = useState<any[]>([]);
  const scheduledNotifications = useRef<Map<string, string>>(new Map()); // time -> notificationId

  // Request notification permissions
  const requestPermissions = useCallback(async () => {
    const result = await notificationService.requestPermissions();
    if (result.success) {
      setPermissionsGranted(true);
    }
  }, []);

  // Request permissions on mount (only once per app session)
  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  // Subscribe to medications
  useEffect(() => {
    if (!user) {
      setMedications([]);
      return;
    }

    const unsubscribe = medicationService.subscribeToMedications(user.uid, (meds: any[]) => {
      setMedications(meds.filter((med: any) => med.isActive));
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Schedule notifications when medications change
  useEffect(() => {
    if (!permissionsGranted || !user || medications.length === 0) {
      return;
    }

    const scheduleNotifications = async () => {
      // Cancel all existing notifications first
      await notificationService.cancelAllNotifications();
      scheduledNotifications.current.clear();

      // Group medications by time
      const medicationsByTime = new Map<string, any[]>();
      
      medications.forEach(med => {
        if (!med.schedule?.times || !Array.isArray(med.schedule.times)) {
          return;
        }

        med.schedule.times.forEach((time: string) => {
          if (!medicationsByTime.has(time)) {
            medicationsByTime.set(time, []);
          }
          medicationsByTime.get(time)!.push({
            id: med.id,
            medicationName: med.medicationName,
            brandName: med.fdaData?.brandName,
            dosage: med.dosage || med.schedule?.dosage || 'N/A',
          });
        });
      });

      // Schedule a notification for each time slot
      for (const [time, meds] of medicationsByTime.entries()) {
        const result = await notificationService.scheduleGroupedNotification(meds, time);
        if (result.success && result.notificationId) {
          scheduledNotifications.current.set(time, result.notificationId);
        }
      }
    };

    scheduleNotifications();
  }, [medications, permissionsGranted, user]);

  // Handle notification taps
  useEffect(() => {
    const subscription = notificationService.addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      
      // Handle single medication notification
      if (data.type === 'medication-reminder' && data.medicationId && data.time) {
        // You can navigate to the medication detail or home screen here
        console.log('Notification tapped for medication:', data.medicationId, 'at', data.time);
      }
      
      // Handle grouped medication notification
      if (data.type === 'medication-reminder-group' && data.medications) {
        console.log('Notification tapped for medications at', data.time);
      }
    });

    return () => subscription.remove();
  }, []);

  // Handle notifications received while app is in foreground (no alert shown due to handler config)
  useEffect(() => {
    const subscription = notificationService.addNotificationReceivedListener((notification) => {
      // Notification received while app is open - do nothing as per requirements
      console.log('Notification received while app is open (not shown):', notification);
    });

    return () => subscription.remove();
  }, []);

  return (
    <MedicationNotificationContext.Provider
      value={{
        permissionsGranted,
        requestPermissions,
      }}
    >
      {children}
    </MedicationNotificationContext.Provider>
  );
}
