import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/select';

interface YearSelectorProps {
  value: number;
  onChange: (year: number) => void;
  years?: number[];
  label?: string;
  className?: string;
}

/**
 * YearSelector - Selector de año reutilizable para dashboards V2
 */
export function YearSelector({
  value,
  onChange,
  years,
  label = 'Año:',
  className = '',
}: YearSelectorProps) {
  const defaultYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const yearOptions = years || defaultYears;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <Select value={value.toString()} onValueChange={(val) => onChange(Number(val))}>
        <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-slate-700 border-slate-600">
          {yearOptions.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
