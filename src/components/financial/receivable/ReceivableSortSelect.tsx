
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReceivableSortSelectProps {
  sortOrder: 'desc' | 'asc';
  onSortChange: (value: 'desc' | 'asc') => void;
  isMobile?: boolean;
}

export const ReceivableSortSelect = ({ sortOrder, onSortChange, isMobile = false }: ReceivableSortSelectProps) => {
  return (
    <Select value={sortOrder} onValueChange={onSortChange}>
      <SelectTrigger className={isMobile ? "h-9 text-xs px-2" : "w-48"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-white">
        <SelectItem value="desc">{isMobile ? "+ Recente" : "Mais recente primeiro"}</SelectItem>
        <SelectItem value="asc">{isMobile ? "+ Antiga" : "Mais antiga primeiro"}</SelectItem>
      </SelectContent>
    </Select>
  );
};
