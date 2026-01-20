import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface VariationOption {
  id: string;
  name: string;
  sku?: string;
  asin?: string;
  fnsku?: string;
  upc?: string;
}

interface VariationSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  variations: VariationOption[];
  placeholder?: string;
  className?: string;
}

export function VariationSelector({
  value,
  onValueChange,
  variations,
  placeholder = "Select variation...",
  className,
}: VariationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedVariation = useMemo(() => {
    if (value === 'all') return null;
    return variations.find((v) => v.id === value);
  }, [value, variations]);

  const filteredVariations = useMemo(() => {
    if (!search) return variations;
    const lowerSearch = search.toLowerCase();
    return variations.filter((v) =>
      v.name.toLowerCase().includes(lowerSearch) ||
      v.sku?.toLowerCase().includes(lowerSearch) ||
      v.asin?.toLowerCase().includes(lowerSearch) ||
      v.fnsku?.toLowerCase().includes(lowerSearch) ||
      v.upc?.toLowerCase().includes(lowerSearch)
    );
  }, [variations, search]);

  const getDisplayLabel = (variation: VariationOption) => {
    const parts = [variation.name];
    if (variation.sku) parts.push(variation.sku);
    if (variation.asin) parts.push(variation.asin);
    return parts.join(' - ');
  };

  const getFullLabel = (variation: VariationOption) => {
    const parts = [variation.name];
    if (variation.sku) parts.push(variation.sku);
    if (variation.asin) parts.push(variation.asin);
    if (variation.fnsku) parts.push(variation.fnsku);
    if (variation.upc) parts.push(variation.upc);
    return parts.join(' - ');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between h-9 text-sm font-normal", className)}
        >
          <span className="truncate">
            {value === 'all' ? (
              <span className="font-medium">All Variations</span>
            ) : selectedVariation ? (
              getDisplayLabel(selectedVariation)
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 z-50 bg-popover" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search by name, SKU, ASIN, FNSKU, UPC..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No variation found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onValueChange('all');
                  setOpen(false);
                  setSearch('');
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === 'all' ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="font-medium">All Variations</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={`Variations (${filteredVariations.length})`}>
              {filteredVariations.map((variation) => (
                <CommandItem
                  key={variation.id}
                  value={variation.id}
                  onSelect={() => {
                    onValueChange(variation.id);
                    setOpen(false);
                    setSearch('');
                  }}
                  className="flex flex-col items-start py-2"
                >
                  <div className="flex items-center w-full">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value === variation.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{variation.name}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {[variation.sku, variation.asin, variation.fnsku, variation.upc]
                          .filter(Boolean)
                          .join(' • ')}
                      </span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
