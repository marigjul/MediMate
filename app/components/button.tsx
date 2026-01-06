import * as React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  TouchableOpacityProps,
} from "react-native";

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

function Button({
  variant = "default",
  size = "default",
  style,
  children,
  disabled,
  icon,
  iconPosition = "left",
  ...props
}: ButtonProps) {
  const buttonStyle = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    disabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    disabled && styles.textDisabled,
  ];

  const content = (
    <>
      {icon && iconPosition === "left" && <View style={styles.iconContainer}>{icon}</View>}
      {typeof children === "string" ? (
        <Text style={textStyle}>{children}</Text>
      ) : (
        children
      )}
      {icon && iconPosition === "right" && <View style={styles.iconContainer}>{icon}</View>}
    </>
  );

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Base styles
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 0,
  },
  text: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    backgroundColor: "#D1D5DB",
  },
  textDisabled: {
    color: "#9CA3AF",
  },

  // Variant styles - matching your design
  variant_default: {
    backgroundColor: "#3B82F6", // Blue
  },
  text_default: {
    color: "#FFFFFF",
  },
  variant_destructive: {
    backgroundColor: "#EF4444", // Red
  },
  text_destructive: {
    color: "#FFFFFF",
  },
  variant_outline: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#3B82F6", // Blue border
  },
  text_outline: {
    color: "#3B82F6", // Blue text
  },
  variant_secondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB", // Light grey border
  },
  text_secondary: {
    color: "#6B7280", // Grey text
  },
  variant_ghost: {
    backgroundColor: "transparent",
  },
  text_ghost: {
    color: "#EF4444", // Red text for destructive ghost (like "Delete Medication")
    borderWidth: 2,
    borderColor: "#EF4444",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  variant_link: {
    backgroundColor: "transparent",
  },
  text_link: {
    color: "#3B82F6",
    textDecorationLine: "underline",
  },

  // Size styles
  size_default: {
    height: 56,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  textSize_default: {
    fontSize: 16,
  },
  size_sm: {
    height: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  textSize_sm: {
    fontSize: 15,
  },
  size_lg: {
    height: 64,
    paddingHorizontal: 28,
    paddingVertical: 20,
    borderRadius: 14,
  },
  textSize_lg: {
    fontSize: 18,
  },
  size_icon: {
    width: 56,
    height: 56,
    paddingHorizontal: 0,
    borderRadius: 12,
  },
  textSize_icon: {
    fontSize: 16,
  },
});

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };