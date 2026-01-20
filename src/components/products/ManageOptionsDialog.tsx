import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Plus,
  Trash2,
  GripVertical,
  Palette,
  List,
  Image,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';

interface ProductOption {
  name: string;
  choices: string[];
  displayAs: 'list' | 'color';
  linkImages: boolean;
}

interface ManageOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: ProductOption[];
  onOptionsChange: (options: ProductOption[]) => void;
  variationCount: number;
}

const DEFAULT_OPTION_TYPES = [
  { value: 'color', label: 'Color' },
  { value: 'size', label: 'Size' },
  { value: 'style', label: 'Style' },
  { value: 'material', label: 'Material' },
  { value: 'pattern', label: 'Pattern' },
  { value: 'weight', label: 'Weight' },
  { value: 'length', label: 'Length' },
  { value: 'flavor', label: 'Flavor' },
  { value: 'scent', label: 'Scent' },
];

export function ManageOptionsDialog({
  open,
  onOpenChange,
  options,
  onOptionsChange,
  variationCount,
}: ManageOptionsDialogProps) {
  const [localOptions, setLocalOptions] = useState<ProductOption[]>(options);
  const [newChoiceInputs, setNewChoiceInputs] = useState<Record<number, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'option' | 'choice'; optionIndex: number; choiceIndex?: number } | null>(null);
  const [customTypeInputs, setCustomTypeInputs] = useState<Record<number, boolean>>({});
  const [customOptionTypes, setCustomOptionTypes] = useState<string[]>([]);

  // Get all option types including custom ones
  const getAllOptionTypes = () => {
    const customTypes = customOptionTypes
      .filter(t => t && t.trim() !== '')
      .map(t => ({ value: t.toLowerCase(), label: t.charAt(0).toUpperCase() + t.slice(1) }));
    const existingCustom = localOptions
      .map(o => o.name)
      .filter(name => name && name.trim() !== '' && !DEFAULT_OPTION_TYPES.some(t => t.value === name))
      .map(name => ({ value: name, label: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ') }));
    
    const allTypes = [...DEFAULT_OPTION_TYPES, ...customTypes, ...existingCustom];
    // Remove duplicates and empty values
    const unique = allTypes.filter((type, index, self) => 
      type.value && type.value.trim() !== '' && index === self.findIndex(t => t.value === type.value)
    );
    return unique;
  };

  // Sync local state when dialog opens
  useState(() => {
    if (open) {
      setLocalOptions(options);
    }
  });

  const addOption = () => {
    const newOption: ProductOption = {
      name: 'color',
      choices: [],
      displayAs: 'list',
      linkImages: false,
    };
    setLocalOptions([...localOptions, newOption]);
  };

  const removeOption = (index: number) => {
    // Check if option has choices that are linked to variations
    if (localOptions[index].choices.length > 0 && variationCount > 0) {
      setDeleteConfirm({ type: 'option', optionIndex: index });
      return;
    }
    const updated = localOptions.filter((_, i) => i !== index);
    setLocalOptions(updated);
  };

  const confirmDeleteOption = () => {
    if (deleteConfirm?.type === 'option') {
      const updated = localOptions.filter((_, i) => i !== deleteConfirm.optionIndex);
      setLocalOptions(updated);
      toast.success('Option removed');
    } else if (deleteConfirm?.type === 'choice' && deleteConfirm.choiceIndex !== undefined) {
      const updated = [...localOptions];
      updated[deleteConfirm.optionIndex].choices = updated[deleteConfirm.optionIndex].choices.filter(
        (_, i) => i !== deleteConfirm.choiceIndex
      );
      setLocalOptions(updated);
      toast.success('Choice removed');
    }
    setDeleteConfirm(null);
  };

  const updateOptionName = (index: number, name: string) => {
    const updated = [...localOptions];
    updated[index].name = name;
    setLocalOptions(updated);
  };

  const updateOptionDisplayAs = (index: number, displayAs: 'list' | 'color') => {
    const updated = [...localOptions];
    updated[index].displayAs = displayAs;
    setLocalOptions(updated);
  };

  const addChoice = (optionIndex: number) => {
    const choiceValue = newChoiceInputs[optionIndex]?.trim();
    if (!choiceValue) return;

    const updated = [...localOptions];
    if (!updated[optionIndex].choices.includes(choiceValue)) {
      updated[optionIndex].choices.push(choiceValue);
      setLocalOptions(updated);
      setNewChoiceInputs({ ...newChoiceInputs, [optionIndex]: '' });
    } else {
      toast.error('This choice already exists');
    }
  };

  const removeChoice = (optionIndex: number, choiceIndex: number) => {
    // Check if this choice is used in variations
    if (variationCount > 0) {
      setDeleteConfirm({ type: 'choice', optionIndex, choiceIndex });
      return;
    }
    const updated = [...localOptions];
    updated[optionIndex].choices = updated[optionIndex].choices.filter((_, i) => i !== choiceIndex);
    setLocalOptions(updated);
  };

  const handleSave = () => {
    onOptionsChange(localOptions);
    onOpenChange(false);
    toast.success('Options saved successfully');
  };

  const handleCancel = () => {
    setLocalOptions(options);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[900px] !w-[95vw] !h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="text-xl">Manage Product Options</DialogTitle>
            <DialogDescription>
              Add, edit, or remove product options and their values. Options with linked variations cannot be deleted.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6">
            <div className="py-4 space-y-6">
              {localOptions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Palette className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p className="font-medium text-lg mb-2">No Options Added</p>
                  <p className="text-sm mb-4">Add options like Color, Size, or Material to create product variations.</p>
                  <Button onClick={addOption} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add First Option
                  </Button>
                </div>
              ) : (
                localOptions.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className="border rounded-lg overflow-hidden bg-card"
                  >
                    {/* Option Header */}
                    <div className="bg-muted/50 px-4 py-3 flex items-center gap-3 border-b flex-wrap">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
                      
                      {/* Option Type Section */}
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium whitespace-nowrap">Type:</Label>
                        {customTypeInputs[optionIndex] ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={option.name}
                              onChange={(e) => updateOptionName(optionIndex, e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                              placeholder="e.g. flavor, scent..."
                              className="w-40 h-9"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (option.name && !customOptionTypes.includes(option.name)) {
                                    setCustomOptionTypes([...customOptionTypes, option.name]);
                                  }
                                  setCustomTypeInputs({ ...customTypeInputs, [optionIndex]: false });
                                }
                              }}
                            />
                            <Button
                              size="icon"
                              variant="default"
                              className="h-9 w-9"
                              onClick={() => {
                                if (option.name && !customOptionTypes.includes(option.name)) {
                                  setCustomOptionTypes([...customOptionTypes, option.name]);
                                }
                                setCustomTypeInputs({ ...customTypeInputs, [optionIndex]: false });
                              }}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9"
                              onClick={() => {
                                updateOptionName(optionIndex, 'color');
                                setCustomTypeInputs({ ...customTypeInputs, [optionIndex]: false });
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Select
                              value={getAllOptionTypes().some(t => t.value === option.name) ? option.name : 'custom-current'}
                              onValueChange={(val) => {
                                if (val !== 'custom-current') {
                                  updateOptionName(optionIndex, val);
                                }
                              }}
                            >
                              <SelectTrigger className="w-32 h-9">
                                <SelectValue>
                                  {option.name ? option.name.charAt(0).toUpperCase() + option.name.slice(1).replace(/_/g, ' ') : "Select"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {getAllOptionTypes().map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                                {option.name && !getAllOptionTypes().some(t => t.value === option.name) && (
                                  <SelectItem value="custom-current">
                                    {option.name.charAt(0).toUpperCase() + option.name.slice(1).replace(/_/g, ' ')}
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-9 gap-1.5 px-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                updateOptionName(optionIndex, '');
                                setCustomTypeInputs({ ...customTypeInputs, [optionIndex]: true });
                              }}
                            >
                              <Plus className="w-4 h-4" />
                              Custom
                            </Button>
                          </div>
                        )}
                      </div>

                      <Separator orientation="vertical" className="h-6 hidden sm:block" />

                      {/* Display As Section */}
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium whitespace-nowrap">Display:</Label>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={option.displayAs === 'list' ? 'default' : 'outline'}
                            onClick={() => updateOptionDisplayAs(optionIndex, 'list')}
                            className="h-8 gap-1.5 px-3"
                          >
                            <List className="w-3.5 h-3.5" />
                            List
                          </Button>
                          <Button
                            size="sm"
                            variant={option.displayAs === 'color' ? 'default' : 'outline'}
                            onClick={() => updateOptionDisplayAs(optionIndex, 'color')}
                            className="h-8 gap-1.5 px-3"
                          >
                            <Palette className="w-3.5 h-3.5" />
                            Swatch
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        <Badge variant="secondary" className="text-xs">
                          {option.choices.length} values
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeOption(optionIndex)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Option Choices */}
                    <div className="p-4">
                      <Label className="text-sm font-medium mb-3 block">Option Values</Label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {option.choices.map((choice, choiceIndex) => (
                          <Badge
                            key={choiceIndex}
                            variant="secondary"
                            className="px-3 py-1.5 gap-2 text-sm bg-background border"
                          >
                            {option.displayAs === 'color' && (
                              <span 
                                className="w-3 h-3 rounded-full border" 
                                style={{ backgroundColor: choice.startsWith('#') ? choice : undefined }}
                              />
                            )}
                            {choice}
                            <button
                              onClick={() => removeChoice(optionIndex, choiceIndex)}
                              className="ml-1 hover:text-destructive transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>

                      {/* Add new choice */}
                      <div className="flex gap-2">
                        <Input
                          value={newChoiceInputs[optionIndex] || ''}
                          onChange={(e) =>
                            setNewChoiceInputs({ ...newChoiceInputs, [optionIndex]: e.target.value })
                          }
                          onKeyDown={(e) => e.key === 'Enter' && addChoice(optionIndex)}
                          placeholder="Type a value and press Enter..."
                          className="flex-1 h-9"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addChoice(optionIndex)}
                          className="h-9 gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {localOptions.length > 0 && (
                <Button onClick={addOption} variant="outline" className="gap-2 w-full">
                  <Plus className="w-4 h-4" />
                  Add Another Option
                </Button>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t shrink-0 gap-2">
            <div className="flex-1 text-sm text-muted-foreground">
              {variationCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  {variationCount} variation(s) will be affected by changes
                </span>
              )}
            </div>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Check className="w-4 h-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'option'
                ? 'This option has values that may be linked to product variations. Deleting it will affect all associated variations. Are you sure you want to continue?'
                : 'This value may be linked to product variations. Deleting it will affect those variations. Are you sure you want to continue?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteOption}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
