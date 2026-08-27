type ToastListener = (message: string) => void;

const listeners = new Set<ToastListener>();

export function showToast(message: string) {
  const text = message.trim();
  if (!text) return;
  listeners.forEach((listener) => listener(text));
}

export function subscribeToast(listener: ToastListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
