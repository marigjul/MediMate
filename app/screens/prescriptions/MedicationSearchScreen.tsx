import { PrescriptionsStackParamList } from "@/app/types/navigation";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { medicationService } from "../../services/medicationService";

// Icons
const BackIcon = () => <Text style={styles.backIcon}>←</Text>;
const ChevronRightIcon = () => <Text style={styles.chevron}>›</Text>;

type MedicationSearchNavigationProp = NativeStackNavigationProp<
  PrescriptionsStackParamList,
  "MedicationSearch"
>;

interface MedicationResult {
  brandName: string;
  genericName: string;
  manufacturer?: string;
}

export default function MedicationSearchScreen() {
  const navigation = useNavigation<MedicationSearchNavigationProp>();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<MedicationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setError("");
      return;
    }

    const timeoutId = setTimeout(() => {
      searchMedications(searchQuery);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const searchMedications = async (query: string) => {
    try {
      setLoading(true);
      setError("");

      console.log("Searching for:", query);

      const result = await medicationService.searchMedicationSuggestions(query);

      console.log("Search result:", result);

      if (!result.success) {
        setError(result.error || "Failed to search medications");
        setResults([]);
        return;
      }

      if (result.data.length === 0) {
        setError("No medications found");
        setResults([]);
        return;
      }

      console.log("Setting results:", result.data.length, "medications");
      setResults(result.data);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMedicationSelect = (medication: MedicationResult) => {
    // TODO: Navigate to schedule setup screen
    // Pass medication details to next screen
    console.log("Selected medication:", medication);

    // Later this will be:
    // navigation.navigate("MedicationSchedule", {
    //   medicationName: medication.brandName,
    //   brandName: medication.brandName,
    //   genericName: medication.genericName,
    // });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderMedicationItem = ({ item }: { item: MedicationResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleMedicationSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resultContent}>
        <Text style={styles.brandName}>{item.brandName}</Text>
        {item.genericName && (
          <Text style={styles.genericName}>{item.genericName}</Text>
        )}
        {item.manufacturer && (
          <Text style={styles.manufacturer}>{item.manufacturer}</Text>
        )}
      </View>
      <ChevronRightIcon />
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (searchQuery.trim().length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Search for a medication</Text>
          <Text style={styles.emptyDescription}>
            Type the name of your medication to search the FDA database
          </Text>
        </View>
      );
    }

    if (searchQuery.trim().length < 2) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyDescription}>
            Please enter at least 2 characters
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>❌</Text>
          <Text style={styles.emptyTitle}>{error}</Text>
          <Text style={styles.emptyDescription}>
            Try a different search term
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <BackIcon />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Enter Medication Name</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <Text style={styles.label}>Medication Name</Text>

        <View
          style={[
            styles.searchInputContainer,
            isInputFocused && styles.searchInputContainerFocused,
          ]}
        >
          <TextInput
            style={styles.searchInput}
            placeholder="e.g., Ibuprofen"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={true}
            returnKeyType="search"
            onSubmitEditing={() => searchMedications(searchQuery)}
            underlineColorAndroid="transparent"
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => searchMedications(searchQuery)}
            >
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={styles.loadingText}>Searching FDA database...</Text>
          </View>
        )}
      </View>

      {/* Results List */}
      <FlatList
        data={results}
        renderItem={renderMedicationItem}
        keyExtractor={(item, index) => `${item.brandName}-${index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        keyboardShouldPersistTaps="handled"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E0F2FE",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#E0F2FE",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backIcon: {
    fontSize: 24,
    color: "#3B82F6",
    marginRight: 4,
  },
  backText: {
    fontSize: 16,
    color: "#3B82F6",
    fontWeight: "500",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E40AF",
    marginBottom: 8,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#E0F2FE",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    paddingLeft: 16,
    overflow: "hidden",
  },
  searchInputContainerFocused: {
    borderColor: "#3B82F6",
  },
  searchInput: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: "#1F2937",
    paddingVertical: 0,
    paddingHorizontal: 0,
    // @ts-ignore - web-only properties
    outline: "none",
    // @ts-ignore
    outlineWidth: 0,
    // @ts-ignore
    borderWidth: 0,
  } as any,
  searchButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 20,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6B7280",
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  resultContent: {
    flex: 1,
    marginRight: 12,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  genericName: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  manufacturer: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  chevron: {
    fontSize: 28,
    color: "#9CA3AF",
    fontWeight: "300",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});
