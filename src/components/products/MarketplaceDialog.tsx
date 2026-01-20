import { useState } from 'react';
import { format } from 'date-fns';
import { Product, MarketplaceStatus } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Trash2,
  Upload,
  Sparkles,
  Barcode,
  Power,
  PowerOff,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Package,
  ShoppingCart,
  Link2Off,
  Tag,
  Plus,
  Clock,
  Percent,
  Truck,
  Gift,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarketplaceLogo } from './MarketplaceLogo';
import { MarketplaceSelectionDialog } from './MarketplaceSelectionDialog';
import { OfferBadge } from './OfferBadge';
import { EditOfferDialog } from './EditOfferDialog';
import { CreateOfferDialog } from './CreateOfferDialog';
import { toast } from 'sonner';
import { mockProducts } from '@/data/mockProducts';
import { useOffers } from '@/hooks/useOffers';
import { 
  Offer, 
  getOfferStatus, 
  formatOfferDiscount, 
  getOfferDaysRemaining,
  offerStatusConfig,
  offerTypeLabels,
} from '@/types/offer';

interface MarketplaceDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MarketplaceData {
  platform: string;
  status: 'live' | 'inactive' | 'error' | 'not_listed';
  soldQty: number;
  revenue: number;
  msrpPrice: number;
  currentSalePrice: number;
  priceAutoSync: boolean;
  currentStock: number;
  inventoryAutoSync: boolean;
}

// All available marketplace platforms
const allPlatforms = [
  'amazon', 'walmart', 'ebay', 'newegg', 'bestbuy', 'target', 
  'etsy', 'shopify', 'temu', 'macys', 'costco', 'homedepot', 
  'lowes', 'wayfair', 'overstock'
];

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

export function MarketplaceDialog({
  product,
  open,
  onOpenChange,
}: MarketplaceDialogProps) {
  // Create a map of existing marketplaces by platform name
  const existingMarketplaces = new Map<string, typeof product.marketplaces[0]>(
    product.marketplaces.map(mp => [mp.platform, mp])
  );

  // Get offers for this product
  const { getOffersForProduct, deleteOffer, updateOffer, addOffer } = useOffers();
  const productOffers = getOffersForProduct(product.id);
  
  // Edit offer state
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  
  // Create offer dialog state
  const [showCreateOfferDialog, setShowCreateOfferDialog] = useState(false);

  // Initialize with ALL marketplaces - both listed and not listed
  const [marketplaces, setMarketplaces] = useState<MarketplaceData[]>(
    allPlatforms.map((platform) => {
      const existing = existingMarketplaces.get(platform);
      if (existing) {
        return {
          platform,
          status: existing.status,
          soldQty: Math.floor(Math.random() * 50),
          revenue: Math.floor(Math.random() * 1000),
          msrpPrice: product.salePrice * 1.2,
          currentSalePrice: existing.status === 'live' ? product.salePrice : 0,
          priceAutoSync: Math.random() > 0.5,
          currentStock: existing.status === 'live' ? product.stockQty : 0,
          inventoryAutoSync: existing.status === 'live',
        };
      }
      // Not listed on this marketplace
      return {
        platform,
        status: 'not_listed' as const,
        soldQty: 0,
        revenue: 0,
        msrpPrice: product.salePrice * 1.2,
        currentSalePrice: 0,
        priceAutoSync: false,
        currentStock: 0,
        inventoryAutoSync: false,
      };
    })
  );

  const [selectedForPublish, setSelectedForPublish] = useState<string[]>([]);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('listings');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleTogglePriceSync = (platform: string) => {
    setMarketplaces((prev) =>
      prev.map((mp) =>
        mp.platform === platform
          ? { ...mp, priceAutoSync: !mp.priceAutoSync }
          : mp
      )
    );
  };

  const handleToggleInventorySync = (platform: string) => {
    setMarketplaces((prev) =>
      prev.map((mp) =>
        mp.platform === platform
          ? { ...mp, inventoryAutoSync: !mp.inventoryAutoSync }
          : mp
      )
    );
  };

  const handleSalePriceChange = (platform: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setMarketplaces((prev) =>
      prev.map((mp) =>
        mp.platform === platform ? { ...mp, currentSalePrice: numValue } : mp
      )
    );
  };

  const handleStockChange = (platform: string, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setMarketplaces((prev) =>
      prev.map((mp) =>
        mp.platform === platform ? { ...mp, currentStock: numValue } : mp
      )
    );
  };

  // Direct publish for a single marketplace (row button)
  const handleDirectPublish = async (platform: string) => {
    setIsPublishing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setMarketplaces((prev) =>
      prev.map((mp) =>
        mp.platform === platform
          ? { ...mp, status: 'inactive' as const }
          : mp
      )
    );
    setIsPublishing(false);
    toast.success(`Published to ${platform}`, {
      description: 'Listing is now being processed'
    });
  };

  // Check if a marketplace can be published (not_listed, inactive, or error)
  const canPublish = (status: string) => status !== 'live';

  // Toggle checkbox selection for publishable marketplaces
  const handleToggleSelect = (platform: string) => {
    setSelectedForPublish((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  // Bulk publish selected marketplaces
  const handleBulkPublish = async (method: 'manual' | 'upc' | 'ai') => {
    if (selectedForPublish.length === 0) {
      toast.error('No marketplaces selected', {
        description: 'Please select marketplaces to publish'
      });
      return;
    }

    setIsPublishing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setMarketplaces((prev) =>
      prev.map((mp) =>
        selectedForPublish.includes(mp.platform)
          ? { ...mp, status: 'inactive' as const }
          : mp
      )
    );
    const count = selectedForPublish.length;
    setSelectedForPublish([]);
    setIsPublishing(false);
    
    const methodLabels = { manual: 'Manual', upc: 'UPC', ai: 'AI' };
    toast.success(`Published ${count} marketplace(s) via ${methodLabels[method]}`, {
      description: 'Listings are now being processed'
    });
  };

  const handleSaveChanges = () => {
    const liveMarketplacesList = marketplaces.filter(m => m.status === 'live');
    if (liveMarketplacesList.length > 0 && hasUnsavedChanges) {
      setShowSyncDialog(true);
    } else {
      toast.success('Changes saved successfully');
      onOpenChange(false);
    }
  };

  const handleSyncConfirm = async (selectedPlatforms: string[]) => {
    setIsSyncing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSyncing(false);
    toast.success(`Updated ${selectedPlatforms.length} live marketplace(s)`, {
      description: 'Changes have been pushed to selected marketplaces'
    });
    setHasUnsavedChanges(false);
    onOpenChange(false);
  };

  const handleFieldChange = () => {
    setHasUnsavedChanges(true);
  };

  const liveCount = marketplaces.filter((m) => m.status === 'live').length;
  const inactiveCount = marketplaces.filter((m) => m.status === 'inactive').length;
  const notListedCount = marketplaces.filter((m) => m.status === 'not_listed').length;

  const getStatusBadge = (status: 'live' | 'inactive' | 'error' | 'not_listed') => {
    switch (status) {
      case 'live':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
            Live
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs px-2 py-0.5">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      case 'not_listed':
        return (
          <Badge variant="outline" className="text-xs px-2 py-0.5 text-slate-500 border-slate-600 border-dashed bg-transparent">
            Not Listed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-slate-600 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
            Inactive
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-fit w-auto max-h-[96vh] p-0 gap-0 flex flex-col overflow-hidden bg-slate-900 border-slate-700">
        <DialogHeader className="sr-only">
          <DialogTitle>Marketplace Management</DialogTitle>
        </DialogHeader>

        {/* Summary Bar with Icons */}
        <div className="bg-slate-800 px-6 py-4 pr-14 flex items-center gap-8 flex-wrap border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-700 rounded-lg">
              <Package className="w-4 h-4 text-slate-300" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase">SKU</p>
              <p className="font-mono font-medium text-sm text-white">{product.vendorSku}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-700 rounded-lg">
              <Barcode className="w-4 h-4 text-slate-300" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase">Product ID</p>
              <p className="font-mono font-medium text-sm text-white">{product.productId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-700 rounded-lg">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase">Sale Price</p>
              <p className="font-medium text-sm text-emerald-400">{formatCurrency(product.salePrice)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-700 rounded-lg">
              <ShoppingCart className="w-4 h-4 text-slate-300" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase">Stock</p>
              <p className="font-medium text-sm text-white">{product.stockQty} units</p>
            </div>
          </div>
          
          {/* Status Counts */}
          <div className="ml-auto flex items-center gap-2">
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
              {liveCount} Live
            </Badge>
            {inactiveCount > 0 && (
              <Badge variant="secondary" className="px-3 py-1 gap-1.5 bg-slate-600 text-slate-200">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                {inactiveCount} Inactive
              </Badge>
            )}
            {notListedCount > 0 && (
              <Badge variant="outline" className="px-3 py-1 gap-1.5 border-slate-500 text-slate-300 border-dashed">
                {notListedCount} Not Listed
              </Badge>
            )}
          </div>
        </div>

        {/* Tabs for Listings and Offers */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 border-b border-slate-700 flex-shrink-0">
            <TabsList className="bg-transparent border-b-0 h-auto p-0 gap-6">
              <TabsTrigger 
                value="listings" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-400 rounded-none px-0 pb-3 text-slate-400"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Listings
                <Badge variant="secondary" className="ml-2 bg-slate-700 text-slate-300">
                  {liveCount + inactiveCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="offers" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-purple-400 rounded-none px-0 pb-3 text-slate-400"
              >
                <Tag className="w-4 h-4 mr-2" />
                Offers
                {productOffers.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-purple-500/20 text-purple-400">
                    {productOffers.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Listings Tab */}
          <TabsContent value="listings" className="flex-1 flex flex-col mt-0 min-h-0 data-[state=inactive]:hidden">
            {/* Table Container */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
              <div>
                {/* Table Header */}
                <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
                  <div className="grid grid-cols-[200px_60px_80px_80px_60px_90px_70px_60px_70px_100px] gap-2 px-4 pr-6 py-3">
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide cursor-help">Marketplace</div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="z-50">Platform where product is listed</TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center cursor-help">Sold</div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="z-50">Total units sold on this marketplace</TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center cursor-help">Revenue</div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="z-50">Total revenue from this marketplace</TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center cursor-help">MSRP</div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="z-50">Manufacturer's Suggested Retail Price (editable)</TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center cursor-help">Discount</div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="z-50">Discount percentage from MSRP (editable)</TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center cursor-help">Sale Price</div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="z-50">Current selling price (editable)</TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center cursor-help">Price Sync</div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="z-50">Auto-sync price changes across marketplaces</TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center cursor-help">Stock</div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="z-50">Current stock level (editable)</TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center cursor-help">Inv Sync</div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="z-50">Auto-sync inventory across marketplaces</TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center cursor-help">Actions</div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="z-50">Unlink or remove from marketplace</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Marketplace Rows */}
          <div className="divide-y divide-slate-700/50">
            {marketplaces.map((mp) => (
              <div
                key={mp.platform}
                className={cn(
                  "grid grid-cols-[200px_60px_80px_80px_60px_90px_70px_60px_70px_100px] gap-2 px-4 pr-6 py-3 items-center hover:bg-slate-800/50 transition-colors",
                  mp.status === 'not_listed' && "opacity-60"
                )}
              >
                {/* Marketplace */}
                <div className="flex items-center gap-3">
                  {canPublish(mp.status) && (
                    <Checkbox
                      checked={selectedForPublish.includes(mp.platform)}
                      onCheckedChange={() => handleToggleSelect(mp.platform)}
                      className="border-slate-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    />
                  )}
                  <MarketplaceLogo platform={mp.platform} size="md" />
                  {getStatusBadge(mp.status)}
                </div>

                {mp.status === 'not_listed' ? (
                  <>
                    <div className="text-center text-slate-600">—</div>
                    <div className="text-center text-slate-600">—</div>
                    <div className="text-center text-slate-600">—</div>
                    <div className="text-center text-slate-600">—</div>
                    <div className="text-center text-slate-600">—</div>
                    <div className="text-center text-slate-600">—</div>
                    <div className="text-center text-slate-600">—</div>
                    <div className="text-center text-slate-600">—</div>
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1.5 text-xs bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700"
                        onClick={() => handleDirectPublish(mp.platform)}
                        disabled={isPublishing}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Publish
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Sold */}
                    <div className="text-center">
                      <span className="text-lg font-bold text-white">{mp.soldQty}</span>
                      <p className="text-[10px] text-slate-500">units</p>
                    </div>
                    
                    {/* Revenue */}
                    <div className="text-center">
                      <span className="text-sm font-semibold text-emerald-400">{formatCurrency(mp.revenue)}</span>
                    </div>
                    
                    {/* MSRP - Editable */}
                    <div className="text-center">
                      <div className="relative inline-flex items-center">
                        <span className="absolute left-2 text-slate-400 text-sm">$</span>
                        <Input
                          type="number"
                          defaultValue={mp.msrpPrice}
                          className="w-20 h-8 text-center pl-5 bg-slate-800 border-slate-600 text-white font-semibold"
                        />
                      </div>
                    </div>
                    
                    {/* Discount - Editable */}
                    <div className="text-center">
                      <div className="relative inline-flex items-center">
                        <Input
                          type="number"
                          defaultValue={Math.round((1 - mp.currentSalePrice / mp.msrpPrice) * 100) || 0}
                          className="w-14 h-8 text-center bg-slate-800 border-amber-500/50 text-amber-400 font-semibold"
                        />
                        <span className="absolute right-2 text-amber-400 text-sm">%</span>
                      </div>
                    </div>
                    
                    {/* Sale Price - Editable */}
                    <div className="text-center">
                      <div className="relative inline-flex items-center">
                        <span className="absolute left-2 text-slate-400 text-sm">$</span>
                        <Input
                          type="number"
                          value={mp.currentSalePrice}
                          onChange={(e) => handleSalePriceChange(mp.platform, e.target.value)}
                          className="w-20 h-8 text-center pl-5 bg-slate-800 border-emerald-500/50 text-white font-semibold"
                        />
                      </div>
                    </div>
                    
                    {/* Price Sync */}
                    <div className="flex justify-center">
                      <Switch 
                        checked={mp.priceAutoSync}
                        onCheckedChange={() => handleTogglePriceSync(mp.platform)}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                    
                    {/* Stock - Editable */}
                    <div className="text-center">
                      <Input
                        type="number"
                        value={mp.currentStock}
                        onChange={(e) => handleStockChange(mp.platform, e.target.value)}
                        className="w-14 h-8 text-center bg-slate-800 border-slate-600 text-white font-semibold mx-auto"
                      />
                    </div>
                    
                    {/* Inventory Sync */}
                    <div className="flex justify-center">
                      <Switch 
                        checked={mp.inventoryAutoSync}
                        onCheckedChange={() => handleToggleInventorySync(mp.platform)}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center justify-center gap-1">
                      {(mp.status === 'inactive' || mp.status === 'error') && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-slate-700"
                          onClick={() => handleDirectPublish(mp.platform)}
                          disabled={isPublishing}
                        >
                          <Upload className="w-3.5 h-3.5 mr-1" />
                          Publish
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-amber-400 hover:bg-slate-700"
                      >
                        <Link2Off className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-slate-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
              </div>
            </div>

            {/* Publish Products - Fixed at bottom */}
            <div className="px-6 py-4 bg-slate-800 border-t border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">Publish / Re-publish Products</h4>
            {selectedForPublish.length > 0 && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                {selectedForPublish.length} selected
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              onClick={() => handleBulkPublish('manual')}
              disabled={selectedForPublish.length === 0 || isPublishing}
            >
              <Upload className="w-4 h-4" />
              Publish {selectedForPublish.length > 0 && `(${selectedForPublish.length})`}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              onClick={() => handleBulkPublish('upc')}
              disabled={selectedForPublish.length === 0 || isPublishing}
            >
              <Barcode className="w-4 h-4" />
              UPC {selectedForPublish.length > 0 && `(${selectedForPublish.length})`}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              onClick={() => handleBulkPublish('ai')}
              disabled={selectedForPublish.length === 0 || isPublishing}
            >
              <Sparkles className="w-4 h-4" />
              AI Publish {selectedForPublish.length > 0 && `(${selectedForPublish.length})`}
            </Button>
            </div>
          </div>
          </TabsContent>

          {/* Offers Tab */}
          <TabsContent value="offers" className="flex-1 flex flex-col mt-0 min-h-0 data-[state=inactive]:hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                {productOffers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                    <div className="p-4 rounded-full bg-slate-800 mb-4">
                      <Tag className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No active offers</h3>
                    <p className="text-slate-400 text-sm max-w-md mb-4">
                      Create promotions like discounts, free shipping, or BOGO deals to boost sales on your marketplaces.
                    </p>
                    <Button 
                      className="gap-2 bg-purple-600 hover:bg-purple-700"
                      onClick={() => setShowCreateOfferDialog(true)}
                    >
                      <Plus className="w-4 h-4" />
                      Create Offer
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {productOffers.map((offer) => {
                      const status = getOfferStatus(offer);
                      const statusConfig = offerStatusConfig[status];
                      const daysRemaining = getOfferDaysRemaining(offer);
                      
                      return (
                        <div 
                          key={offer.id}
                          className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-white">{offer.name}</h4>
                                <Badge className={cn("text-xs", statusConfig.bgColor, statusConfig.color)}>
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5 text-slate-400">
                                  {offer.type === 'free_shipping' && <Truck className="w-3.5 h-3.5" />}
                                  {(offer.type === 'percent_discount' || offer.type === 'quantity_discount' || offer.type === 'bulk_purchase') && <Percent className="w-3.5 h-3.5" />}
                                  {(offer.type === 'bogo_half' || offer.type === 'bogo_free') && <Gift className="w-3.5 h-3.5" />}
                                  {offer.type === 'fixed_discount' && <DollarSign className="w-3.5 h-3.5" />}
                                  <span>{offerTypeLabels[offer.type]}</span>
                                </div>
                                
                                <span className="text-emerald-400 font-medium">
                                  {formatOfferDiscount(offer)}
                                </span>
                                
                                <div className="flex items-center gap-1.5 text-slate-500">
                                  <Clock className="w-3.5 h-3.5" />
                                  {status === 'active' || status === 'ending_soon' ? (
                                    <span>{daysRemaining} days left</span>
                                  ) : status === 'scheduled' ? (
                                    <span>Starts {format(new Date(offer.startDate), 'MMM d')}</span>
                                  ) : (
                                    <span>Expired</span>
                                  )}
                                </div>
                              </div>
                              
                              {offer.marketplaces.length > 0 && (
                                <div className="flex items-center gap-2 mt-3">
                                  <span className="text-xs text-slate-500">Active on:</span>
                                  <div className="flex items-center gap-1">
                                    {offer.marketplaces.slice(0, 5).map((mp) => (
                                      <MarketplaceLogo key={mp} platform={mp} size="xs" />
                                    ))}
                                    {offer.marketplaces.length > 5 && (
                                      <span className="text-xs text-slate-500">+{offer.marketplaces.length - 5}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-slate-400 hover:text-white hover:bg-slate-700"
                                onClick={() => setEditingOffer(offer)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-slate-700"
                                onClick={() => {
                                  deleteOffer(offer.id);
                                  toast.success('Offer deleted');
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    <Button 
                      variant="outline" 
                      className="w-full gap-2 border-dashed border-slate-600 text-slate-400 hover:text-white hover:bg-slate-800"
                      onClick={() => setShowCreateOfferDialog(true)}
                    >
                      <Plus className="w-4 h-4" />
                      Add Another Offer
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-700 flex justify-end gap-3 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700">
            Cancel
          </Button>
          <Button 
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={handleSaveChanges}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>

      {/* Marketplace Selection Dialog for Syncing Changes */}
      <MarketplaceSelectionDialog
        open={showSyncDialog}
        onOpenChange={setShowSyncDialog}
        title="Update Live Marketplaces"
        description="You have unsaved changes. Select which live marketplaces to update with these changes."
        marketplaces={marketplaces
          .filter(m => m.status === 'live')
          .map(m => ({ platform: m.platform, label: m.platform, status: m.status }))
        }
        onConfirm={handleSyncConfirm}
        confirmLabel="Update"
        isLoading={isSyncing}
        mode="sync"
      />

      {/* Edit Offer Dialog */}
      {editingOffer && (
      <EditOfferDialog
          open={!!editingOffer}
          onOpenChange={(open) => !open && setEditingOffer(null)}
          onUpdateOffer={(offerId, updates) => {
            updateOffer(offerId, updates);
            toast.success('Offer updated successfully');
            setEditingOffer(null);
          }}
          offer={editingOffer}
          products={[product]}
        />
      )}

      {/* Create Offer Dialog */}
      <CreateOfferDialog
        open={showCreateOfferDialog}
        onOpenChange={setShowCreateOfferDialog}
        onCreateOffer={(offerData) => {
          addOffer({
            ...offerData,
            productIds: [product.id],
          });
          toast.success('Offer created successfully');
          setShowCreateOfferDialog(false);
        }}
        products={[product]}
        preselectedProductIds={[product.id]}
        hideProductSelection={true}
      />
    </Dialog>
  );
}
