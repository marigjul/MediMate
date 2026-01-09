import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button } from "../components/button";
import { Card, CardContent } from "../components/card";
import { useAuth } from "../contexts/AuthContext";
import type { HomeStackParamList } from "../types/navigation";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  "HomeMain"
>;

// Placeholder data -  replace with real data later
const PLACEHOLDER_MEDICATIONS: Medication[] = [
  { id: 1, name: "Ibuprofen", time: "08:00", status: "taken" },
  { id: 2, name: "Amoxicillin", time: "09:00", status: "taken" },
  { id: 3, name: "Lisinopril", time: "09:00", status: "taken" },
  { id: 4, name: "Ibuprofen", time: "14:00", status: "pending" },
  { id: 5, name: "Amoxicillin", time: "17:00", status: "pending" },
  { id: 6, name: "Ibuprofen", time: "20:00", status: "pending" },
];

type MedicationStatus = "pending" | "taken" | "missed";

interface Medication {
  id: number;
  name: string;
  time: string;
  status: MedicationStatus;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [medications, setMedications] = useState<Medication[]>(PLACEHOLDER_MEDICATIONS);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<MedicationStatus | null>(null);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Get next medication
  const getNextMedication = () => {
    const pending = medications.filter(med => med.status === "pending");
    return pending.length > 0 ? pending[0] : null;
  };

  // Calculate today's progress
  const getTodaysProgress = () => {
    const taken = medications.filter(med => med.status === "taken").length;
    const total = medications.length;
    return { taken, total };
  };

  // Open status change modal
  const openStatusModal = (medication: Medication) => {
    setSelectedMedication(medication);
    setSelectedStatus(medication.status);
    setModalVisible(true);
  };

  // Confirm status change
  const confirmStatusChange = () => {
    if (selectedMedication && selectedStatus) {
      setMedications(prev => prev.map(med => 
        med.id === selectedMedication.id 
          ? { ...med, status: selectedStatus }
          : med
      ));
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
    // For now, using placeholder data structure
    // In a real app, you'd fetch the full medication data
    const mockMedication = {
      id: "1",
      medicationName: nextMed?.name.toLowerCase() || "medication",
      fdaData: {
        brandName: nextMed?.name || "Medication",
      },
      schedule: {
        times: [nextMed?.time || "09:00"],
        frequency: "Daily",
      },
      duration: {
        type: "permanent",
      },
      dosage: "As prescribed",
    };
    
    navigation.navigate("MedicationView", { medication: mockMedication });
  };

  const nextMed = getNextMedication();
  const progress = getTodaysProgress();

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
              <Text style={styles.medicationTime}>at {nextMed.time}</Text>
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
