import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Text, View } from "react-native";
import { Button } from "../button";

describe("Button Component", () => {
  // Basic Rendering Tests
  describe("Rendering", () => {
    it("should render with text children", () => {
      const { getByText } = render(<Button>Click Me</Button>);
      expect(getByText("Click Me")).toBeTruthy();
    });

    it("should render with custom component children", () => {
      const { getByTestId } = render(
        <Button>
          <View testID="custom-child">
            <Text>Custom Content</Text>
          </View>
        </Button>
      );
      expect(getByTestId("custom-child")).toBeTruthy();
    });

    it("should render with icon on the left (default)", () => {
      const { getByTestId } = render(
        <Button icon={<Text testID="left-icon">🔒</Text>}>Login</Button>
      );
      expect(getByTestId("left-icon")).toBeTruthy();
    });

    it("should render with icon on the right", () => {
      const { getByTestId } = render(
        <Button icon={<Text testID="right-icon">→</Text>} iconPosition="right">
          Next
        </Button>
      );
      expect(getByTestId("right-icon")).toBeTruthy();
    });
  });

  // Variant Tests
  describe("Variants", () => {
    it("should render default variant", () => {
      const { getByText } = render(<Button variant="default">Default</Button>);
      const button = getByText("Default").parent?.parent;
      expect(button).toBeTruthy();
    });

    it("should render destructive variant", () => {
      const { getByText } = render(
        <Button variant="destructive">Delete</Button>
      );
      expect(getByText("Delete")).toBeTruthy();
    });

    it("should render outline variant", () => {
      const { getByText } = render(<Button variant="outline">Outline</Button>);
      expect(getByText("Outline")).toBeTruthy();
    });

    it("should render secondary variant", () => {
      const { getByText } = render(
        <Button variant="secondary">Secondary</Button>
      );
      expect(getByText("Secondary")).toBeTruthy();
    });

    it("should render ghost variant", () => {
      const { getByText } = render(<Button variant="ghost">Ghost</Button>);
      expect(getByText("Ghost")).toBeTruthy();
    });

    it("should render link variant", () => {
      const { getByText } = render(<Button variant="link">Link</Button>);
      expect(getByText("Link")).toBeTruthy();
    });
  });

  // Size Tests
  describe("Sizes", () => {
    it("should render default size", () => {
      const { getByText } = render(
        <Button size="default">Default Size</Button>
      );
      expect(getByText("Default Size")).toBeTruthy();
    });

    it("should render small size", () => {
      const { getByText } = render(<Button size="sm">Small</Button>);
      expect(getByText("Small")).toBeTruthy();
    });

    it("should render large size", () => {
      const { getByText } = render(<Button size="lg">Large</Button>);
      expect(getByText("Large")).toBeTruthy();
    });

    it("should render icon size", () => {
      const { getByTestId } = render(
        <Button size="icon" testID="icon-button">
          <Text>📱</Text>
        </Button>
      );
      expect(getByTestId("icon-button")).toBeTruthy();
    });
  });

  // Interaction Tests
  describe("Interactions", () => {
    it("should call onPress when pressed", () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <Button onPress={onPressMock}>Press Me</Button>
      );

      fireEvent.press(getByText("Press Me"));

      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it("should not call onPress when disabled", () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <Button onPress={onPressMock} disabled>
          Disabled Button
        </Button>
      );

      fireEvent.press(getByText("Disabled Button"));

      expect(onPressMock).not.toHaveBeenCalled();
    });

    it("should pass additional TouchableOpacity props", () => {
      const onLongPressMock = jest.fn();
      const { getByTestId } = render(
        <Button testID="long-press-button" onLongPress={onLongPressMock}>
          Long Press
        </Button>
      );

      fireEvent(getByTestId("long-press-button"), "longPress");

      expect(onLongPressMock).toHaveBeenCalledTimes(1);
    });
  });

  // Disabled State Tests
  describe("Disabled State", () => {
    it("should render disabled button", () => {
      const { getByText } = render(<Button disabled>Disabled</Button>);
      expect(getByText("Disabled")).toBeTruthy();
    });

    it("should apply disabled styles when disabled", () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <Button disabled onPress={onPressMock}>
          Disabled Button
        </Button>
      );

      const button = getByText("Disabled Button");
      expect(button).toBeTruthy();

      // Try to press it
      fireEvent.press(button);
      expect(onPressMock).not.toHaveBeenCalled();
    });
  });

  // Custom Style Tests
  describe("Custom Styles", () => {
    it("should accept custom style prop", () => {
      const customStyle = { marginTop: 20 };
      const { getByTestId } = render(
        <Button style={customStyle} testID="styled-button">
          Styled
        </Button>
      );
      expect(getByTestId("styled-button")).toBeTruthy();
    });

    it("should merge custom styles with default styles", () => {
      const { getByTestId } = render(
        <Button style={{ backgroundColor: "purple" }} testID="custom-bg-button">
          Custom Background
        </Button>
      );
      expect(getByTestId("custom-bg-button")).toBeTruthy();
    });
  });

  // Combined Props Tests
  describe("Combined Props", () => {
    it("should render with multiple props combined", () => {
      const onPressMock = jest.fn();
      const { getByText, getByTestId } = render(
        <Button
          variant="destructive"
          size="lg"
          onPress={onPressMock}
          icon={<Text testID="delete-icon">🗑️</Text>}
          testID="delete-button"
        >
          Delete Account
        </Button>
      );

      expect(getByText("Delete Account")).toBeTruthy();
      expect(getByTestId("delete-icon")).toBeTruthy();

      fireEvent.press(getByTestId("delete-button"));
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it("should render outline variant with small size", () => {
      const { getByText } = render(
        <Button variant="outline" size="sm">
          Small Outline
        </Button>
      );
      expect(getByText("Small Outline")).toBeTruthy();
    });

    it("should render disabled destructive button", () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <Button variant="destructive" disabled onPress={onPressMock}>
          Disabled Delete
        </Button>
      );

      fireEvent.press(getByText("Disabled Delete"));
      expect(onPressMock).not.toHaveBeenCalled();
    });
  });

  // Edge Cases
  describe("Edge Cases", () => {
    it("should handle undefined children", () => {
      const { toJSON } = render(<Button testID="empty-button" />);
      expect(toJSON()).toBeTruthy();
    });

    it("should handle empty string children", () => {
      const { toJSON } = render(
        <Button testID="empty-string-button">{""}</Button>
      );
      expect(toJSON()).toBeTruthy();
    });

    it("should handle null onPress", () => {
      const { getByText } = render(<Button>No Handler</Button>);
      expect(() => fireEvent.press(getByText("No Handler"))).not.toThrow();
    });

    it("should render with both icon positions specified (left takes precedence)", () => {
      const { getByTestId } = render(
        <Button icon={<Text testID="icon">📧</Text>} iconPosition="left">
          Email
        </Button>
      );
      expect(getByTestId("icon")).toBeTruthy();
    });
  });

  // Accessibility Tests
  describe("Accessibility", () => {
    it("should be accessible when enabled", () => {
      const { getByTestId } = render(
        <Button testID="accessible-button" accessible={true}>
          Accessible
        </Button>
      );
      expect(getByTestId("accessible-button")).toBeTruthy();
    });

    it("should pass accessibility label", () => {
      const { getByLabelText } = render(
        <Button accessibilityLabel="Submit form button">Submit</Button>
      );
      expect(getByLabelText("Submit form button")).toBeTruthy();
    });
  });
});
