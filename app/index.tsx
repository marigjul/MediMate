import { ScrollView, StyleSheet, Text, View } from "react-native";

/**
 * Home Screen - MediMate Main Page
 */
export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.greeting}>Good morning! 👋</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Schedule</Text>
          <Text style={styles.cardSubtitle}>
            You have 3 medications to take today
          </Text>

          <View style={styles.medicationItem}>
            <Text style={styles.time}>08:00 AM</Text>
            <Text style={styles.medicationName}>Ibuprofen</Text>
            <Text style={styles.status}>⏰ Upcoming</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔥 Current Streak</Text>
          <Text style={styles.streakCount}>7 days</Text>
          <Text style={styles.cardSubtitle}>Keep it up!</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eff6ff",
  },
  content: {
    padding: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
  },
  medicationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  time: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
  },
  medicationName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
  },
  status: {
    fontSize: 14,
    color: "#64748b",
  },
  streakCount: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#3b82f6",
    textAlign: "center",
    marginVertical: 8,
  },
});
