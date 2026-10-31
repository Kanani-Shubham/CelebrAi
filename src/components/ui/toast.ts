export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type Toast = { id: string; message: string; type: ToastType };

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let globalToasts: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach(fn => fn([...globalToasts]));
}

function addToast(message: string, type: ToastType) {
  const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
  globalToasts = [...globalToasts, { id, message, type }];
  notifyListeners();
  setTimeout(() => {
    globalToasts = globalToasts.filter(t => t.id !== id);
    notifyListeners();
  }, 4000);
}

export const toast = {
  success: (message: string) => addToast(message, 'success'),
  error: (message: string) => addToast(message, 'error'),
  info: (message: string) => addToast(message, 'info'),
  warning: (message: string) => addToast(message, 'warning'),
};

export function subscribeToasts(listener: (toasts: Toast[]) => void) {
  toastListeners.push(listener);
  return () => {
    toastListeners = toastListeners.filter(fn => fn !== listener);
  };
}

