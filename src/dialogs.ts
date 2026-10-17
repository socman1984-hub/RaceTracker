import { Alert, Platform } from "react-native";

// Alert.alert does nothing on react-native-web, so the browser build falls
// back to the browser's own alert/confirm dialogs.

export function notify(title: string, message?: string): void {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

export function confirm(
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void
): void {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: confirmText, style: "destructive", onPress: onConfirm },
  ]);
}
