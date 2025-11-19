import { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from './DateRangePicker';
import { Button } from './ui/button';

export type Filters = {
  dateRange: DateRange | undefined;
  description: string;
  type: string;
};

type TransactionsFilterProps = {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
};

export const TransactionsFilter = ({
  filters,
  onFilterChange,
}: TransactionsFilterProps) => {
  const handleDateChange = (dateRange: DateRange | undefined) => {
    onFilterChange({ ...filters, dateRange });
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onFilterChange({ ...filters, description: e.target.value });
  };

  const handleTypeChange = (type: string) => {
    onFilterChange({ ...filters, type: type === 'all' ? '' : type });
  };

  const clearFilters = () => {
    onFilterChange({
      dateRange: undefined,
      description: '',
      type: '',
    });
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 p-4 border rounded-md">
      <DateRangePicker
        date={filters.dateRange}
        onDateChange={handleDateChange}
      />
      <Input
        placeholder="Filtrar por descrição..."
        value={filters.description}
        onChange={handleDescriptionChange}
        className="max-w-sm"
      />
      <Select value={filters.type || 'all'} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Tipos</SelectItem>
          <SelectItem value="receita">Receita</SelectItem>
          <SelectItem value="despesa fixa">Despesa Fixa</SelectItem>
          <SelectItem value="despesa variável">Despesa Variável</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={clearFilters} variant="outline">
        Limpar Filtros
      </Button>
    </div>
  );
};