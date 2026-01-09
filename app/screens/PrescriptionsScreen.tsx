import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
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

// Icons
const PlusIcon = () => <Text style={styles.icon}>+</Text>;
const ChevronRightIcon = () => (
  <MaterialCommunityIcons name="chevron-right" size={28} color="#9CA3AF" />
);

type PrescriptionsScreenNavigationProp = NativeStackNavigationProp<
  PrescriptionsStackParamList,
  "PrescriptionsMain"
>;

interface Medication {
  id: string;
  medicationName: string;
  schedule: {
    times?: string[];
    frequency: string;
    duration?: string;
  };
  duration?: {
    type: "permanent" | "limited";
    days?: number;
  };
  streak?: number;
  fdaData?: {
    brandName?: string;
    genericName?: string;
  };
  refillReminder?: number;
  dosage?: string;
}

export default function PrescriptionsScreen() {
  const navigation = useNavigation<PrescriptionsScreenNavigationProp>();
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMedications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await medicationService.getUserMedications(user.uid);

      if (result.success) {
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
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadMedications();
      } else {
        setLoading(false);
        setMedications([]);
      }
    }, [user, loadMedications])
  );

  const handleAddMedication = () => {
    navigation.navigate("MedicationSearch");
  };

  const handleMedicationPress = (medication: Medication) => {
    navigation.navigate("MedicationView", { medication });
  };

  const formatSchedule = (medication: Medication) => {
    const { schedule } = medication;
    const times = schedule.times || [];

    if (times.length === 0) return schedule.frequency || "No schedule";

    const startTime = times[0];
    const endTime = times[times.length - 1];

    if (times.length === 1) {
      return `${schedule.frequency} at ${startTime}`;
    } else if (times.length === 2) {
      return `${schedule.frequency} at ${times.join(" and ")}`;
    } else {
      return `${schedule.frequency} from ${startTime} to ${endTime}`;
    }
  };

  const isPermanentMedication = (medication: Medication): boolean => {
    if (medication.duration) {
      return medication.duration.type === "permanent";
    }
    if (medication.schedule.duration) {
      return medication.schedule.duration === "permanent";
    }
    return false;
  };

  const formatDuration = (medication: Medication) => {
    if (medication.duration) {
      if (medication.duration.type === "permanent") {
        return null;
      }
      if (medication.duration.type === "limited" && medication.duration.days) {
        const currentDay = medication.streak || 0;
        return `${currentDay}/${medication.duration.days} days`;
      }
      return null;
    }

    const duration = medication.schedule.duration;
    if (!duration || duration === "permanent") {
      return null;
    }

    const match = duration.match(/(\d+)\s*days?/);
    if (match) {
      const totalDays = parseInt(match[1]);
      const currentDay = medication.streak || 0;
      return `${currentDay}/${totalDays} days`;
    }

    return duration;
  };

  const renderMedicationCard = (medication: Medication) => {
    const displayName =
      medication.fdaData?.brandName ||
      medication.medicationName.charAt(0).toUpperCase() +
        medication.medicationName.slice(1);

    const isPermanent = isPermanentMedication(medication);
    const durationText = formatDuration(medication);

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

          <CardContent>
            <View style={styles.cardContentRow}>
              {!isPermanent && durationText && (
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons
                    name="calendar-clock"
                    size={18}
                    color="#3B82F6"
                  />
                  <Text style={styles.infoText}>{durationText}</Text>
                </View>
              )}

              {isPermanent && (
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons
                    name="fire"
                    size={18}
                    color="#10B981"
                  />
                  <Text style={styles.streakText}>
                    {medication.streak || 0}-day streak
                  </Text>
                </View>
              )}

              <View style={styles.typeBadge}>
                <MaterialCommunityIcons
                  name={isPermanent ? "infinity" : "clock-outline"}
                  size={14}
                  color="#9CA3AF"
                />
                <Text style={styles.typeText}>
                  {isPermanent ? "Permanent" : "Time-limited"}
                </Text>
              </View>
            </View>
          </CardContent>

          {isPermanent && medication.refillReminder && (
            <>
              <View style={styles.divider} />
              <CardFooter>
                <Text style={styles.refillText}>
                  Refill reminder: Every {medication.refillReminder} days
                </Text>
              </CardFooter>
            </>
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
        <View style={styles.header}>
          <Text style={styles.title}>Prescriptions</Text>
        </View>

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
    marginBottom: 18,
  },
  medicationsList: {
    gap: 12,
  },
  medicationCard: {
    marginBottom: 0,
  },
  cardContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
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
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 24,
  },
  refillText: {
    fontSize: 13,
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
});
