import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

/**
 * Tabs Layout - Main App Navigation
 *
 * Three main tabs:
 * - Home: Daily medication overview
 * - Prescriptions: All medications list
 * - Profile: User settings
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3b82f6", // blue-500
        tabBarInactiveTintColor: "#94a3b8", // slate-400
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e2e8f0", // slate-200
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        headerStyle: {
          backgroundColor: "#3b82f6", // blue-500
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
          headerTitle: "🏥 MediMate",
        }}
      />
      <Tabs.Screen
        name="prescriptions"
        options={{
          title: "Prescriptions",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="pill" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
