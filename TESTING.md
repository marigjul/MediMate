# Testing Documentation

## Overview

MediMate uses **Jest** and **React Native Testing Library** for testing. The test suite covers both frontend UI components and backend service logic with **52 passing tests**:

- **Component Tests**: 22 tests  
- **Service Tests**: 30 tests (17 auth + 13 medication)

All tests use mocked Firebase services for fast, reliable unit testing.

## Test Structure

### Component Tests (22 tests)
Located in `app/screens/__tests__/`

**ProfileScreen.test.tsx** (10 tests)
- User data rendering (display name, email, fallback values)
- Logout functionality with confirmation modal
- Navigation to edit profile
- Modal interactions (confirm/cancel)

**EditProfileScreen.test.tsx** (12 tests)
- Form rendering and pre-filled values
- Name update functionality
- Password change validation
- Form validation (empty fields, password matching)
- Error handling for failed updates

### Service Tests (30 tests)
Located in `app/services/__tests__/`

**authService.test.js** (17 tests)
- User registration (with validation and duplicate checking)
- User login (success and error cases)
- Profile management (get, update)
- Password management (update with validation)
- Email updates with reauthentication
- Logout functionality
- Auth state change listeners

**medicationService.test.js** (13 tests)
- FDA API integration (fetch, parse, error handling)
- Medication caching strategy
- Medication CRUD operations (add, get, update, delete)
- Medication tracking logs (taken/skipped)
- Real-time subscriptions
- Error handling for invalid data

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Files
```bash
npm test ProfileScreen        # Component tests
npm test authService          # Auth service tests  
npm test medicationService    # Medication service tests
```

### Run with Coverage
```bash
npm test -- --coverage
```

### Watch Mode
```bash
npm test -- --watch
```

## Test Configuration

- **Test Runner:** Jest with `react-native` preset
- **Mocking:** Firebase, React Navigation, and Expo modules are mocked in `jest.setup.js`
- **Timeout:** 20 seconds (for API calls)
- **Component Testing:** React Native Testing Library

## Test Results Summary

✅ **52 Total Tests Passing**
- Component Tests: 22 passing
- Service Tests: 30 passing (17 auth + 13 medication)

All tests verify:
- Correct user interface rendering
- Backend communication with Firebase
- Form validation and error handling
- Authentication flows
- Medication management features
- FDA API integration and caching strategy
