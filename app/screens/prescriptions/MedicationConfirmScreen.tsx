import { Button } from "@/app/components/button";
import { PrescriptionsStackParamList } from "@/app/types/navigation";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { medicationService } from "../../services/medicationService";

type MedicationConfirmNavigationProp = NativeStackNavigationProp<
  PrescriptionsStackParamList,
  "MedicationConfirm"
>;

type MedicationConfirmRouteProp = RouteProp<
  PrescriptionsStackParamList,
  "MedicationConfirm"
>;

const BackIcon = () => <Text style={styles.backIcon}>←</Text>;

export default function MedicationConfirmScreen() {
  const navigation = useNavigation<MedicationConfirmNavigationProp>();
  const route = useRoute<MedicationConfirmRouteProp>();
  const { user } = useAuth();
  const {
    medicationName,
    brandName,
    genericName,
    fdaData,
    scheduleData,
    existingMedicationId,
  } = route.params;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEditMode = !!existingMedicationId;

  const formatTimes = () => {
    if (!scheduleData?.schedule?.times) return "";
    if (scheduleData.schedule.type === "interval") {
      return scheduleData.schedule.times.join(", ");
    } else {
      return scheduleData.schedule.times.join(", ");
    }
  };

  const formatDuration = () => {
    if (!scheduleData?.duration) return "Not specified";
    if (scheduleData.duration.type === "permanent") {
      return "Ongoing (no end date)";
    } else {
      return `${scheduleData.duration.days} days`;
    }
  };

  const handleConfirm = async () => {
    if (!user) {
      setError("You must be logged in to add medications");
      return;
    }

    setError("");

    try {
      setSaving(true);

      if (isEditMode) {
        const updateData: any = {
          dosage: scheduleData.dosage,
          schedule: scheduleData.schedule,
          duration: {
            type: scheduleData.duration.type,
          },
        };

        if (scheduleData.duration.days) {
          updateData.duration.days = scheduleData.duration.days;
        }

        if (scheduleData.refillReminder) {
          updateData.refillReminder = scheduleData.refillReminder;
        }

        const result = await medicationService.updateMedication(
          existingMedicationId,
          updateData
        );

        if (result.success) {
          navigation.navigate("PrescriptionsMain");
        } else {
          throw new Error(result.error || "Failed to update medication");
        }
      } else {
        await medicationService.searchMedicationFromFDA(medicationName);

        const addResult = await medicationService.addMedicationWithFDA(
          user.uid,
          medicationName,
          {
            times: scheduleData.schedule.times || [],
            frequency: scheduleData.schedule.frequency,
            duration:
              scheduleData.duration.type === "permanent"
                ? "permanent"
                : `${scheduleData.duration.days} days`,
          }
        );

        if (addResult.success) {
          const updateData: any = {
            dosage: scheduleData.dosage,
            schedule: {
              times: scheduleData.schedule.times,
              frequency: scheduleData.schedule.frequency,
            },
            duration: {
              type: scheduleData.duration.type,
            },
          };

          if (scheduleData.schedule.type) {
            updateData.schedule.type = scheduleData.schedule.type;
          }
          if (scheduleData.schedule.startTime) {
            updateData.schedule.startTime = scheduleData.schedule.startTime;
          }
          if (scheduleData.schedule.dosesPerDay) {
            updateData.schedule.dosesPerDay = scheduleData.schedule.dosesPerDay;
          }
          if (scheduleData.schedule.hoursBetweenDoses) {
            updateData.schedule.hoursBetweenDoses =
              scheduleData.schedule.hoursBetweenDoses;
          }

          if (scheduleData.duration.days) {
            updateData.duration.days = scheduleData.duration.days;
          }

          if (scheduleData.refillReminder) {
            updateData.refillReminder = scheduleData.refillReminder;
          }

          const updateResult = await medicationService.updateMedication(
            addResult.id,
            updateData
          );

          if (updateResult.success) {
            navigation.navigate("PrescriptionsMain");
          } else {
            throw new Error(
              updateResult.error || "Failed to update medication details"
            );
          }
        } else {
          throw new Error(addResult.error || "Failed to add medication");
        }
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save medication"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEdit = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <BackIcon />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditMode ? "Confirm Changes" : "Review & Confirm"}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Medication Summary</Text>

          {/* Medication Name */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Medication</Text>
            <View style={styles.summaryValueContainer}>
              <Text style={styles.summaryValue}>{brandName}</Text>
              {genericName && (
                <Text style={styles.summarySubValue}>{genericName}</Text>
              )}
            </View>
          </View>

          {/* Dosage */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Dosage</Text>
            <Text style={styles.summaryValue}>{scheduleData?.dosage || "Not specified"}</Text>
          </View>

          {/* Schedule */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Schedule</Text>
            <View style={styles.summaryValueContainer}>
              <Text style={styles.summaryValue}>
                {scheduleData?.schedule?.frequency || "Not specified"}
              </Text>
              <Text style={styles.summarySubValue}>{formatTimes()}</Text>
            </View>
          </View>

          {/* Duration */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{formatDuration()}</Text>
          </View>

          {/* Refill Reminder - only show if set */}
          {scheduleData.refillReminder && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Refill Reminder</Text>
              <Text style={styles.summaryValue}>
                Every {scheduleData.refillReminder} days
              </Text>
            </View>
          )}

          {/* Edit Button */}
          <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
            <Text style={styles.editButtonText}>✏️ Edit Details</Text>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            {isEditMode
              ? "These changes will be saved to your medication schedule."
              : "This medication will be added to your daily schedule. You'll receive reminders at the times you specified."}
          </Text>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Bottom Button */}
        <Button
          variant="default"
          size="lg"
          onPress={handleConfirm}
          disabled={saving}
          style={styles.confirmButton}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : isEditMode ? (
            "Save Changes"
          ) : (
            "Add Medication"
          )}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backIcon: {
    fontSize: 24,
    color: "#3B82F6",
    marginRight: 4,
  },
  backText: {
    fontSize: 16,
    color: "#3B82F6",
    fontWeight: "500",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  summaryLabel: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
  },
  summaryValueContainer: {
    flex: 2,
    alignItems: "flex-end",
  },
  summaryValue: {
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "600",
    textAlign: "right",
  },
  summarySubValue: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
    textAlign: "right",
  },
  editButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    alignItems: "center",
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3B82F6",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#1E40AF",
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  confirmButton: {
    width: "100%",
    marginTop: 24,
    marginBottom: 32,
  },
});
