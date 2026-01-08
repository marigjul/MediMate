import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import ProfileScreen from '../ProfileScreen';

describe('ProfileScreen', () => {
  const mockUser = {
    uid: 'test-user-123',
    displayName: 'John Doe',
    email: 'john.doe@example.com',
  };

  const mockAuthContextValue = {
    user: mockUser,
    loading: false,
    refreshUser: jest.fn(),
  };

  const renderProfileScreen = (authContextValue = mockAuthContextValue) => {
    return render(
      <AuthContext.Provider value={authContextValue as any}>
        <ProfileScreen />
      </AuthContext.Provider>
    );
  };

  it('should render user display name correctly', () => {
    const { getByText } = renderProfileScreen();
    expect(getByText('John Doe')).toBeTruthy();
  });

  it('should render user email correctly', () => {
    const { getByText } = renderProfileScreen();
    expect(getByText('john.doe@example.com')).toBeTruthy();
  });

  it('should render "User" as fallback when displayName is not available', () => {
    const contextWithoutName: any = {
      ...mockAuthContextValue,
      user: { ...mockUser, displayName: null },
    };
    const { getByText } = renderProfileScreen(contextWithoutName);
    expect(getByText('User')).toBeTruthy();
  });

  it('should render page title', () => {
    const { getByText } = renderProfileScreen();
    expect(getByText('Your Profile')).toBeTruthy();
  });

  it('should render Account Settings section', () => {
    const { getByText } = renderProfileScreen();
    expect(getByText('Account Settings')).toBeTruthy();
  });

  it('should render Edit Profile menu item', () => {
    const { getByText } = renderProfileScreen();
    expect(getByText('Edit Profile')).toBeTruthy();
  });

  it('should render Logout button', () => {
    const { getByText } = renderProfileScreen();
    expect(getByText('Logout')).toBeTruthy();
  });

  it('should show confirmation modal when Logout button is pressed', () => {
    const { getByText, getByTestId } = renderProfileScreen();
    
    const logoutButton = getByText('Logout');
    fireEvent.press(logoutButton);
    
    expect(getByTestId('modal-title')).toBeTruthy();
    expect(getByTestId('modal-message')).toBeTruthy();
  });

  it('should call authService.logout when logout is confirmed', async () => {
    (authService.logout as jest.Mock).mockResolvedValue({ success: true });
    
    const { getByText, getByTestId } = renderProfileScreen();
    
    // Press logout button to show modal
    const logoutButton = getByText('Logout');
    fireEvent.press(logoutButton);
    
    // Confirm logout
    const confirmButton = getByTestId('modal-confirm');
    fireEvent.press(confirmButton);
    
    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  it('should close modal when cancel is pressed', () => {
    const { getByText, getByTestId, queryByTestId } = renderProfileScreen();
    
    // Open modal
    const logoutButton = getByText('Logout');
    fireEvent.press(logoutButton);
    
    expect(getByTestId('modal-title')).toBeTruthy();
    
    // Cancel
    const cancelButton = getByTestId('modal-cancel');
    fireEvent.press(cancelButton);
    
    // Modal should be closed
    expect(queryByTestId('modal-title')).toBeNull();
  });
});
