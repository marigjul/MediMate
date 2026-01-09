import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button } from "../components/button";
import { Card, CardContent } from "../components/card";
import { useAuth } from "../contexts/AuthContext";
import { medicationService } from "../services/medicationService";
import type { HomeStackParamList, MedicationStatus } from "../types/navigation";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  "HomeMain"
>;

interface TodayMedication {
  id: string;
  medicationId: string;
  name: string;
  time: string;
  status: MedicationStatus;
  fullMedication: any;
  isTomorrow?: boolean;
}

interface DbMedication {
  id: string;
  medicationName: string;
  fdaData?: {
    brandName?: string;
    genericName?: string;
  };
  schedule: {
    times?: string[];
    frequency: string;
  };
  duration?: {
    type: "permanent" | "limited";
    days?: number;
  };
  dosage?: string;
  streak?: number;
  refillReminder?: number;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [medications, setMedications] = useState<TodayMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<TodayMedication | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<MedicationStatus | null>(null);

  useEffect(() => {
    if (user) {
      loadTodaysMedications();
    } else {
      setLoading(false);
      setMedications([]);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadTodaysMedications();
      }
    }, [user])
  );

  // Check for missed medications periodically
  useEffect(() => {
    if (medications.length > 0) {
      autoMarkMissedMedications();
    }
  }, [medications.length]);

  const loadTodaysMedications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const today = medicationService.getTodayDateString();
      console.log('[HomeScreen] Loading medications for:', today);
      
      // Reset statuses if it's a new day
      await medicationService.resetDailyStatuses(user.uid);
      
      // Get user medications
      const result = await medicationService.getUserMedications(user.uid);
      console.log('[HomeScreen] Got', result.medications?.length || 0, 'medications');

      if (result.success && result.medications) {
        // Generate today's schedule from medications with their status
        const todaysSchedule: TodayMedication[] = [];
        
        result.medications.forEach((med: DbMedication) => {
          const times = med.schedule?.times || [];
          const displayName = med.fdaData?.brandName || 
            med.medicationName.charAt(0).toUpperCase() + med.medicationName.slice(1);
          
          times.forEach((time, index) => {
            // Get status from medication's todayStatus object
            const status = (med as any).todayStatus?.[time] || "pending";
            
            todaysSchedule.push({
              id: `${med.id}-${index}`,
              medicationId: med.id,
              name: displayName,
              time: time,
              status: status as MedicationStatus,
              fullMedication: med,
            });
          });
        });

        // Sort by time
        todaysSchedule.sort((a, b) => a.time.localeCompare(b.time));
        setMedications(todaysSchedule);
      } else {
        setMedications([]);
      }
    } catch (error) {
      console.error("Error loading medications:", error);
      setMedications([]);
    } finally {
      setLoading(false);
    }
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Get next medication
  const getNextMedication = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // First, check for today's pending medications
    const todayPending = medications.filter(med => med.status === "pending" && med.time >= currentTime);
    if (todayPending.length > 0) {
      return todayPending[0];
    }
    
    // If all today's medications are done (taken or past), show tomorrow's first medication
    const allDone = medications.every(med => med.status === "taken" || med.time < currentTime);
    if (allDone && medications.length > 0) {
      // Get all medications and find the earliest time
      const allMedications = [...medications];
      allMedications.sort((a, b) => a.time.localeCompare(b.time));
      
      if (allMedications.length > 0) {
        return {
          ...allMedications[0],
          isTomorrow: true,
          status: "pending" as MedicationStatus, // Tomorrow will be pending
        };
      }
    }
    
    return null;
  };

  // Check if a medication is past its 30-minute window
  const isMedicationMissed = (time: string) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    // Add 30 minutes to scheduled time
    const windowEnd = new Date(scheduledTime.getTime() + 30 * 60 * 1000);
    
    return now > windowEnd;
  };

  // Check if medication time has passed (scheduled time, not window)
  const isMedicationTimePassed = (time: string) => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return currentTime > time;
  };

  // Get available status options for a medication based on time
  const getAvailableStatuses = (time: string): MedicationStatus[] => {
    if (isMedicationTimePassed(time)) {
      // After scheduled time: can only mark as taken or missed, not pending
      return ['taken', 'missed'];
    } else {
      // Before or at scheduled time: can be pending or taken
      return ['pending', 'taken'];
    }
  };

  // Auto-mark medications as missed if past their window
  const autoMarkMissedMedications = async () => {
    const updates: Promise<any>[] = [];
    
    medications.forEach(med => {
      if (med.status === 'pending' && isMedicationMissed(med.time)) {
        console.log('[HomeScreen] Auto-marking as missed:', med.name, med.time);
        updates.push(
          medicationService.updateMedicationTimeStatus(
            med.medicationId,
            med.time,
            'missed'
          )
        );
      }
    });

    if (updates.length > 0) {
      await Promise.all(updates);
      await loadTodaysMedications();
    }
  };

  // Calculate today's progress
  const getTodaysProgress = () => {
    const taken = medications.filter(med => med.status === "taken").length;
    const total = medications.length;
    return { taken, total };
  };

  // Open status change modal
  const openStatusModal = (medication: TodayMedication) => {
    setSelectedMedication(medication);
    const availableStatuses = getAvailableStatuses(medication.time);
    // If current status is not available anymore, default to first available
    const defaultStatus = availableStatuses.includes(medication.status) 
      ? medication.status 
      : availableStatuses[0];
    setSelectedStatus(defaultStatus);
    setModalVisible(true);
  };

  // Confirm status change
  const confirmStatusChange = async () => {
    if (selectedMedication && selectedStatus) {
      console.log('[HomeScreen] Updating status:', {
        medicationId: selectedMedication.medicationId,
        time: selectedMedication.time,
        newStatus: selectedStatus
      });

      // Update local state optimistically
      setMedications(prev => prev.map(med => 
        med.id === selectedMedication.id 
          ? { ...med, status: selectedStatus }
          : med
      ));

      // Save to database
      const result = await medicationService.updateMedicationTimeStatus(
        selectedMedication.medicationId,
        selectedMedication.time,
        selectedStatus
      );

      if (!result.success) {
        console.error("Failed to update medication status:", result.error);
        // Revert optimistic update on error
        await loadTodaysMedications();
      } else {
        console.log('[HomeScreen] Status updated successfully');
      }
    }
    setModalVisible(false);
    setSelectedMedication(null);
    setSelectedStatus(null);
  };

  // Cancel status change
  const cancelStatusChange = () => {
    setModalVisible(false);
    setSelectedMedication(null);
    setSelectedStatus(null);
  };

  // Handle view details - navigate to medication view
  const handleViewDetails = () => {
    if (!nextMed?.fullMedication) return;
    navigation.navigate("MedicationView", { medication: nextMed.fullMedication });
  };

  const nextMed = getNextMedication();
  const progress = getTodaysProgress();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading today's schedule...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Greeting */}
        <Text style={styles.greeting}>
          {getGreeting()}{user?.displayName ? `, ${user.displayName}` : ''}!
        </Text>

        {/* Next Medication Card */}
        {nextMed && (
          <Card style={styles.nextMedCard}>
            <CardContent>
              <View style={styles.nextMedHeader}>
                <Ionicons name="time-outline" size={20} color="#64748b" style={styles.clockIcon} />
                <Text style={styles.nextMedLabel}>Next medication</Text>
              </View>
              <Text style={styles.medicationName}>{nextMed.name}</Text>
              <Text style={styles.medicationTime}>
                {nextMed.isTomorrow ? `Tomorrow, at ${nextMed.time}` : `at ${nextMed.time}`}
              </Text>
              <Button 
                style={styles.detailsButton}
                onPress={handleViewDetails}
              >
                View details
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Progress Card */}
        <Card style={styles.progressCard}>
          <CardContent>
            <View style={styles.progressContent}>
              <Ionicons name="trending-up" size={28} color="#047857" style={styles.trendIcon} />
              <View>
                <Text style={styles.progressTitle}>Today's Progress</Text>
                <Text style={styles.progressText}>
                  {progress.taken} of {progress.total} doses taken
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Today's Medications */}
        <Text style={styles.sectionTitle}>Today's Medications</Text>

        {medications.map((med) => (
          <TouchableOpacity 
            key={med.id} 
            onPress={() => openStatusModal(med)}
            activeOpacity={0.7}
          >
            <Card style={styles.medicationCard}>
              <CardContent>
                <View style={styles.medicationRow}>
                  <View>
                    <Text style={styles.medName}>{med.name}</Text>
                    <Text style={styles.medTime}>{med.time}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    med.status === "taken" && styles.statusTaken,
                    med.status === "pending" && styles.statusPending,
                    med.status === "missed" && styles.statusMissed,
                  ]}>
                    <Text style={[
                      styles.statusText,
                      med.status === "taken" && styles.statusTextTaken,
                      med.status === "pending" && styles.statusTextPending,
                      med.status === "missed" && styles.statusTextMissed,
                    ]}>
                      {med.status.charAt(0).toUpperCase() + med.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status Change Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelStatusChange}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Medication Status</Text>
            <Text style={styles.modalSubtitle}>
              {selectedMedication?.name} - {selectedMedication?.time}
            </Text>

            <View style={styles.statusOptions}>
              {selectedMedication && getAvailableStatuses(selectedMedication.time).includes('pending') && (
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    selectedStatus === "pending" && styles.statusOptionSelected,
                  ]}
                  onPress={() => setSelectedStatus("pending")}
                >
                  <View style={[styles.statusIndicator, styles.statusIndicatorPending]} />
                  <Text style={[
                    styles.statusOptionText,
                    selectedStatus === "pending" && styles.statusOptionTextSelected,
                  ]}>
                    Pending
                  </Text>
                </TouchableOpacity>
              )}

              {selectedMedication && getAvailableStatuses(selectedMedication.time).includes('taken') && (
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    selectedStatus === "taken" && styles.statusOptionSelected,
                  ]}
                  onPress={() => setSelectedStatus("taken")}
                >
                  <View style={[styles.statusIndicator, styles.statusIndicatorTaken]} />
                  <Text style={[
                    styles.statusOptionText,
                    selectedStatus === "taken" && styles.statusOptionTextSelected,
                  ]}>
                    Taken
                  </Text>
                </TouchableOpacity>
              )}

              {selectedMedication && getAvailableStatuses(selectedMedication.time).includes('missed') && (
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    selectedStatus === "missed" && styles.statusOptionSelected,
                  ]}
                  onPress={() => setSelectedStatus("missed")}
                >
                  <View style={[styles.statusIndicator, styles.statusIndicatorMissed]} />
                  <Text style={[
                    styles.statusOptionText,
                    selectedStatus === "missed" && styles.statusOptionTextSelected,
                  ]}>
                    Missed
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelStatusChange}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmStatusChange}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E0F2FE",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0F2FE",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  greeting: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1E40AF",
    marginBottom: 24,
  },
  nextMedCard: {
    backgroundColor: "#ffffff",
    marginBottom: 16,
  },
  nextMedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  clockIcon: {
    marginRight: 8,
  },
  nextMedLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  medicationName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  medicationTime: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 16,
  },
  detailsButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingVertical: 12,
  },
  progressCard: {
    backgroundColor: "#d1fae5",
    borderColor: "#a7f3d0",
    marginBottom: 24,
  },
  progressContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  trendIcon: {
    marginRight: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#065f46",
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#047857",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 16,
  },
  medicationCard: {
    backgroundColor: "#ffffff",
    marginBottom: 12,
  },
  medicationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  medName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 4,
  },
  medTime: {
    fontSize: 14,
    color: "#64748b",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: "#f3f4f6",
  },
  statusTaken: {
    backgroundColor: "#d1fae5",
  },
  statusMissed: {
    backgroundColor: "#fee2e2",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusTextPending: {
    color: "#6b7280",
  },
  statusTextTaken: {
    color: "#047857",
  },
  statusTextMissed: {
    color: "#dc2626",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 24,
    textAlign: "center",
  },
  statusOptions: {
    gap: 12,
    marginBottom: 24,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  statusOptionSelected: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusIndicatorPending: {
    backgroundColor: "#6b7280",
  },
  statusIndicatorTaken: {
    backgroundColor: "#047857",
  },
  statusIndicatorMissed: {
    backgroundColor: "#dc2626",
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#475569",
  },
  statusOptionTextSelected: {
    color: "#1e293b",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
  },
  confirmButton: {
    backgroundColor: "#3b82f6",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
