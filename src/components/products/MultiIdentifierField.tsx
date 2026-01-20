import { useState } from 'react';
import { Plus, Trash2, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MultiIdentifierFieldProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MultiIdentifierField({
  label,
  values,
  onChange,
  placeholder = "Enter value...",
  icon,
  className,
}: MultiIdentifierFieldProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleAdd = () => {
    onChange([...values, '']);
  };

  const handleRemove = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    // Keep at least one empty field
    if (newValues.length === 0) {
      onChange(['']);
    } else {
      onChange(newValues);
    }
  };

  const handleChange = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value;
    onChange(newValues);
  };

  const handleCopy = async (value: string, index: number) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedIndex(index);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  // Ensure at least one field exists
  const displayValues = values.length === 0 ? [''] : values;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-muted-foreground text-sm flex items-center gap-2">
          {icon}
          {label}
          {displayValues.filter(v => v.trim()).length > 1 && (
            <Badge variant="secondary" className="text-xs font-normal">
              {displayValues.filter(v => v.trim()).length}
            </Badge>
          )}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="h-7 text-xs gap-1"
        >
          <Plus className="w-3 h-3" />
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {displayValues.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                value={value}
                onChange={(e) => handleChange(index, e.target.value)}
                placeholder={placeholder}
                className="pr-10"
              />
              {displayValues.length > 1 && (
                <Badge 
                  variant="outline" 
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0 h-5 bg-background"
                >
                  #{index + 1}
                </Badge>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(value, index)}
              disabled={!value}
              className="h-9 w-9 shrink-0"
            >
              {copiedIndex === index ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            {displayValues.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
