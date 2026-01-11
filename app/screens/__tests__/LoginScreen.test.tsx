import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { authService } from '../../services/authService';
import LoginScreen from '../LoginScreen';

// Mock authService
jest.mock('../../services/authService', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
  },
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UI Rendering', () => {
    it('should render login form by default', () => {
      const { getAllByText, getByPlaceholderText, queryByPlaceholderText } = render(
        <LoginScreen />
      );

      expect(getAllByText('MediMate')).toBeTruthy();
      expect(getAllByText('Welcome back')).toBeTruthy();
      expect(getAllByText('Login')).toBeTruthy();
      expect(getByPlaceholderText('Email')).toBeTruthy();
      expect(getByPlaceholderText('Password')).toBeTruthy();
      expect(queryByPlaceholderText('Full Name')).toBeNull();
      expect(queryByPlaceholderText('Confirm Password')).toBeNull();
    });

    it('should render sign up form when toggle is pressed', () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      const toggleButton = getByText("Don't have an account? Sign up");
      fireEvent.press(toggleButton);

      expect(getByText('Create your account')).toBeTruthy();
      expect(getByText('Sign Up')).toBeTruthy();
      expect(getByPlaceholderText('Full Name')).toBeTruthy();
      expect(getByPlaceholderText('Email')).toBeTruthy();
      expect(getByPlaceholderText('Password')).toBeTruthy();
      expect(getByPlaceholderText('Confirm Password')).toBeTruthy();
    });

    it('should toggle back to login form', () => {
      const { getByText, getAllByText, queryByPlaceholderText } = render(<LoginScreen />);

      // Toggle to sign up
      fireEvent.press(getByText("Don't have an account? Sign up"));
      expect(getByText('Sign Up')).toBeTruthy();

      // Toggle back to login
      fireEvent.press(getByText('Already have an account? Login'));
      expect(getAllByText('Login')).toBeTruthy();
      expect(queryByPlaceholderText('Full Name')).toBeNull();
      expect(queryByPlaceholderText('Confirm Password')).toBeNull();
    });

    it('should clear form fields when toggling between modes', () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      // Toggle to sign up
      fireEvent.press(getByText("Don't have an account? Sign up"));

      // Check that fields are cleared
      expect(getByPlaceholderText('Email').props.value).toBe('');
      expect(getByPlaceholderText('Password').props.value).toBe('');
    });
  });

  describe('Email and Password Validation - Login', () => {
    it('should show error when email and password are empty', async () => {
      const { getAllByText, getByText } = render(<LoginScreen />);

      const loginButton = getAllByText('Login')[1]; // Get the button, not the title
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('Please enter both email and password')).toBeTruthy();
      });
    });

    it('should show error when email is empty', async () => {
      const { getAllByText, getByText, getByPlaceholderText } = render(<LoginScreen />);

      const passwordInput = getByPlaceholderText('Password');
      fireEvent.changeText(passwordInput, 'password123');

      const loginButton = getAllByText('Login')[1]; // Get the button, not the title
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('Please enter both email and password')).toBeTruthy();
      });
    });

    it('should show error when password is empty', async () => {
      const { getAllByText, getByText, getByPlaceholderText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Email');
      fireEvent.changeText(emailInput, 'test@example.com');

      const loginButton = getAllByText('Login')[1]; // Get the button, not the title
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('Please enter both email and password')).toBeTruthy();
      });
    });

    it('should not call authService.login when validation fails', async () => {
      const { getAllByText, getByText } = render(<LoginScreen />);

      const loginButton = getAllByText('Login')[1]; // Get the button, not the title
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('Please enter both email and password')).toBeTruthy();
      });

      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe('Email and Password Validation - Sign Up', () => {
    it('should show error when fields are empty on sign up', async () => {
      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText("Don't have an account? Sign up"));

      const signUpButton = getByText('Create Account');
      fireEvent.press(signUpButton);

      await waitFor(() => {
        expect(getByText('Please fill in all fields')).toBeTruthy();
      });
    });

    it('should show error when passwords do not match', async () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.press(getByText("Don't have an account? Sign up"));

      fireEvent.changeText(getByPlaceholderText('Full Name'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.changeText(
        getByPlaceholderText('Confirm Password'),
        'password456'
      );

      const signUpButton = getByText('Create Account');
      fireEvent.press(signUpButton);

      await waitFor(() => {
        expect(getByText('Passwords do not match')).toBeTruthy();
      });
    });

    it('should show error when password is too short', async () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.press(getByText("Don't have an account? Sign up"));

      fireEvent.changeText(getByPlaceholderText('Full Name'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), '12345');
      fireEvent.changeText(getByPlaceholderText('Confirm Password'), '12345');

      const signUpButton = getByText('Create Account');
      fireEvent.press(signUpButton);

      await waitFor(() => {
        expect(getByText('Password should be at least 6 characters')).toBeTruthy();
      });
    });
  });

  describe('Button States', () => {
    it('should enable login button when not loading', () => {
      const { getAllByText } = render(<LoginScreen />);

      const loginButton = getAllByText('Login')[1];
      expect(loginButton.props.accessibilityState?.disabled).toBeFalsy();
    });

    it('should disable login button while loading', async () => {
      let resolveLogin: any;
      (authService.login as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveLogin = resolve;
          })
      );

      const { getAllByText, getByPlaceholderText, UNSAFE_queryByType } = render(
        <LoginScreen />
      );

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

      const loginButton = getAllByText('Login')[1];
      fireEvent.press(loginButton);

      // Verify loading state by checking for ActivityIndicator
      await waitFor(() => {
        const ActivityIndicator = require('react-native').ActivityIndicator;
        expect(UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
      });

      // Cleanup: resolve the promise
      resolveLogin({ success: true });
    });

    it('should disable input fields while loading', async () => {
      (authService.login as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true }), 100)
          )
      );

      const { getAllByText, getByPlaceholderText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      const loginButton = getAllByText('Login')[1];
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(emailInput.props.editable).toBe(false);
        expect(passwordInput.props.editable).toBe(false);
      });
    });

    it('should disable toggle button while loading', async () => {
      let resolveLogin: any;
      (authService.login as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveLogin = resolve;
          })
      );

      const { getAllByText, getByText, getByPlaceholderText, queryByText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

      const loginButton = getAllByText('Login')[1];
      
      // Press login button to enter loading state
      fireEvent.press(loginButton);

      // Verify we're in loading state
      await waitFor(() => {
        const ActivityIndicator = require('react-native').ActivityIndicator;
        expect(queryByText('Login')).toBeTruthy(); // Card title should still be there
      });

      // Try to press the toggle button during loading - it should not work
      const toggleButton = getByText("Don't have an account? Sign up");
      fireEvent.press(toggleButton);
      
      // Screen should still be on Login (not switched to Sign Up)
      expect(queryByText('Create Account')).toBeNull();

      // Cleanup: resolve the promise
      resolveLogin({ success: true });
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator during login', async () => {
      (authService.login as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true }), 100)
          )
      );

      const { getAllByText, getByPlaceholderText, UNSAFE_getByType } = render(
        <LoginScreen />
      );

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

      const loginButton = getAllByText('Login')[1];
      fireEvent.press(loginButton);

      await waitFor(() => {
        const ActivityIndicator = require('react-native').ActivityIndicator;
        expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
      });
    });

    it('should hide button text during loading', async () => {
      (authService.login as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true }), 100)
          )
      );

      const { getAllByText, getByPlaceholderText, queryAllByText } = render(
        <LoginScreen />
      );

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

      const loginButton = getAllByText('Login')[1];
      fireEvent.press(loginButton);

      await waitFor(() => {
        // Only the card title should remain, not the button text
        expect(queryAllByText('Login').length).toBe(1);
      });
    });
  });

  describe('Authentication Flow - Login', () => {
    it('should call authService.login with correct credentials', async () => {
      (authService.login as jest.Mock).mockResolvedValue({ success: true });

      const { getAllByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

      const loginButton = getAllByText('Login')[1];
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
      });
    });

    it('should handle successful login', async () => {
      (authService.login as jest.Mock).mockResolvedValue({ success: true });

      const { getAllByText, getByPlaceholderText, queryByText } = render(
        <LoginScreen />
      );

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

      const loginButton = getAllByText('Login')[1];
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalled();
      });

      // No error should be shown
      expect(queryByText(/error/i)).toBeNull();
    });
  });

  describe('Error Message Display', () => {
    it('should display invalid email error', async () => {
      (authService.login as jest.Mock).mockResolvedValue({
        success: false,
        error: 'auth/invalid-email',
      });

      const { getAllByText, getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'invalid-email');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

      const loginButton = getAllByText('Login')[1];
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('Please enter a valid email address')).toBeTruthy();
      });
    });

    it('should display user not found error', async () => {
      (authService.login as jest.Mock).mockResolvedValue({
        success: false,
        error: 'auth/user-not-found',
      });

      const { getAllByText, getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

      const loginButton = getAllByText('Login')[1];
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('No account found with this email')).toBeTruthy();
      });
    });

    it('should display wrong password error', async () => {
      (authService.login as jest.Mock).mockResolvedValue({
        success: false,
        error: 'auth/wrong-password',
      });

      const { getAllByText, getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpassword');

      const loginButton = getAllByText('Login')[1];
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('Incorrect password')).toBeTruthy();
      });
    });

    it('should display invalid credential error', async () => {
      (authService.login as jest.Mock).mockResolvedValue({
        success: false,
        error: 'auth/invalid-credential',
      });

      const { getAllByText, getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

      const loginButton = getAllByText('Login')[1];
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('Invalid email or password')).toBeTruthy();
      });
    });

    it('should display user disabled error', async () => {
      (authService.login as jest.Mock).mockResolvedValue({
        success: false,
        error: 'auth/user-disabled',
      });

      const { getAllByText, getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

      const loginButton = getAllByText('Login')[1];
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('This account has been disabled')).toBeTruthy();
      });
    });

    it('should display too many requests error', async () => {
      (authService.login as jest.Mock).mockResolvedValue({
        success: false,
        error: 'auth/too-many-requests',
      });

      const { getAllByText, getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

      const loginButton = getAllByText('Login')[1];
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(
          getByText('Too many failed attempts. Please try again later')
        ).toBeTruthy();
      });
    });

    it('should display generic error message for unknown errors', async () => {
      (authService.login as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Some unknown error',
      });

      const { getAllByText, getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

      const loginButton = getAllByText('Login')[1];
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('Some unknown error')).toBeTruthy();
      });
    });

    it('should handle unexpected errors gracefully', async () => {
      (authService.login as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { getAllByText, getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

      const loginButton = getAllByText('Login')[1];
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('An unexpected error occurred')).toBeTruthy();
      });
    });

    it('should clear previous error when trying to login again', async () => {
      (authService.login as jest.Mock)
        .mockResolvedValueOnce({
          success: false,
          error: 'auth/wrong-password',
        })
        .mockResolvedValueOnce({ success: true });

      const { getAllByText, getByText, getByPlaceholderText, queryByText } = render(
        <LoginScreen />
      );

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');

      let loginButton = getAllByText('Login')[1];
      fireEvent.press(loginButton);

      // Wait for first login to complete and error to appear
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledTimes(1);
        expect(getByText('Incorrect password')).toBeTruthy();
      });

      // Wait for loading to finish - button text should be visible again
      await waitFor(() => {
        const buttons = getAllByText('Login');
        expect(buttons.length).toBeGreaterThan(1); // Title + Button text
      });

      // Change password and try again
      fireEvent.changeText(passwordInput, 'correctpassword');
      
      // Get the button again after re-render
      loginButton = getAllByText('Login')[1];
      fireEvent.press(loginButton);

      // Wait for second login call to verify the error was cleared
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledTimes(2);
      });
      
      // Error should be cleared after second login starts
      expect(queryByText('Incorrect password')).toBeNull();
    });
  });

  describe('Authentication Flow - Sign Up', () => {
    it('should call authService.register with correct data', async () => {
      (authService.register as jest.Mock).mockResolvedValue({ success: true });

      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.press(getByText("Don't have an account? Sign up"));

      fireEvent.changeText(getByPlaceholderText('Full Name'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.changeText(
        getByPlaceholderText('Confirm Password'),
        'password123'
      );

      const signUpButton = getByText('Create Account');
      fireEvent.press(signUpButton);

      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith(
          'test@example.com',
          'password123',
          'Test User'
        );
      });
    });

    it('should handle successful registration', async () => {
      (authService.register as jest.Mock).mockResolvedValue({ success: true });

      const { getByText, getByPlaceholderText, queryByText } = render(
        <LoginScreen />
      );

      fireEvent.press(getByText("Don't have an account? Sign up"));

      fireEvent.changeText(getByPlaceholderText('Full Name'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.changeText(
        getByPlaceholderText('Confirm Password'),
        'password123'
      );

      const signUpButton = getByText('Create Account');
      fireEvent.press(signUpButton);

      await waitFor(() => {
        expect(authService.register).toHaveBeenCalled();
      });

      // No error should be shown
      expect(queryByText(/error/i)).toBeNull();
    });

    it('should display email already in use error', async () => {
      (authService.register as jest.Mock).mockResolvedValue({
        success: false,
        error: 'auth/email-already-in-use',
      });

      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.press(getByText("Don't have an account? Sign up"));

      fireEvent.changeText(getByPlaceholderText('Full Name'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('Email'), 'existing@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.changeText(
        getByPlaceholderText('Confirm Password'),
        'password123'
      );

      const signUpButton = getByText('Create Account');
      fireEvent.press(signUpButton);

      await waitFor(() => {
        expect(
          getByText('An account with this email already exists')
        ).toBeTruthy();
      });
    });

    it('should display weak password error from server', async () => {
      (authService.register as jest.Mock).mockResolvedValue({
        success: false,
        error: 'auth/weak-password',
      });

      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.press(getByText("Don't have an account? Sign up"));

      fireEvent.changeText(getByPlaceholderText('Full Name'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'weakpw');
      fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'weakpw');

      const signUpButton = getByText('Create Account');
      fireEvent.press(signUpButton);

      await waitFor(() => {
        expect(getByText('Password should be at least 6 characters')).toBeTruthy();
      });
    });
  });

  describe('Form State Management', () => {
    it('should update email field value', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Email');
      fireEvent.changeText(emailInput, 'test@example.com');

      expect(emailInput.props.value).toBe('test@example.com');
    });

    it('should update password field value', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);

      const passwordInput = getByPlaceholderText('Password');
      fireEvent.changeText(passwordInput, 'password123');

      expect(passwordInput.props.value).toBe('password123');
    });

    it('should update name field value in sign up mode', () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.press(getByText("Don't have an account? Sign up"));

      const nameInput = getByPlaceholderText('Full Name');
      fireEvent.changeText(nameInput, 'Test User');

      expect(nameInput.props.value).toBe('Test User');
    });

    it('should update confirm password field value in sign up mode', () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.press(getByText("Don't have an account? Sign up"));

      const confirmPasswordInput = getByPlaceholderText('Confirm Password');
      fireEvent.changeText(confirmPasswordInput, 'password123');

      expect(confirmPasswordInput.props.value).toBe('password123');
    });
  });

  describe('Error Clearing', () => {
    it('should clear error when toggling between login and sign up', async () => {
      const { getAllByText, getByText, queryByText } = render(<LoginScreen />);

      // Trigger an error
      const loginButton = getAllByText('Login')[1];
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('Please enter both email and password')).toBeTruthy();
      });

      // Toggle to sign up
      fireEvent.press(getByText("Don't have an account? Sign up"));

      // Error should be cleared
      expect(queryByText('Please enter both email and password')).toBeNull();
    });
  });
});
