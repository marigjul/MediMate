import { View, Text, StyleSheet } from "react-native";

export default function PrescriptionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>You are now on prescriptions page</Text>
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
