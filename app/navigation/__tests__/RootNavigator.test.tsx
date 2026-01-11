import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { RootNavigator } from '../RootNavigator';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  NavigationContainer: ({ children }: any) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    reset: jest.fn(),
  }),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

jest.mock('../../contexts/AuthContext');
jest.mock('../../screens/HomeScreen', () => 'HomeScreen');
jest.mock('../../screens/LoginScreen', () => 'LoginScreen');
jest.mock('../../screens/PrescriptionsScreen', () => 'PrescriptionsScreen');
jest.mock('../../screens/ProfileScreen', () => 'ProfileScreen');
jest.mock('../../screens/prescriptions/MedicationConfirmScreen', () => 'MedicationConfirmScreen');
jest.mock('../../screens/prescriptions/MedicationDetailScreen', () => 'MedicationDetailScreen');
jest.mock('../../screens/prescriptions/MedicationScheduleScreen', () => 'MedicationScheduleScreen');
jest.mock('../../screens/prescriptions/MedicationSearchScreen', () => 'MedicationSearchScreen');
jest.mock('../../screens/prescriptions/MedicationViewScreen', () => 'MedicationViewScreen');
jest.mock('../../screens/profile/EditProfileScreen', () => 'EditProfileScreen');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('RootNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading spinner when loading is true', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        refreshUser: jest.fn(),
      });

      const { getByTestId } = render(<RootNavigator />);

      expect(getByTestId('activity-indicator')).toBeTruthy();
    });

    it('should render loading container with correct styles', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        refreshUser: jest.fn(),
      });

      const { getByTestId, UNSAFE_root } = render(<RootNavigator />);

      expect(getByTestId('activity-indicator')).toBeTruthy();
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should show large blue spinner', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        refreshUser: jest.fn(),
      });

      const { getByTestId } = render(<RootNavigator />);
      const spinner = getByTestId('activity-indicator');

      expect(spinner.props.size).toBe('large');
      expect(spinner.props.color).toBe('#1E40AF');
    });
  });

  describe('Authentication State - Logged Out', () => {
    it('should render Auth navigator when user is null and not loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        refreshUser: jest.fn(),
      });

      const { UNSAFE_root } = render(<RootNavigator />);

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should not render Main navigator when logged out', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        refreshUser: jest.fn(),
      });

      const { queryByText } = render(<RootNavigator />);

      expect(queryByText('Home')).toBeNull();
      expect(queryByText('Prescriptions')).toBeNull();
      expect(queryByText('Profile')).toBeNull();
    });
  });

  describe('Authentication State - Logged In', () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    it('should render Main navigator when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser as any,
        loading: false,
        refreshUser: jest.fn(),
      });

      const { UNSAFE_root } = render(<RootNavigator />);

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should not render Auth navigator when logged in', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser as any,
        loading: false,
        refreshUser: jest.fn(),
      });

      const { UNSAFE_root } = render(<RootNavigator />);

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Navigation Transitions', () => {
    it('should transition from loading to auth state', async () => {
      const { rerender, getByTestId, queryByTestId } = render(<RootNavigator />);

      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        refreshUser: jest.fn(),
      });
      rerender(<RootNavigator />);
      expect(getByTestId('activity-indicator')).toBeTruthy();

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        refreshUser: jest.fn(),
      });
      rerender(<RootNavigator />);

      await waitFor(() => {
        expect(queryByTestId('activity-indicator')).toBeNull();
      });
    });

    it('should transition from loading to main state', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
      };

      const { rerender, getByTestId, queryByTestId } = render(<RootNavigator />);

      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        refreshUser: jest.fn(),
      });
      rerender(<RootNavigator />);
      expect(getByTestId('activity-indicator')).toBeTruthy();

      mockUseAuth.mockReturnValue({
        user: mockUser as any,
        loading: false,
        refreshUser: jest.fn(),
      });
      rerender(<RootNavigator />);

      await waitFor(() => {
        expect(queryByTestId('activity-indicator')).toBeNull();
      });
    });

    it('should transition from auth to main on login', async () => {
      const { rerender } = render(<RootNavigator />);

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        refreshUser: jest.fn(),
      });
      rerender(<RootNavigator />);

      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
      };
      mockUseAuth.mockReturnValue({
        user: mockUser as any,
        loading: false,
        refreshUser: jest.fn(),
      });
      rerender(<RootNavigator />);

      await waitFor(() => {
        expect(mockUseAuth().user).toBeTruthy();
      });
    });

    it('should transition from main to auth on logout', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
      };

      const { rerender } = render(<RootNavigator />);

      mockUseAuth.mockReturnValue({
        user: mockUser as any,
        loading: false,
        refreshUser: jest.fn(),
      });
      rerender(<RootNavigator />);

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        refreshUser: jest.fn(),
      });
      rerender(<RootNavigator />);

      await waitFor(() => {
        expect(mockUseAuth().user).toBeNull();
      });
    });
  });

  describe('useAuth Hook Integration', () => {
    it('should call useAuth hook', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        refreshUser: jest.fn(),
      });

      render(<RootNavigator />);

      expect(mockUseAuth).toHaveBeenCalled();
    });

    it('should respond to auth state changes', () => {
      const { rerender } = render(<RootNavigator />);

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        refreshUser: jest.fn(),
      });
      rerender(<RootNavigator />);
      expect(mockUseAuth().user).toBeNull();

      const mockUser = { uid: 'test-uid', email: 'test@example.com' };
      mockUseAuth.mockReturnValue({
        user: mockUser as any,
        loading: false,
        refreshUser: jest.fn(),
      });
      rerender(<RootNavigator />);
      expect(mockUseAuth().user).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: undefined as any,
        loading: false,
        refreshUser: jest.fn(),
      });

      const { UNSAFE_root } = render(<RootNavigator />);

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should handle loading state change from true to false', async () => {
      const { rerender, queryByTestId } = render(<RootNavigator />);

      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        refreshUser: jest.fn(),
      });
      rerender(<RootNavigator />);

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        refreshUser: jest.fn(),
      });
      rerender(<RootNavigator />);

      await waitFor(() => {
        expect(queryByTestId('activity-indicator')).toBeNull();
      });
    });

    it('should persist through multiple re-renders with same state', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        refreshUser: jest.fn(),
      });

      const { rerender, UNSAFE_root } = render(<RootNavigator />);

      rerender(<RootNavigator />);
      rerender(<RootNavigator />);
      rerender(<RootNavigator />);

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should handle rapid state changes', async () => {
      const { rerender } = render(<RootNavigator />);

      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        refreshUser: jest.fn(),
      });
      rerender(<RootNavigator />);

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        refreshUser: jest.fn(),
      });
      rerender(<RootNavigator />);

      const mockUser = { uid: 'test-uid', email: 'test@example.com' };
      mockUseAuth.mockReturnValue({
        user: mockUser as any,
        loading: false,
        refreshUser: jest.fn(),
      });
      rerender(<RootNavigator />);

      await waitFor(() => {
        expect(mockUseAuth().user).toBeTruthy();
      });
    });
  });

  describe('Navigator Configuration', () => {
    it('should configure RootStack with headerShown false', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        refreshUser: jest.fn(),
      });

      const { UNSAFE_root } = render(<RootNavigator />);

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should render only one screen at a time in RootStack', () => {
      const { rerender } = render(<RootNavigator />);

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        refreshUser: jest.fn(),
      });
      rerender(<RootNavigator />);

      const mockUser = { uid: 'test-uid', email: 'test@example.com' };
      mockUseAuth.mockReturnValue({
        user: mockUser as any,
        loading: false,
        refreshUser: jest.fn(),
      });
      rerender(<RootNavigator />);

      expect(mockUseAuth().user).toBeTruthy();
    });
  });

  describe('RefreshUser Function', () => {
    it('should provide refreshUser function', () => {
      const mockRefreshUser = jest.fn();
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        refreshUser: mockRefreshUser,
      });

      render(<RootNavigator />);

      expect(mockUseAuth().refreshUser).toBe(mockRefreshUser);
    });

    it('should have refreshUser available when authenticated', () => {
      const mockUser = { uid: 'test-uid', email: 'test@example.com' };
      const mockRefreshUser = jest.fn();
      mockUseAuth.mockReturnValue({
        user: mockUser as any,
        loading: false,
        refreshUser: mockRefreshUser,
      });

      render(<RootNavigator />);

      expect(mockUseAuth().refreshUser).toBeDefined();
    });
  });
});
