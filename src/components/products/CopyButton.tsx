import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  value: string;
  className?: string;
  size?: 'sm' | 'xs';
}

export function CopyButton({ value, className, size = 'xs' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={cn(
        "p-0 h-auto opacity-0 group-hover:opacity-100 transition-opacity",
        size === 'xs' && "w-5 h-5",
        size === 'sm' && "w-6 h-6",
        className
      )}
    >
      {copied ? (
        <Check className={cn(
          "text-success",
          size === 'xs' && "w-3 h-3",
          size === 'sm' && "w-3.5 h-3.5"
        )} />
      ) : (
        <Copy className={cn(
          "text-muted-foreground hover:text-foreground",
          size === 'xs' && "w-3 h-3",
          size === 'sm' && "w-3.5 h-3.5"
        )} />
      )}
    </Button>
  );
}
