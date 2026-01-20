import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag, tagColors } from '@/types/tag';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface TagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: Tag | null;
  onSave: (tag: Tag) => void;
}

export function TagDialog({ open, onOpenChange, tag, onSave }: TagDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(tagColors[0].value);
  const [customColor, setCustomColor] = useState('');
  const [useCustomColor, setUseCustomColor] = useState(false);

  useEffect(() => {
    if (tag) {
      setName(tag.name);
      // Check if tag color is a preset or custom
      const isPreset = tagColors.some(c => c.value === tag.color);
      if (isPreset) {
        setColor(tag.color);
        setUseCustomColor(false);
        setCustomColor('');
      } else {
        setCustomColor(tag.color);
        setUseCustomColor(true);
        setColor('');
      }
    } else {
      setName('');
      setColor(tagColors[0].value);
      setCustomColor('');
      setUseCustomColor(false);
    }
  }, [tag, open]);

  const handlePresetColorClick = (presetColor: string) => {
    setColor(presetColor);
    setUseCustomColor(false);
  };

  const handleCustomColorChange = (value: string) => {
    setCustomColor(value);
    setUseCustomColor(true);
    setColor('');
  };

  const activeColor = useCustomColor ? customColor : color;

  const handleSave = () => {
    if (!name.trim() || !activeColor) return;

    onSave({
      id: tag?.id || `tag-${Date.now()}`,
      name: name.trim(),
      color: activeColor,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tag ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tag-name">Tag Name</Label>
            <Input
              id="tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tag name..."
              maxLength={30}
            />
          </div>

          <div className="space-y-3">
            <Label>Color</Label>
            <div className="grid grid-cols-6 gap-2">
              {tagColors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => handlePresetColorClick(c.value)}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110',
                    !useCustomColor && color === c.value && 'ring-2 ring-offset-2 ring-foreground'
                  )}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                >
                  {!useCustomColor && color === c.value && (
                    <Check className="w-4 h-4 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3 pt-2">
              <Label htmlFor="custom-color" className="text-sm text-muted-foreground whitespace-nowrap">
                Custom:
              </Label>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="color"
                  id="custom-color"
                  value={customColor || '#6366f1'}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className={cn(
                    'w-10 h-10 rounded-lg cursor-pointer border-2 border-border',
                    useCustomColor && 'ring-2 ring-offset-2 ring-foreground'
                  )}
                />
                <Input
                  value={customColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  placeholder="#6366f1"
                  className="w-28 h-9 font-mono text-sm"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: activeColor || '#6366f1' }}
              >
                {name || 'Tag Name'}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !activeColor}>
            {tag ? 'Save Changes' : 'Create Tag'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
