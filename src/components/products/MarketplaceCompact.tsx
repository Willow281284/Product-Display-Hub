import { cn } from '@/lib/utils';
import { MarketplaceStatus } from '@/types/product';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle } from 'lucide-react';

interface MarketplaceIconProps {
  platform: string;
  status: 'live' | 'inactive' | 'error' | 'not_listed';
  size?: 'sm' | 'md';
}

const platformColors: Record<string, string> = {
  amazon: 'bg-amazon',
  walmart: 'bg-walmart',
  ebay: 'bg-ebay',
  newegg: 'bg-newegg',
  bestbuy: 'bg-blue-600',
  target: 'bg-red-500',
  etsy: 'bg-orange-500',
  shopify: 'bg-green-500',
  temu: 'bg-orange-600',
  macys: 'bg-red-600',
  costco: 'bg-red-700',
  homedepot: 'bg-orange-700',
  lowes: 'bg-blue-700',
  wayfair: 'bg-purple-600',
  overstock: 'bg-red-500',
};

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

const platformShortLabels: Record<string, string> = {
  amazon: 'AMZ',
  walmart: 'WMT',
  ebay: 'eBay',
  newegg: 'NEG',
  bestbuy: 'BBY',
  target: 'TGT',
  etsy: 'Etsy',
  shopify: 'SHP',
  temu: 'Temu',
  macys: 'MCY',
  costco: 'COS',
  homedepot: 'HD',
  lowes: 'LOW',
  wayfair: 'WFR',
  overstock: 'OVS',
};

function MarketplaceIcon({ platform, status, size = 'md' }: MarketplaceIconProps) {
  const bgColor = platformColors[platform] || 'bg-gray-500';
  const label = platformShortLabels[platform] || platform.slice(0, 3).toUpperCase();
  const fullName = platformLabels[platform] || platform;
  
  const statusConfig = {
    live: { color: 'bg-live', label: 'Live', textColor: 'text-live' },
    inactive: { color: 'bg-inactive', label: 'Inactive', textColor: 'text-muted-foreground' },
    error: { color: 'bg-destructive', label: 'Error', textColor: 'text-destructive' },
    not_listed: { color: 'bg-gray-400', label: 'Not Listed', textColor: 'text-gray-400' },
  };
  
  const statusInfo = statusConfig[status];
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'relative flex items-center justify-center rounded font-semibold text-white cursor-pointer transition-all hover:scale-105 hover:shadow-md',
            bgColor,
            size === 'sm' ? 'px-2 py-1 text-[9px] min-w-[32px]' : 'px-2.5 py-1.5 text-[11px] min-w-[40px]',
            status === 'inactive' && 'opacity-50 grayscale',
            status === 'error' && 'ring-2 ring-destructive ring-offset-1 ring-offset-background'
          )}
        >
          {label}
          {status === 'error' ? (
            <AlertCircle className="absolute -top-1 -right-1 w-3.5 h-3.5 text-destructive bg-background rounded-full" />
          ) : (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background',
                statusInfo.color,
                status === 'live' && 'animate-pulse'
              )}
            />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium">{fullName}</span>
          <span className={cn('flex items-center gap-1', statusInfo.textColor)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', statusInfo.color)} />
            {statusInfo.label}
          </span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

interface MarketplaceCompactProps {
  marketplaces: MarketplaceStatus[];
  onClick?: () => void;
  maxVisible?: number;
}

export function MarketplaceCompact({ marketplaces, onClick, maxVisible = 5 }: MarketplaceCompactProps) {
  const liveCount = marketplaces.filter((m) => m.status === 'live').length;
  const errorCount = marketplaces.filter((m) => m.status === 'error').length;
  const totalCount = marketplaces.length;
  
  // Handle "Not Listed" case - no marketplaces connected
  if (totalCount === 0) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
      >
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
          <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
          <span>Not Listed</span>
        </div>
        <span className="text-muted-foreground text-xs opacity-0 group-hover:opacity-100 transition-opacity ml-1">
          →
        </span>
      </button>
    );
  }
  
  // Sort: error first, then live, then inactive
  const sorted = [...marketplaces].sort((a, b) => {
    const priority = { error: 0, live: 1, inactive: 2 };
    return priority[a.status] - priority[b.status];
  });
  
  const visible = sorted.slice(0, maxVisible);
  const hiddenCount = totalCount - maxVisible;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
    >
      {/* Summary Badges */}
      <div className="flex items-center gap-1.5">
        {/* Live Count Badge */}
        <div className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
          liveCount > 0 
            ? 'bg-live/10 text-live border border-live/20' 
            : 'bg-muted text-muted-foreground border border-border'
        )}>
          <span className={cn(
            'w-2 h-2 rounded-full',
            liveCount > 0 ? 'bg-live animate-pulse' : 'bg-inactive'
          )} />
          <span>{liveCount}/{totalCount}</span>
        </div>

        {/* Error Count Badge - Only show if there are errors */}
        {errorCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="w-3 h-3" />
            <span>{errorCount}</span>
          </div>
        )}
      </div>

      {/* Marketplace Icons */}
      <div className="flex items-center gap-1">
        {visible.map((mp) => (
          <MarketplaceIcon
            key={mp.platform}
            platform={mp.platform}
            status={mp.status}
            size="md"
          />
        ))}
        {hiddenCount > 0 && (
          <div className="px-2 py-1 flex items-center justify-center rounded bg-muted text-muted-foreground text-[10px] font-medium">
            +{hiddenCount}
          </div>
        )}
      </div>

      {/* Expand indicator */}
      <span className="text-muted-foreground text-xs opacity-0 group-hover:opacity-100 transition-opacity ml-1">
        →
      </span>
    </button>
  );
}
