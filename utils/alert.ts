import { Alert, AlertButton, Platform } from "react-native";

/**
 * Cross-platform Alert.alert. react-native-web ships Alert as a no-op, which
 * silently disables every confirmation and validation dialog on web — map to
 * window.alert / window.confirm there instead.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
): void {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length === 0) {
    window.alert(text);
    return;
  }
  if (buttons.length === 1) {
    window.alert(text);
    buttons[0].onPress?.();
    return;
  }

  const cancel = buttons.find((b) => b.style === "cancel");
  const actions = buttons.filter((b) => b.style !== "cancel");

  if (actions.length === 1) {
    if (window.confirm(text)) actions[0].onPress?.();
    else cancel?.onPress?.();
    return;
  }

  // window.confirm only offers OK/Cancel, so present each action in turn.
  for (const action of actions) {
    if (window.confirm(`${text}\n\n${action.text ?? "OK"}?`)) {
      action.onPress?.();
      return;
    }
  }
  cancel?.onPress?.();
}
