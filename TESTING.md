# Testing Documentation

## Overview

MediMate uses **Jest** and **React Native Testing Library** for comprehensive testing across all application layers.

### Test Summary

- **550 Total Tests** - 100% passing
- **19 Test Suites** covering screens, components, services, contexts, and navigation
- **Overall Coverage: 89.71%** statements, 83.33% branches, 89.94% lines

All tests use mocked Firebase services for fast, reliable unit testing.

## Quick Start

### Run All Tests

```bash
npm test
```

### Run Specific Tests

```bash
npm test HomeScreen           # Home screen tests
npm test PrescriptionsScreen  # Prescriptions screen tests
npm test authService          # Authentication service tests
npm test -- --watch           # Watch mode for development
```

### View Coverage Report

```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

## What We Test

### Screens & UI Components
- **Home Screen** - Medication dashboard, daily tracking, status updates
- **Authentication** - Login/signup flows, validation, error handling
- **Medication Management** - Search, add, edit, view, delete medications
- **Profile Management** - User settings, password changes
- **Navigation** - Tab navigation, screen transitions, auth state routing

### Backend Services
- **Authentication Service** - Firebase auth integration, session management
- **Medication Service** - CRUD operations, FDA API integration, streak tracking
- **Notification Service** - Scheduling, permissions, platform-specific behavior

### What Gets Tested
- UI rendering and user interactions
- Form validation and error states
- API calls and data fetching
- State management and navigation
- Edge cases and error handling
- Loading states and empty states
- Real-time updates and subscriptions

## Code Coverage

### Current Coverage: 89.71% Statements

| Component | Statements | Branches | Functions | Lines |
|-----------|------------|----------|-----------|-------|
| **Overall** | **89.71%** | **83.33%** | **84.14%** | **89.94%** |
| Components | 100% | 100% | 100% | 100% |
| Contexts | 94.31% | 68.08% | 88.46% | 94.04% |
| Navigation | 39.28%* | 100% | 6.66%* | 39.28%* |
| Screens | 93.55% | 89.38% | 94.44% | 94.01% |
| Services | 91.21% | 84.54% | 94.23% | 91.14% |

**\*Navigation Note:** Low coverage is intentional. The file contains mostly declarative navigation configuration (screen registration, styling) which is implicitly tested through screen tests. All critical branching logic (auth routing) has 100% branch coverage.

### Key Coverage Details

**High Coverage Areas (>90%)**
- UI Components: 100%
- Contexts (Auth & Notifications): 94.31%
- Most Screens: 93-98%
- Services: 91-96%

**Areas with Intentionally Lower Coverage**
- **Navigation config** (39%): Declarative screen setup - tested via integration
- **Notification Service branches** (58%): Platform-specific code paths
- **Auth Service branches** (75%): Firebase error scenarios

## Test Configuration

**Technology Stack:**
- **Test Runner:** Jest with React Native preset
- **Component Testing:** React Native Testing Library
- **Mocking:** Firebase, React Navigation, Expo modules (see `jest.setup.js`)
- **Timeout:** 20 seconds for async operations

**Configuration Files:**
- `jest.config.js` - Main Jest configuration
- `jest.setup.js` - Test environment setup and mocks
- Coverage reports generated in `coverage/` directory
