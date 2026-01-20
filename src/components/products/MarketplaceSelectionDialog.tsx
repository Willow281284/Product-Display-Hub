import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MarketplaceLogo } from './MarketplaceLogo';
import { Upload, RefreshCw, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketplaceOption {
  platform: string;
  label: string;
  status?: 'live' | 'inactive' | 'error' | 'not_listed';
}

interface MarketplaceSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  marketplaces: MarketplaceOption[];
  onConfirm: (selectedPlatforms: string[]) => void;
  confirmLabel?: string;
  isLoading?: boolean;
  mode?: 'publish' | 'sync';
}

const platformLabels: Record<string, string> = {
  amazon: 'Amazon',
  walmart: 'Walmart',
  ebay: 'eBay',
  newegg: 'Newegg',
  bestbuy: 'Best Buy',
  target: 'Target',
  etsy: 'Etsy',
  shopify: 'Shopify',
  temu: 'Temu',
  macys: "Macy's",
  costco: 'Costco',
  homedepot: 'Home Depot',
  lowes: "Lowe's",
  wayfair: 'Wayfair',
  overstock: 'Overstock',
};

export function MarketplaceSelectionDialog({
  open,
  onOpenChange,
  title,
  description,
  marketplaces,
  onConfirm,
  confirmLabel = 'Confirm',
  isLoading = false,
  mode = 'publish',
}: MarketplaceSelectionDialogProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const handleToggle = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSelectAll = () => {
    if (selectedPlatforms.length === marketplaces.length) {
      setSelectedPlatforms([]);
    } else {
      setSelectedPlatforms(marketplaces.map((m) => m.platform));
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedPlatforms);
    setSelectedPlatforms([]);
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedPlatforms([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'publish' ? (
              <Upload className="w-5 h-5 text-primary" />
            ) : (
              <RefreshCw className="w-5 h-5 text-primary" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">
              {selectedPlatforms.length} of {marketplaces.length} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs"
            >
              {selectedPlatforms.length === marketplaces.length
                ? 'Deselect All'
                : 'Select All'}
            </Button>
          </div>

          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-2">
              {marketplaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <p className="text-sm">No marketplaces available</p>
                  <p className="text-xs mt-1">
                    {mode === 'publish' ? 'All marketplaces are already listed' : 'No live marketplaces to update'}
                  </p>
                </div>
              ) : (
                marketplaces.map((mp) => (
                  <div
                    key={mp.platform}
                    onClick={() => handleToggle(mp.platform)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                      selectedPlatforms.includes(mp.platform)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/50'
                    )}
                  >
                    <Checkbox
                      checked={selectedPlatforms.includes(mp.platform)}
                      onCheckedChange={() => handleToggle(mp.platform)}
                    />
                    <MarketplaceLogo platform={mp.platform} size="sm" />
                    <span className="font-medium flex-1">
                      {platformLabels[mp.platform] || mp.platform}
                    </span>
                    {mp.status === 'live' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedPlatforms.length === 0 || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {mode === 'publish' ? (
                  <Upload className="w-4 h-4" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {confirmLabel} ({selectedPlatforms.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
