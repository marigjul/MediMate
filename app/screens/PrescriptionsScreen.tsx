import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { authService } from "../services/authService";
import { medicationService } from "../services/medicationService";

export default function PrescriptionsScreen() {
  const testFullFlow = async () => {
    console.log("🧪 Starting full test...");
    
    // 1. Login with existing user
    const login = await authService.login("jan.banan@hotmail.com", "passord");
    console.log("1. Login:", login.success ? "✅" : "❌", login);
    
    if (!login.success) return;
    
    const user = authService.getCurrentUser();
    console.log("2. Current user UID:", user?.uid);
    
    // 2. Add medication (will fetch from FDA API and cache it)
    const scheduleData = {
      times: ["09:00", "21:00"],
      frequency: "daily",
      duration: "permanent",
    };
    
    const addResult = await medicationService.addMedicationWithFDA(
      user?.uid,
      "Aspirin",
      scheduleData
    );
    console.log("3. Add medication:", addResult.success ? "✅" : "❌");
    console.log("   FDA Data:", addResult.fdaData);
    
    // 3. Get all medications for user
    const getMeds = await medicationService.getUserMedications(user?.uid);
    console.log("4. Get medications:", getMeds.success ? "✅" : "❌");
    console.log("   Total medications:", getMeds.medications?.length);
    console.log("   Medications:", getMeds.medications);
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <TouchableOpacity 
        onPress={testFullFlow}
        style={{ backgroundColor: "#007AFF", padding: 20, borderRadius: 10 }}
      >
        <Text style={{ color: "white", textAlign: "center", fontSize: 16 }}>
          🧪 Test Full Flow (Check Console)
        </Text>
      </TouchableOpacity>
      
      <Text style={{ marginTop: 20, textAlign: "center", color: "#666" }}>
        1. Login as Jan Banan{"\n"}
        2. Add Aspirin medication{"\n"}
        3. Fetch all medications{"\n"}
        {"\n"}
        Check Metro console for results
      </Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 20,
  },
});
