import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EditableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  onAddNew?: (name: string, details?: string) => void;
  placeholder?: string;
  label?: string;
  allowAddNew?: boolean;
  addNewLabel?: string;
  detailsLabel?: string;
  showDetails?: boolean;
}

export function EditableCombobox({
  value,
  onChange,
  options,
  onAddNew,
  placeholder = 'Select...',
  label = 'Name',
  allowAddNew = true,
  addNewLabel = 'Add New',
  detailsLabel = 'Details',
  showDetails = false,
}: EditableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [searchValue, setSearchValue] = useState('');

  // Filter options based on search
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleAddNew = () => {
    if (!newName.trim()) return;
    
    if (onAddNew) {
      onAddNew(newName.trim(), showDetails ? newDetails.trim() : undefined);
    }
    onChange(newName.trim());
    setNewName('');
    setNewDetails('');
    setShowAddDialog(false);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {value || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 bg-popover border shadow-md z-50" align="start">
          <Command>
            <CommandInput 
              placeholder={`Search ${label.toLowerCase()}...`} 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                {allowAddNew ? (
                  <div className="py-2 px-2">
                    <p className="text-sm text-muted-foreground mb-2">No results found.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full gap-1.5"
                      onClick={() => {
                        setNewName(searchValue);
                        setShowAddDialog(true);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Add "{searchValue}"
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-2">No results found.</p>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => {
                      onChange(option);
                      setOpen(false);
                      setSearchValue('');
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option}
                  </CommandItem>
                ))}
              </CommandGroup>
              {allowAddNew && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setNewName('');
                        setNewDetails('');
                        setShowAddDialog(true);
                      }}
                      className="text-primary"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {addNewLabel}
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Add New Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{addNewLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">{label}</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`Enter ${label.toLowerCase()}...`}
              />
            </div>
            {showDetails && (
              <div className="space-y-2">
                <Label htmlFor="new-details">{detailsLabel}</Label>
                <Textarea
                  id="new-details"
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  placeholder={`Enter ${detailsLabel.toLowerCase()}...`}
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNew} disabled={!newName.trim()}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
