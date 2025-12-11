import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "./app/screens/HomeScreen";
import ProfileScreen from "./app/screens/ProfileScreen";
import PrescriptionsScreen from "./app/screens/PrescriptionsScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#2563EB",
          tabBarInactiveTintColor: "#9CA3AF",
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Prescriptions"
          component={PrescriptionsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="pill" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="account"
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
