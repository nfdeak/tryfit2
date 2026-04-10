import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';

export interface ToastHandle {
  show: (message: string) => void;
}

export const Toast = forwardRef<ToastHandle>((_, ref) => {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useImperativeHandle(ref, () => ({
    show: (msg: string) => {
      setMessage(msg);
      setVisible(true);
    }
  }));

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!visible || !message) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-xs w-full px-4">
      <div className="bg-surface text-primary text-sm font-sans px-4 py-3 rounded-xl shadow-xl border border-border text-center card-glow">
        {message}
      </div>
    </div>
  );
});

Toast.displayName = 'Toast';
