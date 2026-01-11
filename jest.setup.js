// Simple Jest setup for React Native Testing Library

// Mock Firebase - must be first to prevent ES module imports
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  updatePassword: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  EmailAuthProvider: {
    credential: jest.fn(),
  },
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

jest.mock("./app/config/firebase.js", () => ({
  auth: { currentUser: null },
  db: {},
}));

// Mock services
jest.mock("./app/services/authService.js", () => ({
  authService: {
    logout: jest.fn(),
    updateUserProfile: jest.fn(),
    updateUserPassword: jest.fn(),
  },
}));

// Mock ConfirmationModal
jest.mock("./app/components/ConfirmationModal.tsx", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");
  return function MockConfirmationModal({
    visible,
    onConfirm,
    onCancel,
    title,
    message,
    confirmText,
    cancelText = "Cancel",
  }) {
    if (!visible) return null;
    return React.createElement(
      View,
      null,
      React.createElement(Text, { testID: "modal-title" }, title),
      React.createElement(Text, { testID: "modal-message" }, message),
      React.createElement(
        TouchableOpacity,
        { testID: "modal-confirm", onPress: onConfirm, accessible: true },
        React.createElement(Text, null, confirmText)
      ),
      React.createElement(
        TouchableOpacity,
        { testID: "modal-cancel", onPress: onCancel, accessible: true },
        React.createElement(Text, null, cancelText)
      )
    );
  };
});

// Mock Expo vector icons
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: (props) => React.createElement(Text, props, props.name),
    MaterialCommunityIcons: (props) =>
      React.createElement(Text, props, props.name),
  };
});

// Mock React Navigation
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useFocusEffect: jest.fn((callback) => callback()),
}));
