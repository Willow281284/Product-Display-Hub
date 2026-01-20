import { cn } from '@/lib/utils';

type MarketplacePlatform = 'amazon' | 'walmart' | 'ebay' | 'newegg' | 'bestbuy' | 'target' | 
  'etsy' | 'shopify' | 'temu' | 'macys' | 'costco' | 'homedepot' | 'lowes' | 'wayfair' | 'overstock';

interface MarketplaceLogoProps {
  platform: MarketplacePlatform | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const marketplaceColors: Record<string, string> = {
  amazon: '#FF9900',
  walmart: '#0071CE',
  ebay: '#E53238',
  newegg: '#FF6600',
  bestbuy: '#0046BE',
  target: '#CC0000',
  etsy: '#F56400',
  shopify: '#7AB55C',
  temu: '#F97316',
  macys: '#E21A2C',
  costco: '#E31837',
  homedepot: '#F96302',
  lowes: '#004990',
  wayfair: '#7B0099',
  overstock: '#CC0000',
};

const marketplaceLabels: Record<string, string> = {
  amazon: 'AMZ',
  walmart: 'WMT',
  ebay: 'eBay',
  newegg: 'NE',
  bestbuy: 'BBY',
  target: 'TGT',
  etsy: 'Etsy',
  shopify: 'Shop',
  temu: 'Temu',
  macys: 'Mcy',
  costco: 'COST',
  homedepot: 'HD',
  lowes: 'LOW',
  wayfair: 'WF',
  overstock: 'OS',
};

export function MarketplaceLogo({ platform, size = 'sm', className }: MarketplaceLogoProps) {
  const sizeClasses = {
    xs: 'h-4 min-w-4 text-[8px]',
    sm: 'h-5 min-w-5 text-[10px]',
    md: 'h-7 min-w-7 text-xs',
    lg: 'h-10 min-w-10 text-sm',
  };

  // Custom SVG logos for major platforms
  if (platform === 'amazon') {
    return (
      <svg
        className={cn(size === 'xs' ? 'h-3 w-auto' : size === 'sm' ? 'h-4 w-auto' : size === 'md' ? 'h-5 w-auto' : 'h-6 w-auto', className)}
        viewBox="0 0 60 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text
          x="0"
          y="14"
          fill={marketplaceColors.amazon}
          fontFamily="Arial, sans-serif"
          fontSize="14"
          fontWeight="bold"
        >
          amazon
        </text>
        <path
          d="M40 16 C42 17, 52 18, 56 14"
          stroke={marketplaceColors.amazon}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (platform === 'ebay') {
    return (
      <svg
        className={cn(size === 'xs' ? 'h-3 w-auto' : size === 'sm' ? 'h-4 w-auto' : size === 'md' ? 'h-5 w-auto' : 'h-6 w-auto', className)}
        viewBox="0 0 50 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text x="0" y="16" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold">
          <tspan fill="#E53238">e</tspan>
          <tspan fill="#0064D2">b</tspan>
          <tspan fill="#F5AF02">a</tspan>
          <tspan fill="#86B817">y</tspan>
        </text>
      </svg>
    );
  }

  // Fallback to colored badge with abbreviation for all other platforms
  const color = marketplaceColors[platform] || '#6B7280';
  const label = marketplaceLabels[platform] || platform.slice(0, 3).toUpperCase();

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded px-1.5 py-0.5 font-bold text-white shrink-0',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color }}
    >
      {label}
    </div>
  );
}
