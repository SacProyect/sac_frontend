import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/UI/dialog';
import { Button } from '@/components/UI/button';
import { Check, X, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    variant?: 'approve' | 'reject' | 'warning';
    loading?: boolean;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    onConfirm,
    variant = 'warning',
    loading = false,
}: ConfirmDialogProps) {
    const IconComponent = variant === 'approve' ? Check : variant === 'reject' ? X : AlertTriangle;
    const iconBgClass = variant === 'approve'
        ? 'bg-emerald-500/15'
        : variant === 'reject'
            ? 'bg-rose-500/15'
            : 'bg-amber-500/15';
    const iconTextClass = variant === 'approve'
        ? 'text-emerald-400'
        : variant === 'reject'
            ? 'text-rose-400'
            : 'text-amber-400';
    const confirmButtonClass = variant === 'approve'
        ? 'bg-emerald-600 hover:bg-emerald-500'
        : variant === 'reject'
            ? 'bg-rose-600 hover:bg-rose-500'
            : '';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBgClass}`}>
                            <IconComponent className={`h-5 w-5 ${iconTextClass}`} />
                        </div>
                        <DialogTitle>{title}</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="flex-1"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 ${confirmButtonClass}`}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Procesando...
                            </span>
                        ) : (
                            confirmLabel
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}