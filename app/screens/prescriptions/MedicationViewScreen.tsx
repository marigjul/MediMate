import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from "../../components/button";
import ConfirmationModal from "../../components/ConfirmationModal";
import { useAuth } from "../../contexts/AuthContext";
import { medicationService } from "../../services/medicationService";
import type { HomeStackParamList, PrescriptionsStackParamList } from "../../types/navigation";

// Support navigation from both Home and Prescriptions stacks
type MedicationViewNavigationProp = 
  | NativeStackNavigationProp<PrescriptionsStackParamList, "MedicationView">
  | NativeStackNavigationProp<HomeStackParamList, "MedicationView">;

type MedicationViewRouteProp = 
  | RouteProp<PrescriptionsStackParamList, "MedicationView">
  | RouteProp<HomeStackParamList, "MedicationView">;

const BackIcon = () => (
  <MaterialCommunityIcons name="chevron-left" size={28} color="#3B82F6" />
);

const EditIcon = () => (
  <MaterialCommunityIcons name="pencil" size={20} color="#FFFFFF" />
);

const DeleteIcon = () => (
  <MaterialCommunityIcons name="delete" size={20} color="#FFFFFF" />
);

export default function MedicationViewScreen() {
  const navigation = useNavigation<MedicationViewNavigationProp>();
  const route = useRoute<MedicationViewRouteProp>();
  const { user } = useAuth();
  const { medication } = route.params;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const displayName =
    medication.fdaData?.brandName ||
    medication.medicationName.charAt(0).toUpperCase() +
      medication.medicationName.slice(1);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEdit = () => {
    // Use type assertion to navigate - works for both Home and Prescriptions stacks
    (navigation as any).navigate("MedicationSchedule", {
      medicationName: medication.medicationName,
      brandName: displayName,
      genericName: medication.fdaData?.genericName,
      fdaData: medication.fdaData,
      existingMedication: medication,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!medication.id) return;

    setIsDeleting(true);
    try {
      const result = await medicationService.deleteMedication(medication.id);

      if (result.success) {
        setShowDeleteModal(false);
        navigation.goBack();
      } else {
        console.error("Failed to delete medication:", result.error);
        alert("Failed to delete medication. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting medication:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Format schedule information
  const getScheduleInfo = () => {
    const { schedule } = medication;
    const times = schedule.times || [];

    if (times.length === 0) return null;

    const frequency = schedule.frequency || "";
    const startTime = times[0];
    const endTime = times[times.length - 1];

    return {
      frequency,
      times,
      startTime,
      endTime,
      hoursBetweenDoses: schedule.hoursBetweenDoses,
    };
  };

  // Format duration information
  const formatDuration = () => {
    if (medication.duration) {
      if (medication.duration.type === "permanent") {
        return "Permanent";
      }
      if (medication.duration.type === "limited" && medication.duration.days) {
        return `${medication.duration.days}-day course`;
      }
    }
    return "Not specified";
  };

  // Get completion status
  const getCompletionStatus = () => {
    if (
      medication.duration &&
      medication.duration.type === "limited" &&
      medication.duration.days
    ) {
      const completed = medication.streak || 0;
      const total = medication.duration.days;
      return { completed, total };
    }
    return null;
  };

  // Format FDA information
  const getInformation = () => {
    const fdaData = medication.fdaData;
    if (!fdaData) return null;

    // Clean and format text - remove extra spaces and handle arrays
    const cleanText = (text: string | string[] | undefined) => {
      if (!text) return null;
      if (Array.isArray(text)) {
        const joined = text.join(" ").trim();
        return joined || null;
      }
      return text.trim() || null;
    };

    return {
      purpose: cleanText(fdaData.purpose) || cleanText(fdaData.indicationsAndUsage),
      activeIngredient: cleanText(fdaData.activeIngredient),
      sideEffects: cleanText(fdaData.adverse_reactions) || cleanText(fdaData.sideEffects),
      warnings: cleanText(fdaData.warnings),
      doNotUse: cleanText(fdaData.doNotUse),
      askDoctor: cleanText(fdaData.askDoctor),
      stopUse: cleanText(fdaData.stopUse),
      dosageAndAdministration: cleanText(fdaData.dosageAndAdministration),
    };
  };

  const completionStatus = getCompletionStatus();
  const information = getInformation();
  const scheduleInfo = getScheduleInfo();
  const isPermanent = medication.duration?.type === "permanent";

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <BackIcon />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Medication Name */}
        <Text style={styles.title}>{displayName}</Text>

        {/* Schedule Card */}
        {scheduleInfo ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={24}
                color="#3B82F6"
              />
              <Text style={styles.cardTitle}>Schedule</Text>
            </View>
            
            {/* Frequency */}
            {scheduleInfo.frequency && (
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleLabel}>Frequency:</Text>
                <Text style={styles.scheduleValue}>{scheduleInfo.frequency}</Text>
              </View>
            )}

            {/* Start and End Time */}
            {scheduleInfo.startTime && scheduleInfo.endTime && (
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleLabel}>
                  {scheduleInfo.times.length === 1 ? "Time:" : "Time window:"}
                </Text>
                <Text style={styles.scheduleValue}>
                  {scheduleInfo.times.length === 1 
                    ? scheduleInfo.startTime 
                    : `${scheduleInfo.startTime} - ${scheduleInfo.endTime}`
                  }
                </Text>
              </View>
            )}

            {/* Medication Times */}
            {scheduleInfo.times.length > 0 && (
              <View style={styles.timesSection}>
                <Text style={styles.scheduleLabel}>Times:</Text>
                <View style={styles.timesGrid}>
                  {scheduleInfo.times.map((time: string, index: number) => (
                    <View key={index} style={styles.timeChip}>
                      <Text style={styles.timeChipText}>{time}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={24}
                color="#3B82F6"
              />
              <Text style={styles.cardTitle}>Schedule</Text>
            </View>
            <Text style={styles.cardContent}>No schedule set</Text>
          </View>
        )}

        {/* Duration Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="calendar"
              size={24}
              color="#3B82F6"
            />
            <Text style={styles.cardTitle}>Duration</Text>
          </View>
          <Text style={styles.cardContent}>{formatDuration()}</Text>

          {completionStatus && (
            <View style={styles.progressBadge}>
              <MaterialCommunityIcons
                name="calendar-check"
                size={18}
                color="#3B82F6"
              />
              <Text style={styles.progressText}>
                {completionStatus.completed}/{completionStatus.total} days
                completed
              </Text>
            </View>
          )}
        </View>

        {/* Refill Reminder Card */}
        {medication.refillReminder && isPermanent && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={24}
                color="#3B82F6"
              />
              <Text style={styles.cardTitle}>Refill Reminder</Text>
            </View>
            <Text style={styles.cardContent}>
              Every {medication.refillReminder} days
            </Text>
          </View>
        )}

        {/* Information Card */}
        {information && (
          <View style={[styles.card, styles.infoCard]}>
            <Text style={styles.infoTitle}>Information</Text>

            {/* Purpose */}
            {information.purpose && (
              <>
                <Text style={styles.infoSubtitle}>Purpose</Text>
                <Text style={styles.infoText}>{information.purpose}</Text>
              </>
            )}

            {/* Active Ingredient */}
            {information.activeIngredient && (
              <>
                <Text style={styles.infoSubtitle}>Active Ingredient</Text>
                <Text style={styles.infoText}>{information.activeIngredient}</Text>
              </>
            )}

            {/* Common Side Effects */}
            {information.sideEffects && (
              <>
                <Text style={styles.infoSubtitle}>Common side effects:</Text>
                <Text style={styles.infoText}>{information.sideEffects}</Text>
              </>
            )}

            {/* Do Not Use */}
            {information.doNotUse && (
              <>
                <Text style={styles.infoSubtitle}>Do not use if:</Text>
                <Text style={styles.infoText}>{information.doNotUse}</Text>
              </>
            )}

            {/* Ask Doctor */}
            {information.askDoctor && (
              <>
                <Text style={styles.infoSubtitle}>Ask a doctor before use if:</Text>
                <Text style={styles.infoText}>{information.askDoctor}</Text>
              </>
            )}

            {/* Stop Use */}
            {information.stopUse && (
              <>
                <Text style={styles.infoSubtitle}>Stop use and ask a doctor if:</Text>
                <Text style={styles.infoText}>{information.stopUse}</Text>
              </>
            )}

            {/* Dosage and Administration */}
            {information.dosageAndAdministration && (
              <>
                <Text style={styles.infoSubtitle}>Dosage and Administration</Text>
                <Text style={styles.infoText}>{information.dosageAndAdministration}</Text>
              </>
            )}

            {/* Warning Box - at the bottom */}
            {information.warnings && (
              <View style={styles.warningBox}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={20}
                  color="#F59E0B"
                />
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>Warning</Text>
                  <Text style={styles.warningText}>{information.warnings}</Text>
                </View>
              </View>
            )}

            {/* No information available message */}
            {!information.purpose && 
             !information.activeIngredient && 
             !information.sideEffects && 
             !information.warnings && 
             !information.doNotUse && 
             !information.askDoctor && 
             !information.stopUse && 
             !information.dosageAndAdministration && (
              <Text style={styles.noInfoText}>
                No additional information available for this medication.
              </Text>
            )}
          </View>
        )}

        {/* Edit Button */}
        <Button
          onPress={handleEdit}
          style={styles.editButton}
          icon={<EditIcon />}
          iconPosition="left"
        >
          Edit Medication
        </Button>

        {/* Delete Button */}
        <Button
          onPress={() => setShowDeleteModal(true)}
          style={styles.deleteButton}
          icon={<DeleteIcon />}
          iconPosition="left"
        >
          Delete Medication
        </Button>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Medication?"
        message={`Are you sure you want to delete ${displayName}? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
        destructive={true}
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E0F2FE",
  },
  container: {
    flex: 1,
    backgroundColor: "#E0F2FE",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backText: {
    fontSize: 17,
    color: "#3B82F6",
    marginLeft: 4,
    fontWeight: "500",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1E40AF",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  cardContent: {
    fontSize: 16,
    color: "#4B5563",
    lineHeight: 24,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  scheduleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  scheduleValue: {
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "500",
  },
  timesSection: {
    marginTop: 12,
  },
  timesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  timeChip: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  progressBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  infoCard: {
    paddingVertical: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  infoSubtitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
    marginTop: 12,
  },
  infoText: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 22,
  },
  noInfoText: {
    fontSize: 15,
    color: "#9CA3AF",
    lineHeight: 22,
    fontStyle: "italic",
  },
  warningBox: {
    flexDirection: "row",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: "#78350F",
    lineHeight: 20,
  },
  editButton: {
    marginTop: 8,
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: "#EF4444",
  },
});
