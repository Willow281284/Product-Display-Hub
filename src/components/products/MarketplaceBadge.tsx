import { cn } from '@/lib/utils';
import { MarketplaceStatus } from '@/types/product';
import { Snowflake } from 'lucide-react';

interface MarketplaceBadgeProps {
  marketplace: MarketplaceStatus;
  onClick?: () => void;
}

const platformConfig: Record<string, { name: string; className: string }> = {
  amazon: {
    name: 'Amazon',
    className: 'bg-amazon/10 text-amazon border-amazon/20 hover:bg-amazon/20',
  },
  walmart: {
    name: 'Walmart',
    className: 'bg-walmart/10 text-walmart border-walmart/20 hover:bg-walmart/20',
  },
  ebay: {
    name: 'eBay',
    className: 'bg-ebay/10 text-ebay border-ebay/20 hover:bg-ebay/20',
  },
  newegg: {
    name: 'Newegg',
    className: 'bg-newegg/10 text-newegg border-newegg/20 hover:bg-newegg/20',
  },
  bestbuy: {
    name: 'Best Buy',
    className: 'bg-blue-600/10 text-blue-400 border-blue-600/20 hover:bg-blue-600/20',
  },
  target: {
    name: 'Target',
    className: 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20',
  },
  etsy: {
    name: 'Etsy',
    className: 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20',
  },
  shopify: {
    name: 'Shopify',
    className: 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20',
  },
  temu: {
    name: 'Temu',
    className: 'bg-orange-600/10 text-orange-400 border-orange-600/20 hover:bg-orange-600/20',
  },
  macys: {
    name: "Macy's",
    className: 'bg-red-600/10 text-red-400 border-red-600/20 hover:bg-red-600/20',
  },
  costco: {
    name: 'Costco',
    className: 'bg-red-700/10 text-red-400 border-red-700/20 hover:bg-red-700/20',
  },
  homedepot: {
    name: 'Home Depot',
    className: 'bg-orange-700/10 text-orange-400 border-orange-700/20 hover:bg-orange-700/20',
  },
  lowes: {
    name: "Lowe's",
    className: 'bg-blue-700/10 text-blue-400 border-blue-700/20 hover:bg-blue-700/20',
  },
  wayfair: {
    name: 'Wayfair',
    className: 'bg-purple-600/10 text-purple-400 border-purple-600/20 hover:bg-purple-600/20',
  },
  overstock: {
    name: 'Overstock',
    className: 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20',
  },
};

export function MarketplaceBadge({ marketplace, onClick }: MarketplaceBadgeProps) {
  const config = platformConfig[marketplace.platform] || {
    name: marketplace.platform,
    className: 'bg-muted text-muted-foreground border-border',
  };
  const isLive = marketplace.status === 'live';

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer',
        isLive ? config.className : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
      )}
    >
      <span className="font-semibold">{config.name}</span>
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          isLive ? 'bg-live animate-pulse' : 'bg-inactive'
        )}
      />
      <span className="text-[10px] opacity-75">
        {isLive ? 'Live' : 'Off'}
      </span>
      <Snowflake className="w-3.5 h-3.5 ml-1 opacity-60" />
    </button>
  );
}
