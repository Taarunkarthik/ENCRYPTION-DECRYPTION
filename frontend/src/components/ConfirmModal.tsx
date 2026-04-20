import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'warning',
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      button: 'bg-red-600 hover:bg-red-500 glow-red',
    },
    warning: {
      icon: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      button: 'bg-amber-600 hover:bg-amber-500 glow-amber',
    },
    info: {
      icon: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      button: 'bg-blue-600 hover:bg-blue-500 glow-blue',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onCancel}
      />
      {/* Modal */}
      <div className="relative border-sharp bg-zinc-900/95 backdrop-blur-xl shadow-2xl max-w-sm w-full p-8 animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className={`w-16 h-16 ${styles.bg} border ${styles.border} flex items-center justify-center mx-auto mb-8`}>
          <AlertTriangle className={`w-8 h-8 ${styles.icon}`} />
        </div>

        <h2 className="text-xl font-black tech-font text-center mb-2 tracking-tighter uppercase">{title}</h2>
        <p className="text-muted text-center text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed mb-10">{message}</p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className={`w-full py-4 text-white font-black transition-all uppercase tracking-[0.3em] text-[10px] active:scale-[0.98] ${styles.button}`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-4 border-sharp bg-white/5 text-muted hover:text-[var(--text-main)] font-black uppercase tracking-[0.3em] text-[10px] transition-all active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
