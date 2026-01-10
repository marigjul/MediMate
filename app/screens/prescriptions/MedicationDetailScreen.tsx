import { Button } from "@/app/components/button";
import { medicationService } from "@/app/services/medicationService";
import { PrescriptionsStackParamList } from "@/app/types/navigation";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

type MedicationDetailNavigationProp = NativeStackNavigationProp<
  PrescriptionsStackParamList,
  "MedicationDetail"
>;

type MedicationDetailRouteProp = RouteProp<
  PrescriptionsStackParamList,
  "MedicationDetail"
>;

const BackIcon = () => <Text style={styles.backIcon}>←</Text>;

export default function MedicationDetailScreen() {
  const navigation = useNavigation<MedicationDetailNavigationProp>();
  const route = useRoute<MedicationDetailRouteProp>();
  const { medicationName, brandName, genericName } = route.params;

  const [loading, setLoading] = useState(true);
  const [fdaData, setFdaData] = useState<any>(null);
  const [error, setError] = useState("");

  const loadMedicationDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await medicationService.searchMedicationFromFDA(
        medicationName
      );

      if (!result.success) {
        setError(result.error || "Failed to load medication details");
        return;
      }

      setFdaData(result.data);
    } catch (err) {
      console.error("Error loading medication details:", err);
      setError("Failed to load medication details");
    } finally {
      setLoading(false);
    }
  }, [medicationName]);

  useEffect(() => {
    loadMedicationDetails();
  }, [loadMedicationDetails]);

  const handleContinue = () => {
    navigation.navigate("MedicationSchedule", {
      medicationName,
      brandName: fdaData?.brandName || brandName,
      genericName: fdaData?.genericName || genericName,
      fdaData,
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading medication details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !fdaData) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackIcon />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Medication Details</Text>
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Failed to load details</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Button onPress={loadMedicationDetails} style={styles.retryButton}>
            Retry
          </Button>
        </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <BackIcon />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Medication Information</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Medication Name */}
        <View style={styles.nameSection}>
          <Text style={styles.brandName}>{fdaData.brandName}</Text>
          {fdaData.genericName && (
            <Text style={styles.genericName}>{fdaData.genericName}</Text>
          )}
        </View>

        {/* Active Ingredient */}
        {fdaData.activeIngredient && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Ingredient</Text>
            <Text style={styles.sectionText}>{fdaData.activeIngredient}</Text>
          </View>
        )}

        {/* Purpose */}
        {fdaData.purpose && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Purpose</Text>
            <Text style={styles.sectionText}>{fdaData.purpose}</Text>
          </View>
        )}

        {/* Indications and Usage */}
        {fdaData.indicationsAndUsage && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Uses</Text>
            <Text style={styles.sectionText}>
              {fdaData.indicationsAndUsage}
            </Text>
          </View>
        )}

        {/* Dosage and Administration */}
        {fdaData.dosageAndAdministration && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dosage Instructions</Text>
            <Text style={styles.sectionText}>
              {fdaData.dosageAndAdministration}
            </Text>
          </View>
        )}

        {/* Side Effects */}
        {fdaData.sideEffects && fdaData.sideEffects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Possible Side Effects</Text>
            {fdaData.sideEffects.map((effect: string, index: number) => (
              <Text key={index} style={styles.sectionText}>
                • {effect}
              </Text>
            ))}
          </View>
        )}

        {/* Warnings */}
        {fdaData.warnings && fdaData.warnings.length > 0 && (
          <View style={styles.warningBox}>
            <View style={styles.warningHeader}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={24}
                color="#F59E0B"
              />
              <Text style={styles.warningTitle}>Warning</Text>
            </View>
            {fdaData.warnings.map((warning: string, index: number) => (
              <Text key={index} style={styles.warningText}>
                {warning}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomButton}>
        <Button
          variant="default"
          size="lg"
          onPress={handleContinue}
          style={styles.continueButton}
        >
          Continue to Schedule
        </Button>
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E0F2FE",
  },
  container: {
    flex: 1,
    backgroundColor: "#E0F2FE",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0F2FE",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#E0F2FE",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
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
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  nameSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  brandName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  genericName: {
    fontSize: 18,
    color: "#6B7280",
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#92400E",
  },
  warningText: {
    fontSize: 15,
    color: "#78350F",
    lineHeight: 22,
    marginBottom: 8,
  },
  bottomPadding: {
    height: 100,
  },
  bottomButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  continueButton: {
    width: "100%",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    marginTop: 16,
  },
});
