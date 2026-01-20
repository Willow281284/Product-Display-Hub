import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Bookmark, Check, Trash2, Star } from 'lucide-react';
import { CustomFilter } from '@/types/customFilter';
import { cn } from '@/lib/utils';

interface SavedFiltersDropdownProps {
  filters: CustomFilter[];
  activeFilterId: string | null;
  onToggleFilter: (filterId: string) => void;
  onDeleteFilter: (filterId: string) => void;
}

export function SavedFiltersDropdown({
  filters,
  activeFilterId,
  onToggleFilter,
  onDeleteFilter,
}: SavedFiltersDropdownProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={activeFilterId ? "default" : "outline"} 
          size="sm" 
          className="gap-1.5"
        >
          <Bookmark className={cn("w-4 h-4", activeFilterId && "fill-current")} />
          <span className="hidden sm:inline">Saved</span>
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
            {filters.length}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Saved Filters</p>
        </div>
        <DropdownMenuSeparator />
        {filters.map((filter) => (
          <DropdownMenuItem
            key={filter.id}
            className="flex items-center justify-between group cursor-pointer"
            onClick={() => onToggleFilter(filter.id)}
          >
            <div className="flex items-center gap-2 min-w-0">
              {activeFilterId === filter.id ? (
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
              ) : (
                <Star className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className="truncate">{filter.name}</span>
              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                {filter.criteria.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFilter(filter.id);
              }}
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
