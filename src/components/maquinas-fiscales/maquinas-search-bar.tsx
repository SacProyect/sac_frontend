import { Search } from 'lucide-react';
import { Input } from '@/components/UI/input';

interface MaquinasSearchBarProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function MaquinasSearchBar({ 
  value, 
  onValueChange, 
  placeholder = "Buscar por RIF, razón social o serial..." 
}: MaquinasSearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  );
}
