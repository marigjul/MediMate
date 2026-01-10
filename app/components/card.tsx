import * as React from "react";
import { StyleSheet, Text, TextProps, View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  className?: string;
}

function Card({ className, style, ...props }: CardProps) {
  return (
    <View
      style={[styles.card, style]}
      {...props}
    />
  );
}

function CardHeader({ className, style, ...props }: CardProps) {
  return (
    <View
      style={[styles.cardHeader, style]}
      {...props}
    />
  );
}

interface CardTitleProps extends TextProps {
  className?: string;
}

function CardTitle({ className, style, ...props }: CardTitleProps) {
  return (
    <Text
      style={[styles.cardTitle, style]}
      {...props}
    />
  );
}

function CardDescription({ className, style, ...props }: CardTitleProps) {
  return (
    <Text
      style={[styles.cardDescription, style]}
      {...props}
    />
  );
}

function CardAction({ className, style, ...props }: CardProps) {
  return (
    <View
      style={[styles.cardAction, style]}
      {...props}
    />
  );
}

function CardContent({ className, style, ...props }: CardProps) {
  return (
    <View
      style={[styles.cardContent, style]}
      {...props}
    />
  );
}

function CardFooter({ className, style, ...props }: CardProps) {
  return (
    <View
      style={[styles.cardFooter, style]}
      {...props}
    />
  );
}


const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 24,
    paddingVertical: 24,
  },
  cardHeader: {
    paddingHorizontal: 24,
    gap: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: '#000000',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  cardAction: {
    position: 'absolute',
    top: 24,
    right: 24,
  },
  cardContent: {
    paddingHorizontal: 24,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
});

export {
    Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
};
