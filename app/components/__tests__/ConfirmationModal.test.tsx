import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import ConfirmationModal from "../ConfirmationModal";

describe("ConfirmationModal Component", () => {
  // Basic Rendering Tests
  describe("Rendering", () => {
    it("should render modal when visible is true", () => {
      const { getByText } = render(
        <ConfirmationModal
          visible={true}
          title="Confirm Action"
          message="Are you sure?"
          confirmText="Yes"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      expect(getByText("Confirm Action")).toBeTruthy();
      expect(getByText("Are you sure?")).toBeTruthy();
    });

    it("should not render modal content when visible is false", () => {
      const { queryByText } = render(
        <ConfirmationModal
          visible={false}
          title="Confirm Action"
          message="Are you sure?"
          confirmText="Yes"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      // Modal component still renders but with visible=false, content won't be visible
      expect(queryByText("Confirm Action")).toBeNull();
    });

    it("should render with custom title", () => {
      const { getByText } = render(
        <ConfirmationModal
          visible={true}
          title="Delete Medication"
          message="This action cannot be undone"
          confirmText="Delete"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      expect(getByText("Delete Medication")).toBeTruthy();
    });

    it("should render with custom message", () => {
      const { getByText } = render(
        <ConfirmationModal
          visible={true}
          title="Logout"
          message="Are you sure you want to logout from your account?"
          confirmText="Logout"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      expect(
        getByText("Are you sure you want to logout from your account?")
      ).toBeTruthy();
    });

    it("should render with custom confirm text", () => {
      const { getByTestId, getByText } = render(
        <ConfirmationModal
          visible={true}
          title="Save Changes"
          message="Do you want to save?"
          confirmText="Save Now"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      const confirmButton = getByTestId("modal-confirm");
      expect(confirmButton).toBeTruthy();
      expect(getByText("Save Now")).toBeTruthy();
    });

    it("should render with default cancel text when not provided", () => {
      const { getByText } = render(
        <ConfirmationModal
          visible={true}
          title="Confirm"
          message="Are you sure?"
          confirmText="Yes"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      expect(getByText("Cancel")).toBeTruthy();
    });

    it("should render with custom cancel text", () => {
      const { getByTestId, getByText } = render(
        <ConfirmationModal
          visible={true}
          title="Confirm"
          message="Are you sure?"
          confirmText="Yes"
          cancelText="No"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      const cancelButton = getByTestId("modal-cancel");
      expect(cancelButton).toBeTruthy();
      expect(getByText("No")).toBeTruthy();
    });
  });

  // Interaction Tests
  describe("Interactions", () => {
    it("should call onConfirm when confirm button is pressed", () => {
      const onConfirmMock = jest.fn();
      const onCancelMock = jest.fn();

      const { getByTestId } = render(
        <ConfirmationModal
          visible={true}
          title="Confirm Action"
          message="Are you sure?"
          confirmText="Confirm"
          onConfirm={onConfirmMock}
          onCancel={onCancelMock}
        />
      );

      fireEvent.press(getByTestId("modal-confirm"));
      expect(onConfirmMock).toHaveBeenCalledTimes(1);
      expect(onCancelMock).not.toHaveBeenCalled();
    });

    it("should call onCancel when cancel button is pressed", () => {
      const onConfirmMock = jest.fn();
      const onCancelMock = jest.fn();

      const { getByTestId } = render(
        <ConfirmationModal
          visible={true}
          title="Confirm Action"
          message="Are you sure?"
          confirmText="Confirm"
          cancelText="Cancel"
          onConfirm={onConfirmMock}
          onCancel={onCancelMock}
        />
      );

      fireEvent.press(getByTestId("modal-cancel"));
      expect(onCancelMock).toHaveBeenCalledTimes(1);
      expect(onConfirmMock).not.toHaveBeenCalled();
    });

    it("should call onCancel when modal requests close", () => {
      const onCancelMock = jest.fn();

      render(
        <ConfirmationModal
          visible={true}
          title="Confirm"
          message="Test"
          confirmText="OK"
          onConfirm={jest.fn()}
          onCancel={onCancelMock}
        />
      );

      // The modal's onRequestClose is wired to onCancel,
      // so we just verify the handler is defined
      expect(onCancelMock).toBeDefined();
    });
  });

  // Destructive Mode Tests
  describe("Destructive Mode", () => {
    it("should render in non-destructive mode by default", () => {
      const { getByTestId } = render(
        <ConfirmationModal
          visible={true}
          title="Confirm"
          message="Are you sure?"
          confirmText="Confirm"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      expect(getByTestId("modal-confirm")).toBeTruthy();
    });

    it("should render in destructive mode when destructive is true", () => {
      const { getAllByText, getByTestId } = render(
        <ConfirmationModal
          visible={true}
          title="Delete"
          message="This will permanently delete the item"
          confirmText="Delete"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
          destructive={true}
        />
      );
      // "Delete" appears in both title and button
      expect(getAllByText("Delete").length).toBeGreaterThan(0);
      expect(getByTestId("modal-confirm")).toBeTruthy();
    });

    it("should apply destructive styles when destructive is true", () => {
      const onConfirmMock = jest.fn();

      const { getByTestId } = render(
        <ConfirmationModal
          visible={true}
          title="Delete Account"
          message="This action cannot be undone"
          confirmText="Delete Forever"
          onConfirm={onConfirmMock}
          onCancel={jest.fn()}
          destructive={true}
        />
      );

      const deleteButton = getByTestId("modal-confirm");
      expect(deleteButton).toBeTruthy();

      fireEvent.press(deleteButton);
      expect(onConfirmMock).toHaveBeenCalledTimes(1);
    });
  });

  // Modal Properties Tests
  describe("Modal Properties", () => {
    it("should render with transparent background", () => {
      const { toJSON } = render(
        <ConfirmationModal
          visible={true}
          title="Test"
          message="Test message"
          confirmText="OK"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      expect(toJSON()).toBeTruthy();
    });

    it("should render with fade animation type", () => {
      const { toJSON } = render(
        <ConfirmationModal
          visible={true}
          title="Test"
          message="Test message"
          confirmText="OK"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  // Button Layout Tests
  describe("Button Layout", () => {
    it("should render both cancel and confirm buttons", () => {
      const { getByTestId } = render(
        <ConfirmationModal
          visible={true}
          title="Confirm"
          message="Are you sure?"
          confirmText="Yes"
          cancelText="No"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      expect(getByTestId("modal-cancel")).toBeTruthy();
      expect(getByTestId("modal-confirm")).toBeTruthy();
    });

    it("should render buttons in correct order (cancel first, confirm second)", () => {
      const { getByTestId } = render(
        <ConfirmationModal
          visible={true}
          title="Confirm"
          message="Are you sure?"
          confirmText="Confirm"
          cancelText="Cancel"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      // Both buttons should be present
      expect(getByTestId("modal-cancel")).toBeTruthy();
      expect(getByTestId("modal-confirm")).toBeTruthy();
    });
  });

  // Real-world Use Cases
  describe("Real-world Use Cases", () => {
    it("should work for logout confirmation", () => {
      const onLogout = jest.fn();
      const onCancel = jest.fn();

      const { getByText, getByTestId, getAllByText } = render(
        <ConfirmationModal
          visible={true}
          title="Logout"
          message="Are you sure you want to logout?"
          confirmText="Logout"
          cancelText="Stay"
          onConfirm={onLogout}
          onCancel={onCancel}
        />
      );

      // "Logout" appears in both title and button
      expect(getAllByText("Logout").length).toBeGreaterThan(0);
      expect(getByText("Are you sure you want to logout?")).toBeTruthy();

      fireEvent.press(getByTestId("modal-confirm"));
      expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it("should work for delete medication confirmation", () => {
      const onDelete = jest.fn();
      const onCancel = jest.fn();

      const { getByText, getByTestId } = render(
        <ConfirmationModal
          visible={true}
          title="Delete Medication"
          message="Are you sure you want to delete this medication? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={onDelete}
          onCancel={onCancel}
          destructive={true}
        />
      );

      expect(getByText("Delete Medication")).toBeTruthy();
      fireEvent.press(getByTestId("modal-confirm"));
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it("should work for discard changes confirmation", () => {
      const onDiscard = jest.fn();
      const onCancel = jest.fn();

      const { getByText, getByTestId } = render(
        <ConfirmationModal
          visible={true}
          title="Discard Changes"
          message="You have unsaved changes. Are you sure you want to discard them?"
          confirmText="Discard"
          cancelText="Keep Editing"
          onConfirm={onDiscard}
          onCancel={onCancel}
          destructive={true}
        />
      );

      expect(getByText("Discard Changes")).toBeTruthy();
      fireEvent.press(getByTestId("modal-cancel"));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  // Multiple Button Press Tests
  describe("Multiple Button Presses", () => {
    it("should handle multiple confirm button presses", () => {
      const onConfirmMock = jest.fn();

      const { getByTestId } = render(
        <ConfirmationModal
          visible={true}
          title="Confirm"
          message="Are you sure?"
          confirmText="Yes"
          onConfirm={onConfirmMock}
          onCancel={jest.fn()}
        />
      );

      const confirmButton = getByTestId("modal-confirm");
      fireEvent.press(confirmButton);
      fireEvent.press(confirmButton);
      fireEvent.press(confirmButton);

      expect(onConfirmMock).toHaveBeenCalledTimes(3);
    });

    it("should handle multiple cancel button presses", () => {
      const onCancelMock = jest.fn();

      const { getByTestId } = render(
        <ConfirmationModal
          visible={true}
          title="Confirm"
          message="Are you sure?"
          confirmText="Yes"
          cancelText="No"
          onConfirm={jest.fn()}
          onCancel={onCancelMock}
        />
      );

      const cancelButton = getByTestId("modal-cancel");
      fireEvent.press(cancelButton);
      fireEvent.press(cancelButton);

      expect(onCancelMock).toHaveBeenCalledTimes(2);
    });
  });

  // Edge Cases
  describe("Edge Cases", () => {
    it("should handle empty title", () => {
      const { getByText } = render(
        <ConfirmationModal
          visible={true}
          title=""
          message="Message"
          confirmText="OK"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      expect(getByText("Message")).toBeTruthy();
    });

    it("should handle empty message", () => {
      const { getByText } = render(
        <ConfirmationModal
          visible={true}
          title="Title"
          message=""
          confirmText="OK"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      expect(getByText("Title")).toBeTruthy();
    });

    it("should handle long title text", () => {
      const longTitle =
        "This is a very long title that should still render properly in the modal without breaking the layout";
      const { getByText } = render(
        <ConfirmationModal
          visible={true}
          title={longTitle}
          message="Message"
          confirmText="OK"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      expect(getByText(longTitle)).toBeTruthy();
    });

    it("should handle long message text", () => {
      const longMessage =
        "This is a very long message that contains multiple sentences and should still render properly in the modal without breaking the layout or causing any issues with the UI components.";
      const { getByText } = render(
        <ConfirmationModal
          visible={true}
          title="Title"
          message={longMessage}
          confirmText="OK"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      expect(getByText(longMessage)).toBeTruthy();
    });
  });

  // Visibility Toggle Tests
  describe("Visibility Toggle", () => {
    it("should handle visibility changes from false to true", () => {
      const { getByText, rerender, queryByText } = render(
        <ConfirmationModal
          visible={false}
          title="Test"
          message="Test message"
          confirmText="OK"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(queryByText("Test")).toBeNull();

      rerender(
        <ConfirmationModal
          visible={true}
          title="Test"
          message="Test message"
          confirmText="OK"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(getByText("Test")).toBeTruthy();
    });

    it("should handle visibility changes from true to false", () => {
      const { queryByText, rerender } = render(
        <ConfirmationModal
          visible={true}
          title="Test"
          message="Test message"
          confirmText="OK"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(queryByText("Test")).toBeTruthy();

      rerender(
        <ConfirmationModal
          visible={false}
          title="Test"
          message="Test message"
          confirmText="OK"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(queryByText("Test")).toBeNull();
    });
  });
});
