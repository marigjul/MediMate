# MediMate

MediMate is a mobile medication management application that helps users track their daily medications, maintain adherence streaks, and receive timely reminders. Built with React Native and Expo, MediMate provides a seamless experience for managing your health routines.

## Overview

MediMate simplifies medication management by providing an intuitive interface for tracking prescriptions, scheduling doses, and monitoring adherence. The application integrates with the FDA database to provide accurate medication information and uses local notifications to remind users when it's time to take their medications.

## Key Features

### Medication Management

- **Search Medications**: Search the FDA database for accurate medication information
- **Add Prescriptions**: Add medications with custom schedules, dosages, and durations
- **Edit & Delete**: Modify or remove medications as prescriptions change
- **View Details**: Access comprehensive medication information including warnings, dosage instructions, and active ingredients

### Daily Tracking

- **Today's Schedule**: View all medications scheduled for the current day
- **Status Tracking**: Mark medications as taken, skipped, or missed
- **Visual Timeline**: See your medication schedule organized by time
- **Tomorrow Preview**: Check upcoming medications for better planning

### Reminders & Notifications

- **Scheduled Notifications**: Receive timely reminders for each medication dose
- **Grouped Reminders**: Medications scheduled at the same time are grouped together
- **Custom Scheduling**: Set specific times for each medication
- **Permission Management**: Simple notification permission setup

### Adherence Tracking

- **Streak Counter**: Track consecutive days of medication adherence
- **Automatic Updates**: Streaks update automatically based on daily completion
- **Refill Reminders**: Get notified when it's time to refill prescriptions
- **Duration Tracking**: Monitor limited-duration medication courses

### User Profile

- **Account Management**: Update profile information and settings
- **Password Security**: Change password with secure reauthentication
- **Logout**: Secure sign-out functionality

## Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Native Stack & Bottom Tabs)
- **Backend**: Firebase (Authentication & Firestore)
- **Notifications**: Expo Notifications
- **State Management**: React Context API
- **Testing**: Jest & React Native Testing Library
- **Language**: TypeScript

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher (v20.x recommended)
- **npm**: v9.0.0 or higher (comes with Node.js)
- **iOS Development** (macOS only):
  - Xcode 14.0 or higher
  - iOS Simulator
  - CocoaPods (`sudo gem install cocoapods`)
- **Android Development**:
  - Android Studio
  - Android SDK (API level 31 or higher)
  - Java Development Kit (JDK 17)
- **Expo CLI**: No global installation needed (use `npx expo`)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/marigjul/medimate.git
   cd medimate
   ```

   **Important**: If you plan to deploy with Xcode, ensure the project path contains no spaces. Xcode may have issues with spaces in directory paths.

2. Install dependencies:

   ```bash
   npm install
   ```

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" and follow the setup wizard
3. Once created, click on the web icon (</>) to add a web app

### 2. Enable Required Services

- **Authentication**: Go to Authentication → Sign-in method → Enable "Email/Password"
- **Firestore**: Go to Firestore Database → Create database → Start in test mode

### 3. Configure Your App

1. Copy your Firebase configuration from Project Settings → General
2. Create a `.env.local` file in the project root:

```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
```

3. The app will automatically use these environment variables

**Note:** Never commit `.env.local` to version control. A `.env.example` file is provided as a template.

---

### Running the Application

#### Development Mode

Start the Expo development server:

```bash
npx expo start
```

This will open the Expo DevTools in your browser with options to:

- Press `i` to open in iOS Simulator
- Press `a` to open in Android Emulator
- Scan the QR code with Expo Go app on your physical device

#### Build for Development

To run a native build on iOS:

```bash
npx expo run:ios
```

To run a native build on Android:

```bash
npx expo run:android
```

Note: For iOS builds, you need Xcode installed. For Android builds, you need Android Studio with Android SDK configured.

#### Production Build

For production builds, you'll need to:

1. Configure app signing (iOS: Xcode, Android: Android Studio)
2. Build the native app:
   - iOS: Open the project in Xcode (`ios/dimaapp.xcworkspace`) and archive
   - Android: Use Android Studio or `./gradlew assembleRelease` in the android folder

## Project Structure

```text
medimate/
├── app/
│   ├── components/       # Reusable UI components
│   ├── config/          # Firebase and app configuration
│   ├── contexts/        # React Context providers (Auth, Notifications)
│   ├── navigation/      # Navigation configuration
│   ├── screens/         # Application screens
│   ├── services/        # Business logic and API services
│   └── types/           # TypeScript type definitions
├── assets/              # Images, fonts, and static resources
├── ios/                 # iOS native project files
└── coverage/            # Test coverage reports
```

## Usage

### First Time Setup

1. **Create an Account**: Launch the app and sign up with your email and password
2. **Grant Permissions**: Allow notification permissions to receive medication reminders
3. **Add Your First Medication**:
   - Navigate to the Prescriptions tab
   - Tap "Add Medication"
   - Search for your medication in the FDA database
   - Review medication details
   - Set up your schedule (times, frequency, duration)
   - Confirm and save

### Daily Usage

1. **Check Today's Schedule**: Open the Home tab to see all medications for today
2. **Mark Medications**: Tap on a medication card to mark it as taken, skipped, or missed
3. **View All Prescriptions**: Go to Prescriptions tab to manage all your medications
4. **Edit Schedules**: Tap on any medication to view details and make changes
5. **Track Progress**: Monitor your adherence streaks for each medication

### Managing Medications

- **Edit**: Tap on a medication in the Prescriptions tab, then use the edit button
- **Delete**: Long-press or tap the delete option in medication details
- **View Details**: Tap any medication to see full FDA information, warnings, and dosage instructions
- **Refill Tracking**: Set refill reminders when adding or editing medications

## Testing

MediMate has comprehensive test coverage with 550+ tests across all components, screens, services, and contexts.

For detailed information about testing, see [TESTING.md](TESTING.md).

Quick test commands:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```
