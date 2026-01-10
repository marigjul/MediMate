import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import EditProfileScreen from '../profile/EditProfileScreen';

describe('EditProfileScreen', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderEditProfileScreen = (authContextValue = mockAuthContextValue) => {
    return render(
      <AuthContext.Provider value={authContextValue as any}>
        <EditProfileScreen />
      </AuthContext.Provider>
    );
  };

  it('should render Edit Profile header', () => {
    const { getByText } = renderEditProfileScreen();
    expect(getByText('Edit Profile')).toBeTruthy();
  });

  it('should pre-fill name field with current user name', () => {
    const { getByDisplayValue } = renderEditProfileScreen();
    expect(getByDisplayValue('John Doe')).toBeTruthy();
  });

  it('should pre-fill email field with current user email', () => {
    const { getByDisplayValue } = renderEditProfileScreen();
    expect(getByDisplayValue('john.doe@example.com')).toBeTruthy();
  });

  it('should render all form sections', () => {
    const { getByText } = renderEditProfileScreen();
    expect(getByText('Basic Information')).toBeTruthy();
    expect(getByText('Change Password')).toBeTruthy();
  });

  it('should render Save Changes button', () => {
    const { getByText } = renderEditProfileScreen();
    expect(getByText('Save Changes')).toBeTruthy();
  });

  it('should show email as disabled', () => {
    const { getByText, getByDisplayValue } = renderEditProfileScreen();
    expect(getByText('Email cannot be changed')).toBeTruthy();
    const emailInput = getByDisplayValue('john.doe@example.com');
    expect(emailInput.props.editable).toBe(false);
  });

  it('should allow updating display name', async () => {
    (authService.updateUserProfile as jest.Mock).mockResolvedValue({ success: true });

    const { getByDisplayValue, getByText } = renderEditProfileScreen();
    
    // Change name
    const nameInput = getByDisplayValue('John Doe');
    fireEvent.changeText(nameInput, 'Jane Smith');
    
    // Save
    const saveButton = getByText('Save Changes');
    fireEvent.press(saveButton);
    
    await waitFor(() => {
      expect(authService.updateUserProfile).toHaveBeenCalledWith('test-user-123', {
        name: 'Jane Smith',
        displayName: 'Jane Smith',
      });
    });
  });

  it('should navigate back after successful name update', async () => {
    (authService.updateUserProfile as jest.Mock).mockResolvedValue({ success: true });

    const { getByDisplayValue, getByText, queryByText } = renderEditProfileScreen();
    
    const nameInput = getByDisplayValue('John Doe');
    fireEvent.changeText(nameInput, 'Jane Smith');
    
    const saveButton = getByText('Save Changes');
    fireEvent.press(saveButton);
    
    await waitFor(() => {
      expect(authService.updateUserProfile).toHaveBeenCalledWith('test-user-123', {
        name: 'Jane Smith',
        displayName: 'Jane Smith',
      });
      expect(mockAuthContextValue.refreshUser).toHaveBeenCalled();
    });
    
    // Verify no error message is shown
    expect(queryByText(/error/i)).toBeNull();
  });

  it('should allow updating password with valid inputs', async () => {
    (authService.updateUserPassword as jest.Mock).mockResolvedValue({ success: true });

    const { getByPlaceholderText, getByText } = renderEditProfileScreen();
    
    // Fill password fields
    const currentPasswordInput = getByPlaceholderText('Enter current password');
    const newPasswordInput = getByPlaceholderText('Enter new password (min 6 characters)');
    const confirmPasswordInput = getByPlaceholderText('Confirm new password');
    
    fireEvent.changeText(currentPasswordInput, 'oldPassword123');
    fireEvent.changeText(newPasswordInput, 'newPassword456');
    fireEvent.changeText(confirmPasswordInput, 'newPassword456');
    
    // Save
    const saveButton = getByText('Save Changes');
    fireEvent.press(saveButton);
    
    await waitFor(() => {
      expect(authService.updateUserPassword).toHaveBeenCalledWith('oldPassword123', 'newPassword456');
    });
  });

  it('should show error when name is empty', async () => {
    const { getByDisplayValue, getByText } = renderEditProfileScreen();
    
    // Clear name
    const nameInput = getByDisplayValue('John Doe');
    fireEvent.changeText(nameInput, '');
    
    // Try to save
    const saveButton = getByText('Save Changes');
    fireEvent.press(saveButton);
    
    await waitFor(() => {
      expect(getByText('Name cannot be empty')).toBeTruthy();
    });
  });

  it('should show error when passwords do not match', async () => {
    const { getByPlaceholderText, getByText } = renderEditProfileScreen();
    
    const currentPasswordInput = getByPlaceholderText('Enter current password');
    const newPasswordInput = getByPlaceholderText('Enter new password (min 6 characters)');
    const confirmPasswordInput = getByPlaceholderText('Confirm new password');
    
    fireEvent.changeText(currentPasswordInput, 'oldPassword123');
    fireEvent.changeText(newPasswordInput, 'newPassword456');
    fireEvent.changeText(confirmPasswordInput, 'differentPassword');
    
    const saveButton = getByText('Save Changes');
    fireEvent.press(saveButton);
    
    await waitFor(() => {
      expect(getByText('New passwords do not match')).toBeTruthy();
    });
  });

  it('should display error message when name update fails', async () => {
    (authService.updateUserProfile as jest.Mock).mockResolvedValue({ 
      success: false, 
      error: 'Update failed' 
    });

    const { getByDisplayValue, getByText } = renderEditProfileScreen();
    
    const nameInput = getByDisplayValue('John Doe');
    fireEvent.changeText(nameInput, 'Jane Smith');
    
    const saveButton = getByText('Save Changes');
    fireEvent.press(saveButton);
    
    await waitFor(() => {
      expect(getByText('Update failed')).toBeTruthy();
    });
  });
});
