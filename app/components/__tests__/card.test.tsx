import { render } from "@testing-library/react-native";
import React from "react";
import { Text, View } from "react-native";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../card";

describe("Card Components", () => {
  // Card Component Tests
  describe("Card", () => {
    it("should render Card component", () => {
      const { getByTestId } = render(
        <Card testID="card">
          <Text>Card Content</Text>
        </Card>
      );
      expect(getByTestId("card")).toBeTruthy();
    });

    it("should render Card with children", () => {
      const { getByText } = render(
        <Card>
          <Text>Hello World</Text>
        </Card>
      );
      expect(getByText("Hello World")).toBeTruthy();
    });

    it("should render Card with multiple children", () => {
      const { getByText } = render(
        <Card>
          <Text>First Child</Text>
          <Text>Second Child</Text>
        </Card>
      );
      expect(getByText("First Child")).toBeTruthy();
      expect(getByText("Second Child")).toBeTruthy();
    });

    it("should accept custom style", () => {
      const customStyle = { backgroundColor: "blue", padding: 20 };
      const { getByTestId } = render(
        <Card style={customStyle} testID="styled-card">
          <Text>Styled Card</Text>
        </Card>
      );
      expect(getByTestId("styled-card")).toBeTruthy();
    });

    it("should accept additional View props", () => {
      const { getByTestId } = render(
        <Card
          testID="card-with-props"
          accessible={true}
          accessibilityLabel="Card"
        >
          <Text>Accessible Card</Text>
        </Card>
      );
      expect(getByTestId("card-with-props")).toBeTruthy();
    });
  });

  // CardHeader Component Tests
  describe("CardHeader", () => {
    it("should render CardHeader component", () => {
      const { getByTestId } = render(
        <CardHeader testID="card-header">
          <Text>Header Content</Text>
        </CardHeader>
      );
      expect(getByTestId("card-header")).toBeTruthy();
    });

    it("should render CardHeader with children", () => {
      const { getByText } = render(
        <CardHeader>
          <Text>Header Text</Text>
        </CardHeader>
      );
      expect(getByText("Header Text")).toBeTruthy();
    });

    it("should accept custom style", () => {
      const customStyle = { paddingVertical: 10 };
      const { getByTestId } = render(
        <CardHeader style={customStyle} testID="styled-header">
          <Text>Styled Header</Text>
        </CardHeader>
      );
      expect(getByTestId("styled-header")).toBeTruthy();
    });
  });

  // CardTitle Component Tests
  describe("CardTitle", () => {
    it("should render CardTitle component", () => {
      const { getByText } = render(<CardTitle>Card Title</CardTitle>);
      expect(getByText("Card Title")).toBeTruthy();
    });

    it("should render CardTitle with text", () => {
      const { getByText } = render(<CardTitle>My Medications</CardTitle>);
      expect(getByText("My Medications")).toBeTruthy();
    });

    it("should accept custom style", () => {
      const customStyle = { fontSize: 24, color: "blue" };
      const { getByTestId } = render(
        <CardTitle style={customStyle} testID="styled-title">
          Styled Title
        </CardTitle>
      );
      expect(getByTestId("styled-title")).toBeTruthy();
    });

    it("should accept additional Text props", () => {
      const { getByTestId } = render(
        <CardTitle testID="title-with-props" numberOfLines={1}>
          Long Title That Should Truncate
        </CardTitle>
      );
      expect(getByTestId("title-with-props")).toBeTruthy();
    });
  });

  // CardDescription Component Tests
  describe("CardDescription", () => {
    it("should render CardDescription component", () => {
      const { getByText } = render(
        <CardDescription>This is a description</CardDescription>
      );
      expect(getByText("This is a description")).toBeTruthy();
    });

    it("should render CardDescription with text", () => {
      const { getByText } = render(
        <CardDescription>Take with food</CardDescription>
      );
      expect(getByText("Take with food")).toBeTruthy();
    });

    it("should accept custom style", () => {
      const customStyle = { fontSize: 12, color: "gray" };
      const { getByTestId } = render(
        <CardDescription style={customStyle} testID="styled-description">
          Styled Description
        </CardDescription>
      );
      expect(getByTestId("styled-description")).toBeTruthy();
    });

    it("should accept additional Text props", () => {
      const { getByTestId } = render(
        <CardDescription testID="description-with-props" numberOfLines={2}>
          Long description that should wrap after two lines
        </CardDescription>
      );
      expect(getByTestId("description-with-props")).toBeTruthy();
    });
  });

  // CardAction Component Tests
  describe("CardAction", () => {
    it("should render CardAction component", () => {
      const { getByTestId } = render(
        <CardAction testID="card-action">
          <Text>Action Button</Text>
        </CardAction>
      );
      expect(getByTestId("card-action")).toBeTruthy();
    });

    it("should render CardAction with children", () => {
      const { getByText } = render(
        <CardAction>
          <Text>Edit</Text>
        </CardAction>
      );
      expect(getByText("Edit")).toBeTruthy();
    });

    it("should accept custom style", () => {
      const customStyle = { top: 10, right: 10 };
      const { getByTestId } = render(
        <CardAction style={customStyle} testID="styled-action">
          <Text>Action</Text>
        </CardAction>
      );
      expect(getByTestId("styled-action")).toBeTruthy();
    });
  });

  // CardContent Component Tests
  describe("CardContent", () => {
    it("should render CardContent component", () => {
      const { getByTestId } = render(
        <CardContent testID="card-content">
          <Text>Main Content</Text>
        </CardContent>
      );
      expect(getByTestId("card-content")).toBeTruthy();
    });

    it("should render CardContent with children", () => {
      const { getByText } = render(
        <CardContent>
          <Text>Content Area</Text>
        </CardContent>
      );
      expect(getByText("Content Area")).toBeTruthy();
    });

    it("should render CardContent with multiple children", () => {
      const { getByText } = render(
        <CardContent>
          <Text>First Line</Text>
          <Text>Second Line</Text>
        </CardContent>
      );
      expect(getByText("First Line")).toBeTruthy();
      expect(getByText("Second Line")).toBeTruthy();
    });

    it("should accept custom style", () => {
      const customStyle = { paddingHorizontal: 30 };
      const { getByTestId } = render(
        <CardContent style={customStyle} testID="styled-content">
          <Text>Styled Content</Text>
        </CardContent>
      );
      expect(getByTestId("styled-content")).toBeTruthy();
    });
  });

  // CardFooter Component Tests
  describe("CardFooter", () => {
    it("should render CardFooter component", () => {
      const { getByTestId } = render(
        <CardFooter testID="card-footer">
          <Text>Footer Content</Text>
        </CardFooter>
      );
      expect(getByTestId("card-footer")).toBeTruthy();
    });

    it("should render CardFooter with children", () => {
      const { getByText } = render(
        <CardFooter>
          <Text>Footer Text</Text>
        </CardFooter>
      );
      expect(getByText("Footer Text")).toBeTruthy();
    });

    it("should accept custom style", () => {
      const customStyle = { gap: 20 };
      const { getByTestId } = render(
        <CardFooter style={customStyle} testID="styled-footer">
          <Text>Styled Footer</Text>
        </CardFooter>
      );
      expect(getByTestId("styled-footer")).toBeTruthy();
    });

    it("should render CardFooter with multiple children", () => {
      const { getByText } = render(
        <CardFooter>
          <Text>Button 1</Text>
          <Text>Button 2</Text>
        </CardFooter>
      );
      expect(getByText("Button 1")).toBeTruthy();
      expect(getByText("Button 2")).toBeTruthy();
    });
  });

  // Integrated Card Tests
  describe("Integrated Card Structure", () => {
    it("should render a complete card with all components", () => {
      const { getByText, getByTestId } = render(
        <Card testID="complete-card">
          <CardHeader>
            <CardTitle>Aspirin</CardTitle>
            <CardDescription>100mg tablet</CardDescription>
          </CardHeader>
          <CardAction>
            <Text>Edit</Text>
          </CardAction>
          <CardContent>
            <Text>Take daily with water</Text>
          </CardContent>
          <CardFooter>
            <Text>View Details</Text>
          </CardFooter>
        </Card>
      );

      expect(getByTestId("complete-card")).toBeTruthy();
      expect(getByText("Aspirin")).toBeTruthy();
      expect(getByText("100mg tablet")).toBeTruthy();
      expect(getByText("Edit")).toBeTruthy();
      expect(getByText("Take daily with water")).toBeTruthy();
      expect(getByText("View Details")).toBeTruthy();
    });

    it("should render card with header and content only", () => {
      const { getByText } = render(
        <Card>
          <CardHeader>
            <CardTitle>Simple Card</CardTitle>
          </CardHeader>
          <CardContent>
            <Text>Simple content</Text>
          </CardContent>
        </Card>
      );

      expect(getByText("Simple Card")).toBeTruthy();
      expect(getByText("Simple content")).toBeTruthy();
    });

    it("should render card with nested complex components", () => {
      const { getByText, getByTestId } = render(
        <Card>
          <CardHeader>
            <CardTitle>Medication List</CardTitle>
            <CardDescription>Today's medications</CardDescription>
          </CardHeader>
          <CardContent>
            <View testID="medication-list">
              <Text>Aspirin - 9:00 AM</Text>
              <Text>Ibuprofen - 2:00 PM</Text>
            </View>
          </CardContent>
        </Card>
      );

      expect(getByText("Medication List")).toBeTruthy();
      expect(getByText("Today's medications")).toBeTruthy();
      expect(getByTestId("medication-list")).toBeTruthy();
      expect(getByText("Aspirin - 9:00 AM")).toBeTruthy();
      expect(getByText("Ibuprofen - 2:00 PM")).toBeTruthy();
    });
  });

  // Style Merging Tests
  describe("Style Merging", () => {
    it("should merge custom styles with default Card styles", () => {
      const { getByTestId } = render(
        <Card style={{ marginTop: 20, borderRadius: 16 }} testID="merged-card">
          <Text>Content</Text>
        </Card>
      );
      expect(getByTestId("merged-card")).toBeTruthy();
    });

    it("should merge custom styles with default CardTitle styles", () => {
      const { getByTestId } = render(
        <CardTitle
          style={{ fontWeight: "700", color: "red" }}
          testID="merged-title"
        >
          Custom Title
        </CardTitle>
      );
      expect(getByTestId("merged-title")).toBeTruthy();
    });
  });

  // Edge Cases
  describe("Edge Cases", () => {
    it("should render Card with no children", () => {
      const { getByTestId } = render(<Card testID="empty-card" />);
      expect(getByTestId("empty-card")).toBeTruthy();
    });

    it("should render CardHeader with no children", () => {
      const { getByTestId } = render(<CardHeader testID="empty-header" />);
      expect(getByTestId("empty-header")).toBeTruthy();
    });

    it("should render CardContent with no children", () => {
      const { getByTestId } = render(<CardContent testID="empty-content" />);
      expect(getByTestId("empty-content")).toBeTruthy();
    });

    it("should render CardTitle with empty string", () => {
      const { getByTestId } = render(
        <CardTitle testID="empty-title">{""}</CardTitle>
      );
      expect(getByTestId("empty-title")).toBeTruthy();
    });
  });
});
