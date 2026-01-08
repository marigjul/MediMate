import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
import { useAuth } from "../contexts/AuthContext";
import { medicationService } from "../services/medicationService";
import type { PrescriptionsStackParamList } from "../types/navigation";

// Icons (replace these with actual icon components later)
const PlusIcon = () => <Text style={styles.icon}>+</Text>;
const ChevronRightIcon = () => <Text style={styles.chevron}>›</Text>;
const CalendarIcon = () => <Text style={styles.iconEmoji}>📅</Text>;
const TrendingUpIcon = () => <Text style={styles.iconEmoji}>📈</Text>;

type PrescriptionsScreenNavigationProp = NativeStackNavigationProp<
  PrescriptionsStackParamList,
  "PrescriptionsMain"
>;

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
  const navigation = useNavigation<PrescriptionsScreenNavigationProp>();
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load medications when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadMedications();
    } else {
      setLoading(false);
      setMedications([]);
    }
  }, [user]);

  const loadMedications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Loading medications for user:", user.uid);

      const result = await medicationService.getUserMedications(user.uid);

      if (result.success) {
        console.log("Medications loaded:", result.medications?.length || 0);
        setMedications(result.medications || []);
      } else {
        console.error("Failed to load medications:", result.error);
        setError(result.error || "Failed to load medications");
        setMedications([]);
      }
    } catch (error) {
      console.error("Error loading medications:", error);
      setError("An unexpected error occurred");
      setMedications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = () => {
    navigation.navigate("MedicationSearch");
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
    if (!duration || duration === "permanent") {
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
        <Text style={styles.loadingText}>Loading your medications...</Text>
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

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ {error}</Text>
            <TouchableOpacity
              onPress={loadMedications}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Medications List */}
        <View style={styles.medicationsList}>
          {medications.length > 0 ? (
            medications.map(renderMedicationCard)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No medications yet</Text>
              <Text style={styles.emptyStateText}>
                Add your first medication to start tracking your prescriptions
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
    backgroundColor: "#E0F2FE",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
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
  errorContainer: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#DC2626",
    marginRight: 12,
  },
  retryButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6B7280",
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
