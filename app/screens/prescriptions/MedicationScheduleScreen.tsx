import { Button } from "@/app/components/button";
import { medicationService } from "@/app/services/medicationService";
import { HomeStackParamList, PrescriptionsStackParamList } from "@/app/types/navigation";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { deleteField } from "firebase/firestore";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

// Support navigation from both Home and Prescriptions stacks
type MedicationScheduleNavigationProp = 
  | NativeStackNavigationProp<PrescriptionsStackParamList, "MedicationSchedule">
  | NativeStackNavigationProp<HomeStackParamList, "MedicationSchedule">;

type MedicationScheduleRouteProp = 
  | RouteProp<PrescriptionsStackParamList, "MedicationSchedule">
  | RouteProp<HomeStackParamList, "MedicationSchedule">;

const BackIcon = () => <Text style={styles.backIcon}>←</Text>;
const PlusIcon = () => <Text style={styles.plusIcon}>+</Text>;
const MinusIcon = () => <Text style={styles.minusIcon}>−</Text>;

export default function MedicationScheduleScreen() {
  const navigation = useNavigation<MedicationScheduleNavigationProp>();
  const route = useRoute<MedicationScheduleRouteProp>();
  const {
    medicationName,
    brandName,
    genericName,
    fdaData,
    existingMedication,
  } = route.params;

  const isEditMode = !!existingMedication;

  // Form state
  const [dosage, setDosage] = useState(existingMedication?.dosage || "");
  const [scheduleType, setScheduleType] = useState<
    "interval" | "specific_times"
  >(existingMedication?.schedule?.type || "interval");

  // Interval schedule fields
  const [startTime, setStartTime] = useState(
    existingMedication?.schedule?.startTime || ""
  );
  const [dosesPerDay, setDosesPerDay] = useState(
    existingMedication?.schedule?.dosesPerDay?.toString() || ""
  );
  const [hoursBetweenDoses, setHoursBetweenDoses] = useState(
    existingMedication?.schedule?.hoursBetweenDoses?.toString() || ""
  );

  // Specific times schedule
  const [times, setTimes] = useState<string[]>(
    existingMedication?.schedule?.times || [""]
  );

  const [durationType, setDurationType] = useState<"permanent" | "limited">(
    existingMedication?.duration?.type || "permanent"
  );
  const [durationDays, setDurationDays] = useState(
    existingMedication?.duration?.days?.toString() || ""
  );
  const [refillReminderDays, setRefillReminderDays] = useState(
    existingMedication?.refillReminder?.toString() || ""
  );

  // Error state
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAddTime = () => {
    if (times.length < 6) {
      // Get the last time, default to "09:00" if empty or invalid
      const lastTime = times[times.length - 1] || "09:00";
      const timeParts = lastTime.split(":");

      // Ensure we have valid time parts
      if (timeParts.length === 2) {
        const [hours, minutes] = timeParts.map(Number);

        // Check if hours and minutes are valid numbers
        if (!isNaN(hours) && !isNaN(minutes)) {
          let newHours = hours + 4;
          if (newHours >= 24) newHours -= 24;
          const newTime = `${newHours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}`;
          setTimes([...times, newTime]);
          return;
        }
      }

      // If we couldn't parse the last time, default to "09:00"
      setTimes([...times, "09:00"]);
    }
  };

  const handleRemoveTime = (index: number) => {
    if (times.length > 1) {
      setTimes(times.filter((_, i) => i !== index));
    }
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const validateForm = () => {
    setError(""); // Clear any previous errors

    if (!dosage.trim()) {
      setError("Please enter the dosage");
      return false;
    }

    if (scheduleType === "interval") {
      if (!startTime.match(/^\d{2}:\d{2}$/)) {
        setError("Please enter start time in HH:MM format (e.g., 09:00)");
        return false;
      }

      const doses = parseInt(dosesPerDay);
      if (!dosesPerDay || isNaN(doses) || doses < 1 || doses > 24) {
        setError("Please enter 1-24 doses per day");
        return false;
      }

      const hours = parseInt(hoursBetweenDoses);
      if (!hoursBetweenDoses || isNaN(hours) || hours < 1 || hours > 24) {
        setError("Please enter 1-24 hours between doses");
        return false;
      }

      // Check if any dose would exceed into the next day
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const startTimeInMinutes = startHours * 60 + startMinutes;
      const lastDoseTime = startTimeInMinutes + (doses - 1) * hours * 60;

      if (lastDoseTime >= 24 * 60) {
        setError(
          "Schedule exceeds 24 hours. Please adjust your start time or switch to 'Specific Times'"
        );
        return false;
      }
    }

    if (scheduleType === "specific_times" && times.length === 0) {
      setError("Please add at least one time");
      return false;
    }

    if (
      durationType === "limited" &&
      (!durationDays || parseInt(durationDays) < 1)
    ) {
      setError("Please enter valid number of days");
      return false;
    }

    return true;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;

    // Calculate frequency text and times for interval schedule
    let frequency = "";
    let calculatedTimes: string[] | undefined;

    if (scheduleType === "interval") {
      const doses = parseInt(dosesPerDay);
      const hours = parseInt(hoursBetweenDoses);
      frequency = `${doses}x daily (every ${hours}h)`;

      // Calculate all times based on start time, doses per day, and hours between
      calculatedTimes = [];
      const [startHours, startMinutes] = startTime.split(":").map(Number);

      for (let i = 0; i < doses; i++) {
        const totalMinutes = startHours * 60 + startMinutes + i * hours * 60;
        const hours24 = Math.floor(totalMinutes / 60) % 24;
        const minutes = totalMinutes % 60;
        const timeString = `${hours24.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;
        calculatedTimes.push(timeString);
      }
    } else {
      frequency = `${times.length}x daily`;
    }

    // Prepare schedule data using dot notation for nested fields to support deleteField()
    const scheduleData: any = {
      dosage,
      "schedule.type": scheduleType,
      "schedule.times":
        (scheduleType === "specific_times" ? times : calculatedTimes) || [],
      "schedule.frequency": frequency,
      "duration.type": durationType,
    };

    // Add interval-specific fields or use deleteField to remove them
    if (scheduleType === "interval") {
      scheduleData["schedule.startTime"] = startTime;
      scheduleData["schedule.dosesPerDay"] = parseInt(dosesPerDay);
      scheduleData["schedule.hoursBetweenDoses"] = parseInt(hoursBetweenDoses);
    } else if (isEditMode) {
      // In edit mode, explicitly delete interval fields when switching to specific times
      scheduleData["schedule.startTime"] = deleteField();
      scheduleData["schedule.dosesPerDay"] = deleteField();
      scheduleData["schedule.hoursBetweenDoses"] = deleteField();
    }

    // Handle duration days
    if (durationType === "limited") {
      scheduleData["duration.days"] = parseInt(durationDays);
    } else if (isEditMode) {
      // In edit mode, explicitly delete days field when switching to permanent
      scheduleData["duration.days"] = deleteField();
    }

    // Handle refill reminder
    if (durationType === "permanent" && refillReminderDays) {
      scheduleData.refillReminder = parseInt(refillReminderDays);
    } else if (isEditMode) {
      // In edit mode, explicitly delete refillReminder if not set
      scheduleData.refillReminder = deleteField();
    }

    // If in edit mode, update the medication directly and navigate back
    if (isEditMode && existingMedication?.id) {
      setIsUpdating(true);
      try {
        const result = await medicationService.updateMedication(
          existingMedication.id,
          scheduleData
        );

        if (result.success) {
          // Go back to the root of the stack (HomeMain or PrescriptionsMain)
          navigation.popToTop();
        } else {
          setError(result.error || "Failed to update medication");
        }
      } catch (err) {
        setError("An error occurred while updating medication");
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    // If creating new medication, navigate to confirmation screen
    // Convert dot notation to nested object for navigation
    const scheduleDataForNav = {
      dosage,
      schedule: {
        type: scheduleType,
        times: (scheduleType === "specific_times" ? times : calculatedTimes) || [],
        frequency: frequency,
        ...(scheduleType === "interval" && {
          startTime: startTime,
          dosesPerDay: parseInt(dosesPerDay),
          hoursBetweenDoses: parseInt(hoursBetweenDoses),
        }),
      },
      duration: {
        type: durationType,
        ...(durationType === "limited" && {
          days: parseInt(durationDays),
        }),
      },
      ...(durationType === "permanent" && refillReminderDays && {
        refillReminder: parseInt(refillReminderDays),
      }),
    };

    (navigation as any).navigate("MedicationConfirm", {
      medicationName,
      brandName,
      genericName,
      fdaData,
      scheduleData: scheduleDataForNav,
      existingMedicationId: existingMedication?.id,
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <BackIcon />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditMode ? "Edit Medication" : "Set Up Schedule"}
        </Text>
        <Text style={styles.subtitle}>{brandName}</Text>
      </View>

      {/* Form */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Dosage */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Dosage *</Text>
          <Text style={styles.helperText}>
            e.g., "500mg", "2 tablets", "10ml"
          </Text>
          <TextInput
            style={styles.input}
            value={dosage}
            onChangeText={setDosage}
            placeholder="Enter dosage"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Schedule Type */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Schedule Type *</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                scheduleType === "interval" && styles.toggleButtonActive,
              ]}
              onPress={() => setScheduleType("interval")}
            >
              <Text
                style={[
                  styles.toggleText,
                  scheduleType === "interval" && styles.toggleTextActive,
                ]}
              >
                Every X Hours
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                scheduleType === "specific_times" && styles.toggleButtonActive,
              ]}
              onPress={() => setScheduleType("specific_times")}
            >
              <Text
                style={[
                  styles.toggleText,
                  scheduleType === "specific_times" && styles.toggleTextActive,
                ]}
              >
                Specific Times
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Interval Schedule */}
        {scheduleType === "interval" && (
          <>
            <View style={styles.formSection}>
              <Text style={styles.label}>Start Time *</Text>
              <Text style={styles.helperText}>
                When do you take the first dose?
              </Text>
              <TextInput
                style={styles.input}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="e.g. 09:00"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Doses Per Day *</Text>
              <Text style={styles.helperText}>How many times per day?</Text>
              <TextInput
                style={styles.input}
                value={dosesPerDay}
                onChangeText={setDosesPerDay}
                placeholder="e.g. 3"
                keyboardType="number-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Hours Between Doses *</Text>
              <Text style={styles.helperText}>
                How many hours between each dose?
              </Text>
              <TextInput
                style={styles.input}
                value={hoursBetweenDoses}
                onChangeText={setHoursBetweenDoses}
                placeholder="e.g. 8"
                keyboardType="number-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </>
        )}

        {/* Specific Times Schedule */}
        {scheduleType === "specific_times" && (
          <View style={styles.formSection}>
            <Text style={styles.label}>Times *</Text>
            <Text style={styles.helperText}>Add up to 6 times per day</Text>
            {times.map((time, index) => (
              <View key={index} style={styles.timeRow}>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  value={time}
                  onChangeText={(value) => handleTimeChange(index, value)}
                  placeholder="09:00"
                  placeholderTextColor="#9CA3AF"
                />
                {times.length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleRemoveTime(index)}
                    style={styles.removeButton}
                  >
                    <MinusIcon />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {times.length < 6 && (
              <TouchableOpacity
                onPress={handleAddTime}
                style={styles.addTimeButton}
              >
                <PlusIcon />
                <Text style={styles.addTimeText}>Add Time</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Duration Type */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Medication Duration *</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                durationType === "permanent" && styles.toggleButtonActive,
              ]}
              onPress={() => setDurationType("permanent")}
            >
              <Text
                style={[
                  styles.toggleText,
                  durationType === "permanent" && styles.toggleTextActive,
                ]}
              >
                Permanent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                durationType === "limited" && styles.toggleButtonActive,
              ]}
              onPress={() => setDurationType("limited")}
            >
              <Text
                style={[
                  styles.toggleText,
                  durationType === "limited" && styles.toggleTextActive,
                ]}
              >
                Time-limited course
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Duration Days */}
        {durationType === "limited" && (
          <View style={styles.formSection}>
            <Text style={styles.label}>Number of Days *</Text>
            <TextInput
              style={styles.input}
              value={durationDays}
              onChangeText={setDurationDays}
              placeholder="14"
              keyboardType="number-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        )}

        {/* Refill Reminder - only for permanent medications */}
        {durationType === "permanent" && (
          <View style={styles.formSection}>
            <Text style={styles.label}>Refill Reminder (days)</Text>
            <Text style={styles.helperText}>
              Optional: Get reminded to refill every X days
            </Text>
            <TextInput
              style={styles.input}
              value={refillReminderDays}
              onChangeText={setRefillReminderDays}
              placeholder="30"
              keyboardType="number-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        )}

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
          onPress={handleContinue}
          style={styles.continueButton}
          disabled={isUpdating}
        >
          {isUpdating
            ? "Updating..."
            : isEditMode
            ? "Update Medication"
            : "Continue to Review"}
        </Button>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#E0F2FE",
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1F2937",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    overflow: "hidden",
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#3B82F6",
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  toggleTextActive: {
    color: "#FFFFFF",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  timeInput: {
    flex: 1,
    marginBottom: 0,
  },
  removeButton: {
    width: 44,
    height: 44,
    marginLeft: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  minusIcon: {
    fontSize: 24,
    color: "#DC2626",
    fontWeight: "600",
  },
  addTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#3B82F6",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 16,
  },
  plusIcon: {
    fontSize: 20,
    color: "#3B82F6",
    marginRight: 8,
    fontWeight: "600",
  },
  addTimeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
  },
  bottomPadding: {
    height: 32,
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  continueButton: {
    width: "100%",
    marginBottom: 32,
  },
});
