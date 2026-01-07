# MediMate Navigation Structure

## Overview
The app uses a hierarchical navigation structure with two main flows: **Authenticated** (logged in) and **Unauthenticated** (logged out).

## Navigation Architecture

```
RootNavigator (decides based on auth state)
├── AuthNavigator (when logged out)
│   └── LoginScreen
│
└── MainNavigator (when logged in) - Bottom Tabs
    ├── Home Tab → HomeStack
    │   └── HomeMain (HomeScreen)
    │       └── [Add more home screens here]
    │
    ├── Prescriptions Tab → PrescriptionsStack
    │   └── PrescriptionsMain (PrescriptionsScreen)
    │       └── [Add more prescription screens here]
    │
    └── Profile Tab → ProfileStack
        └── ProfileMain (ProfileScreen)
            └── EditProfile (EditProfileScreen)
                └── [Add more profile screens here]
```

## Key Files

### `/app/contexts/AuthContext.tsx`
- Manages authentication state using Firebase
- Listens to Firebase auth state changes
- Provides `user` and `loading` state to the app
- Used to determine which navigation flow to show

### `/app/navigation/RootNavigator.tsx`
- Main navigation configuration
- Switches between Auth and Main navigators based on login state
- Contains all navigator definitions:
  - `AuthNavigator` - Login flow
  - `MainNavigator` - Bottom tab navigation
  - `HomeNavigator` - Home stack
  - `PrescriptionsNavigator` - Prescriptions stack
  - `ProfileNavigator` - Profile stack

### `/app/types/navigation.ts`
- TypeScript type definitions for all navigation routes
- Ensures type-safe navigation throughout the app
- Defines param lists for each navigator

### `/App.tsx`
- Entry point that wraps the app with:
  - `AuthProvider` - Provides auth context
  - `NavigationContainer` - React Navigation container
  - `RootNavigator` - Main navigation logic

## How It Works

1. **App Startup**
   - `AuthProvider` checks Firebase auth state
   - Shows loading spinner while checking
   - Once resolved, `RootNavigator` shows appropriate flow

2. **Logged Out Flow**
   - User sees `LoginScreen` only
   - After successful login, Firebase auth state changes
   - `AuthContext` updates, triggering navigation to Main app

3. **Logged In Flow**
   - User sees bottom tab navigation with 3 tabs
   - Each tab has its own stack navigator
   - Can navigate to nested screens within each tab
   - Tab bar persists across screens in each stack

4. **Logout**
   - User taps logout in ProfileScreen
   - Firebase auth state cleared
   - `AuthContext` updates, navigating back to LoginScreen

## Adding New Screens

### Add a new screen to existing stack (e.g., Profile)

1. Create the screen component in `/app/screens/profile/`
2. Add the route to type definitions in `/app/types/navigation.ts`:
   ```typescript
   export type ProfileStackParamList = {
     ProfileMain: undefined;
     EditProfile: undefined;
     NewScreen: { paramName: string }; // Add this
   };
   ```
3. Add to ProfileNavigator in `/app/navigation/RootNavigator.tsx`:
   ```typescript
   import NewScreen from '../screens/profile/NewScreen';
   
   function ProfileNavigator() {
     return (
       <ProfileStack.Navigator>
         <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
         <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
         <ProfileStack.Screen name="NewScreen" component={NewScreen} />
       </ProfileStack.Navigator>
     );
   }
   ```
4. Navigate to it from any screen in ProfileStack:
   ```typescript
   import { useNavigation } from '@react-navigation/native';
   import type { ProfileNavigationProp } from '../types/navigation';
   
   const navigation = useNavigation<ProfileNavigationProp>();
   navigation.navigate('NewScreen', { paramName: 'value' });
   ```

### Add a new top-level tab

1. Create the screen and stack navigator
2. Add to `MainTabParamList` in `/app/types/navigation.ts`
3. Create a new stack navigator in `RootNavigator.tsx`
4. Add a new `Tab.Screen` to `MainNavigator`

## Navigation Usage Examples

### Navigate to a screen
```typescript
import { useNavigation } from '@react-navigation/native';
import type { ProfileNavigationProp } from '../types/navigation';

const navigation = useNavigation<ProfileNavigationProp>();
navigation.navigate('EditProfile');
```

### Navigate with parameters
```typescript
navigation.navigate('MedicationDetails', { medicationId: '123' });
```

### Go back
```typescript
navigation.goBack();
```

### Access route parameters
```typescript
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { ProfileStackParamList } from '../types/navigation';

type EditProfileRouteProp = RouteProp<ProfileStackParamList, 'EditProfile'>;

const route = useRoute<EditProfileRouteProp>();
const { paramName } = route.params;
```

### Access auth state
```typescript
import { useAuth } from '../contexts/AuthContext';

const { user, loading } = useAuth();
```

## Benefits of This Structure

1. **Type Safety** - TypeScript ensures you can't navigate to non-existent screens
2. **Separation** - Auth and main app flows are completely separate
3. **Nested Navigation** - Each tab can have its own navigation stack
4. **Persistent Tabs** - Tab bar stays visible while navigating within stacks
5. **Auto Navigation** - Auth state changes automatically trigger navigation
6. **Scalable** - Easy to add new screens and tabs as the app grows
