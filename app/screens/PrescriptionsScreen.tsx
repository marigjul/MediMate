import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "../components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/card";

// Icons (replace these with actual icon components later)
const PlusIcon = () => <Text style={styles.icon}>+</Text>;
const ChevronRightIcon = () => <Text style={styles.chevron}>›</Text>;
const CalendarIcon = () => <Text style={styles.iconEmoji}>📅</Text>;
const TrendingUpIcon = () => <Text style={styles.iconEmoji}>📈</Text>;

interface Medication {
  id: string;
  medicationName: string;
  schedule: {
    times: string[];
    frequency: string;
    duration: string;
  };
  streak?: number;
  fdaData?: {
    brandName?: string;
    genericName?: string;
  };
  refillReminder?: number;
}

export default function PrescriptionsScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  // Stub data for initial development
  const stubMedications: Medication[] = [
    {
      id: "1",
      medicationName: "amoxicillin",
      schedule: {
        times: ["09:00", "17:00", "21:00"],
        frequency: "Every 8h",
        duration: "14 days",
      },
      streak: 3,
      fdaData: {
        brandName: "Amoxicillin",
        genericName: "Amoxicillin",
      },
    },
    {
      id: "2",
      medicationName: "lisinopril",
      schedule: {
        times: ["09:00"],
        frequency: "1x daily",
        duration: "permanent",
      },
      streak: 14,
      refillReminder: 30,
      fdaData: {
        brandName: "Lisinopril",
        genericName: "Lisinopril",
      },
    },
  ];

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      setLoading(true);

      // For now, use stub data while Firebase auth is being set up
      // TODO: Implement proper auth flow before calling getCurrentUser()
      setMedications(stubMedications);

      /* Uncomment this when auth is properly set up:
      const user = authService.getCurrentUser();

      if (user) {
        const result = await medicationService.getUserMedications(user.uid);
        if (
          result.success &&
          result.medications &&
          result.medications.length > 0
        ) {
          setMedications(result.medications);
        } else {
          setMedications(stubMedications);
        }
      } else {
        setMedications(stubMedications);
      }
      */
    } catch (error) {
      console.error("Error loading medications:", error);
      setMedications(stubMedications);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = () => {
    // TODO: Navigate to medication search screen
    // This will connect to FDA API and medicationService.addMedicationWithFDA
    console.log("Add Medication button pressed - will implement navigation");
  };

  const handleMedicationPress = (medication: Medication) => {
    // TODO: Navigate to medication detail screen
    console.log("Medication pressed:", medication.id);
  };

  const formatSchedule = (medication: Medication) => {
    const { schedule } = medication;
    const times = schedule.times || [];

    if (times.length === 0) return schedule.frequency || "No schedule";

    const startTime = times[0];
    const endTime = times[times.length - 1];

    if (times.length === 1) {
      return `${schedule.frequency} at ${startTime}`;
    } else {
      return `${schedule.frequency} from ${startTime} to ${endTime}`;
    }
  };

  const formatDuration = (medication: Medication) => {
    const duration = medication.schedule.duration;
    if (duration === "permanent") {
      return null;
    }

    // Parse duration like "14 days" and calculate progress
    const match = duration.match(/(\d+)\s*days?/);
    if (match) {
      const totalDays = parseInt(match[1]);
      const currentDay = medication.streak || 0;
      return `${currentDay}/${totalDays}\ndays`;
    }

    return duration;
  };

  const renderMedicationCard = (medication: Medication) => {
    const displayName =
      medication.fdaData?.brandName ||
      medication.medicationName.charAt(0).toUpperCase() +
        medication.medicationName.slice(1);

    const durationText = formatDuration(medication);
    const hasStreak = medication.streak && medication.streak > 0;

    return (
      <TouchableOpacity
        key={medication.id}
        onPress={() => handleMedicationPress(medication)}
        activeOpacity={0.7}
      >
        <Card style={styles.medicationCard}>
          <CardHeader>
            <CardTitle>{displayName}</CardTitle>
            <CardDescription>{formatSchedule(medication)}</CardDescription>
          </CardHeader>

          {(durationText || hasStreak) && (
            <CardContent style={styles.cardContentRow}>
              {durationText && (
                <View style={styles.infoItem}>
                  <CalendarIcon />
                  <Text style={styles.infoText}>{durationText}</Text>
                </View>
              )}

              {hasStreak && (
                <View style={styles.infoItem}>
                  <TrendingUpIcon />
                  <Text style={styles.streakText}>
                    {medication.streak}-day{"\n"}streak
                  </Text>
                </View>
              )}
            </CardContent>
          )}

          {medication.refillReminder && (
            <CardFooter>
              <Text style={styles.refillText}>
                Refill reminder: Every {medication.refillReminder} days
              </Text>
            </CardFooter>
          )}

          <CardAction>
            <ChevronRightIcon />
          </CardAction>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Prescriptions</Text>
        </View>

        {/* Add Medication Button */}
        <Button
          variant="default"
          size="default"
          onPress={handleAddMedication}
          icon={<PlusIcon />}
          iconPosition="left"
          style={styles.addButton}
        >
          Add Medication
        </Button>

        {/* Medications List */}
        <View style={styles.medicationsList}>
          {medications.length > 0 ? (
            medications.map(renderMedicationCard)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No medications yet. Add your first medication to get started.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
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
    backgroundColor: "#F3F4F6",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 8,
    backgroundColor: "#E0F2FE",
    padding: 20,
    borderRadius: 12,
    marginHorizontal: -20,
    marginTop: -10,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1E40AF",
  },
  addButton: {
    marginBottom: 24,
  },
  medicationsList: {
    gap: 16,
  },
  medicationCard: {
    marginBottom: 0,
  },
  cardContentRow: {
    flexDirection: "row",
    gap: 24,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "600",
    lineHeight: 18,
  },
  streakText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
    lineHeight: 18,
  },
  refillText: {
    fontSize: 14,
    color: "#6B7280",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
  },
  icon: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  chevron: {
    fontSize: 28,
    color: "#9CA3AF",
    fontWeight: "300",
  },
  iconEmoji: {
    fontSize: 18,
  },
});
