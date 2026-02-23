import { Button } from '@/components/ui/button';

interface ModalFooterProps {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

/**
 * ModalFooter - Footer de modal reutilizable para V2
 */
export function ModalFooter({
  onCancel,
  onConfirm,
  confirmLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  isLoading = false,
  confirmVariant = 'default',
}: ModalFooterProps) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
        disabled={isLoading}
      >
        {cancelLabel}
      </Button>
      <Button
        onClick={onConfirm}
        variant={confirmVariant}
        className={
          confirmVariant === 'default'
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : confirmVariant === 'destructive'
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : ''
        }
        disabled={isLoading}
      >
        {isLoading ? 'Guardando...' : confirmLabel}
      </Button>
    </>
  );
}
