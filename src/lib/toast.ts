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

let pendingAction: ToastAction | undefined;

export function showToast(message: string, action?: ToastAction) {
  const text = message.trim();
  if (!text) return;
  pendingAction = action;
  const payload: ToastPayload = { message: text, action };
  listeners.forEach((listener) => listener(payload));
}

/** Run the latest toast action once (Undo). Stored outside React so the callback cannot go stale. */
export function consumeToastAction() {
  const action = pendingAction;
  pendingAction = undefined;
  action?.onClick();
}

export function subscribeToast(listener: ToastListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
