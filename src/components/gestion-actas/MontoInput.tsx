import { useEffect, useState } from 'react';
import { formatBs, parseBs } from '@/components/utils/number.utils';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';

interface MontoInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    labelClassName?: string;
    testId?: string;
    disabled?: boolean;
}

export function MontoInput({
    label,
    value,
    onChange,
    placeholder = '0,00',
    className = '',
    labelClassName = 'text-xs text-muted-foreground',
    testId,
    disabled = false,
}: MontoInputProps) {
    const [display, setDisplay] = useState('');
    const [focused, setFocused] = useState(false);

    // Sincroniza el display cuando el value externo cambia y el input no tiene foco.
    // Al cargar datos para editar, value vendrá como "12345" y se mostrará "12.345,00".
    useEffect(() => {
        if (focused) return;
        if (!value || value.trim() === '') {
            setDisplay('');
            return;
        }
        const n = parseBs(value);
        if (isNaN(n) || n === 0) {
            setDisplay('');
            return;
        }
        setDisplay(formatBs(n, 2));
    }, [value, focused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9.,]/g, '');
        setDisplay(raw);

        if (raw === '' || raw === ',' || raw === '.') {
            onChange('');
            return;
        }

        const numeric = parseBs(raw);
        if (!isNaN(numeric)) {
            onChange(String(numeric));
        }
    };

    const handleBlur = () => {
        setFocused(false);
        if (!display.trim()) {
            onChange('');
            setDisplay('');
            return;
        }
        const numeric = parseBs(display);
        if (!isNaN(numeric)) {
            const formatted = formatBs(numeric, 2);
            setDisplay(formatted);
            onChange(String(numeric));
        } else {
            setDisplay('');
            onChange('');
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setFocused(true);
        e.target.select();
    };

    return (
        <div className="space-y-1">
            <Label className={labelClassName}>{label}</Label>
            <Input
                type="text"
                inputMode="decimal"
                value={display}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={`bg-background border-border tabular-nums ${className}`}
                placeholder={placeholder}
                data-testid={testId}
                disabled={disabled}
            />
        </div>
    );
}
