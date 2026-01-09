import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { medicationService } from '../../services/medicationService';
import MedicationSearchScreen from '../prescriptions/MedicationSearchScreen';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

// Mock medicationService
jest.mock('../../services/medicationService', () => ({
  medicationService: {
    searchMedicationSuggestions: jest.fn(),
  },
}));

describe('MedicationSearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('TC-35: Should render search input', () => {
      const { getByPlaceholderText } = render(<MedicationSearchScreen />);
      expect(getByPlaceholderText('e.g., Ibuprofen')).toBeTruthy();
    });

    it('TC-36: Should render back button', () => {
      const { getByText } = render(<MedicationSearchScreen />);
      expect(getByText('Back')).toBeTruthy();
    });

    it('TC-37: Should render page title', () => {
      const { getByText } = render(<MedicationSearchScreen />);
      expect(getByText('Enter Medication Name')).toBeTruthy();
    });

    it('TC-38: Should show empty state with instructions', () => {
      const { getByText } = render(<MedicationSearchScreen />);
      expect(getByText('Search for a medication')).toBeTruthy();
      expect(getByText('Type the name of your medication to search the FDA database')).toBeTruthy();
    });
  });

  describe('Search Functionality', () => {
    it('TC-39: Should search medications when typing', async () => {
      const mockResults = [
        { brandName: 'Aspirin', genericName: 'acetylsalicylic acid', manufacturer: 'Generic' },
        { brandName: 'Advil', genericName: 'ibuprofen', manufacturer: 'Pfizer' },
      ];

      (medicationService.searchMedicationSuggestions as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResults,
      });

      const { getByPlaceholderText, getByText } = render(<MedicationSearchScreen />);
      
      const searchInput = getByPlaceholderText('e.g., Ibuprofen');
      fireEvent.changeText(searchInput, 'aspirin');

      await waitFor(() => {
        expect(medicationService.searchMedicationSuggestions).toHaveBeenCalledWith('aspirin');
      });

      await waitFor(() => {
        expect(getByText('Aspirin')).toBeTruthy();
        expect(getByText('acetylsalicylic acid')).toBeTruthy();
        expect(getByText('Advil')).toBeTruthy();
      });
    });

    it('TC-40: Should debounce search requests', async () => {
      const mockResults = [
        { brandName: 'Aspirin', genericName: 'acetylsalicylic acid' },
      ];

      (medicationService.searchMedicationSuggestions as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResults,
      });

      const { getByPlaceholderText } = render(<MedicationSearchScreen />);
      const searchInput = getByPlaceholderText('e.g., Ibuprofen');

      // Type quickly multiple times
      fireEvent.changeText(searchInput, 'a');
      fireEvent.changeText(searchInput, 'as');
      fireEvent.changeText(searchInput, 'asp');

      // Wait for debounce delay
      await waitFor(() => {
        // Should only call once after debounce
        expect(medicationService.searchMedicationSuggestions).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });

    it('TC-41: Should not search with less than 2 characters', async () => {
      const { getByPlaceholderText, getByText } = render(<MedicationSearchScreen />);
      const searchInput = getByPlaceholderText('e.g., Ibuprofen');

      fireEvent.changeText(searchInput, 'a');

      await waitFor(() => {
        expect(getByText('Please enter at least 2 characters')).toBeTruthy();
      });

      expect(medicationService.searchMedicationSuggestions).not.toHaveBeenCalled();
    });

    it('TC-42: Should show error when no medications found', async () => {
      (medicationService.searchMedicationSuggestions as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const { getByPlaceholderText, getByText } = render(<MedicationSearchScreen />);
      const searchInput = getByPlaceholderText('e.g., Ibuprofen');

      fireEvent.changeText(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(getByText('No medications found')).toBeTruthy();
      });
    });

    it('TC-43: Should handle search API errors', async () => {
      (medicationService.searchMedicationSuggestions as jest.Mock).mockResolvedValue({
        success: false,
        error: 'API error',
      });

      const { getByPlaceholderText, getByText } = render(<MedicationSearchScreen />);
      const searchInput = getByPlaceholderText('e.g., Ibuprofen');

      fireEvent.changeText(searchInput, 'aspirin');

      await waitFor(() => {
        expect(getByText('API error')).toBeTruthy();
      });
    });

    it('TC-44: Should show loading indicator while searching', async () => {
      (medicationService.searchMedicationSuggestions as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: [] }), 100))
      );

      const { getByPlaceholderText, getByTestId } = render(<MedicationSearchScreen />);
      const searchInput = getByPlaceholderText('e.g., Ibuprofen');

      fireEvent.changeText(searchInput, 'aspirin');

      await waitFor(() => {
        expect(getByTestId('loading-indicator')).toBeTruthy();
      });
    });
  });

  describe('Navigation', () => {
    it('TC-45: Should navigate to MedicationDetail when selecting a medication', async () => {
      const mockResults = [
        { brandName: 'Aspirin', genericName: 'acetylsalicylic acid' },
      ];

      (medicationService.searchMedicationSuggestions as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResults,
      });

      const { getByPlaceholderText, getByText } = render(<MedicationSearchScreen />);
      const searchInput = getByPlaceholderText('e.g., Ibuprofen');

      fireEvent.changeText(searchInput, 'aspirin');

      await waitFor(() => {
        expect(getByText('Aspirin')).toBeTruthy();
      });

      const aspirinItem = getByText('Aspirin');
      fireEvent.press(aspirinItem);

      expect(mockNavigate).toHaveBeenCalledWith('MedicationDetail', {
        medicationName: 'Aspirin',
        brandName: 'Aspirin',
        genericName: 'acetylsalicylic acid',
      });
    });

    it('TC-46: Should navigate back when back button pressed', () => {
      const { getByText } = render(<MedicationSearchScreen />);
      const backButton = getByText('Back');

      fireEvent.press(backButton);

      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('Medication Display', () => {
    it('TC-47: Should display medication brand name', async () => {
      const mockResults = [
        { brandName: 'Tylenol', genericName: 'acetaminophen' },
      ];

      (medicationService.searchMedicationSuggestions as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResults,
      });

      const { getByPlaceholderText, getByText } = render(<MedicationSearchScreen />);
      const searchInput = getByPlaceholderText('e.g., Ibuprofen');

      fireEvent.changeText(searchInput, 'tylenol');

      await waitFor(() => {
        expect(getByText('Tylenol')).toBeTruthy();
      });
    });

    it('TC-48: Should display medication generic name', async () => {
      const mockResults = [
        { brandName: 'Tylenol', genericName: 'acetaminophen' },
      ];

      (medicationService.searchMedicationSuggestions as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResults,
      });

      const { getByPlaceholderText, getByText } = render(<MedicationSearchScreen />);
      const searchInput = getByPlaceholderText('e.g., Ibuprofen');

      fireEvent.changeText(searchInput, 'tylenol');

      await waitFor(() => {
        expect(getByText('acetaminophen')).toBeTruthy();
      });
    });

    it('TC-49: Should display manufacturer when available', async () => {
      const mockResults = [
        { brandName: 'Advil', genericName: 'ibuprofen', manufacturer: 'Pfizer' },
      ];

      (medicationService.searchMedicationSuggestions as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResults,
      });

      const { getByPlaceholderText, getByText } = render(<MedicationSearchScreen />);
      const searchInput = getByPlaceholderText('e.g., Ibuprofen');

      fireEvent.changeText(searchInput, 'advil');

      await waitFor(() => {
        expect(getByText('Pfizer')).toBeTruthy();
      });
    });

    it('TC-50: Should display multiple search results', async () => {
      const mockResults = [
        { brandName: 'Aspirin', genericName: 'acetylsalicylic acid' },
        { brandName: 'Advil', genericName: 'ibuprofen' },
        { brandName: 'Tylenol', genericName: 'acetaminophen' },
      ];

      (medicationService.searchMedicationSuggestions as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResults,
      });

      const { getByPlaceholderText, getByText } = render(<MedicationSearchScreen />);
      const searchInput = getByPlaceholderText('e.g., Ibuprofen');

      fireEvent.changeText(searchInput, 'pain');

      await waitFor(() => {
        expect(getByText('Aspirin')).toBeTruthy();
        expect(getByText('Advil')).toBeTruthy();
        expect(getByText('Tylenol')).toBeTruthy();
      });
    });
  });
});
