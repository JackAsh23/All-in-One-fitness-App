export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastPayload = {
  message: string;
  action?: ToastAction;
};

type ToastListener = (toast: ToastPayload) => void;

const listeners = new Set<ToastListener>();

export function showToast(message: string, action?: ToastAction) {
  const text = message.trim();
  if (!text) return;
  const payload: ToastPayload = { message: text, action };
  listeners.forEach((listener) => listener(payload));
}

export function subscribeToast(listener: ToastListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
