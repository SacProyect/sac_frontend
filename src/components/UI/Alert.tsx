import { useEffect, type ReactNode } from 'react';

type AlertProps = {
  message: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  timeout?: number;
};

const Alert = ({ message, isOpen, onClose, timeout = 3000 }: AlertProps) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, timeout);
    return () => clearTimeout(timer);
  }, [isOpen, onClose, timeout]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="alertdialog"
      aria-modal="true"
    >
      <div className="p-4 text-white bg-green-500 rounded-lg shadow-lg max-w-sm">
        <p>{message}</p>
      </div>
    </div>
  );
};

export default Alert;
