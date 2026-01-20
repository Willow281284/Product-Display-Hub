import { useState } from 'react';
import { format } from 'date-fns';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tag,
  Percent,
  DollarSign,
  Truck,
  ShoppingCart,
  Package,
  Gift,
  CalendarIcon,
  Store,
  Box,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Offer, OfferType, OfferScope, offerTypeLabels } from '@/types/offer';
import { Product } from '@/types/product';
import { MarketplaceLogo } from './MarketplaceLogo';

interface CreateOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateOffer: (offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  products: Product[];
  preselectedProductIds?: string[];
  preselectedMarketplace?: string;
  hideProductSelection?: boolean; // Hide product picker when opened from product context
}

const allMarketplaces = [
  'amazon', 'walmart', 'ebay', 'newegg', 'bestbuy', 'target',
  'etsy', 'shopify', 'temu', 'macys', 'costco', 'homedepot',
  'lowes', 'wayfair', 'overstock'
];

const offerTypeIcons: Record<OfferType, React.ReactNode> = {
  free_shipping: <Truck className="w-4 h-4" />,
  percent_discount: <Percent className="w-4 h-4" />,
  fixed_discount: <DollarSign className="w-4 h-4" />,
  quantity_discount: <ShoppingCart className="w-4 h-4" />,
  bulk_purchase: <Package className="w-4 h-4" />,
  bogo_half: <Gift className="w-4 h-4" />,
  bogo_free: <Gift className="w-4 h-4" />,
};

export function CreateOfferDialog({
  open,
  onOpenChange,
  onCreateOffer,
  products,
  preselectedProductIds = [],
  preselectedMarketplace,
  hideProductSelection = false,
}: CreateOfferDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [offerType, setOfferType] = useState<OfferType>('percent_discount');
  const [scope, setScope] = useState<OfferScope>('product');
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [discountAmount, setDiscountAmount] = useState<number>(5);
  const [minQty, setMinQty] = useState<number>(2);
  const [buyQty, setBuyQty] = useState<number>(1);
  const [getQty, setGetQty] = useState<number>(1);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [selectedProducts, setSelectedProducts] = useState<string[]>(preselectedProductIds);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>(
    preselectedMarketplace ? [preselectedMarketplace] : []
  );
  const [productSearch, setProductSearch] = useState('');

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.vendorSku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSubmit = () => {
    const offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'> = {
      name,
      description,
      type: offerType,
      scope,
      discountPercent: ['percent_discount', 'quantity_discount', 'bulk_purchase'].includes(offerType) ? discountPercent : undefined,
      discountAmount: offerType === 'fixed_discount' ? discountAmount : undefined,
      condition: ['quantity_discount', 'bulk_purchase'].includes(offerType)
        ? { minQty }
        : ['bogo_half', 'bogo_free'].includes(offerType)
        ? { buyQty, getQty }
        : undefined,
      startDate,
      endDate,
      productIds: selectedProducts,
      marketplaces: selectedMarketplaces,
      isActive: true,
    };
    onCreateOffer(offer);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setOfferType('percent_discount');
    setScope('product');
    setDiscountPercent(10);
    setDiscountAmount(5);
    setMinQty(2);
    setBuyQty(1);
    setGetQty(1);
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setSelectedProducts([]);
    setSelectedMarketplaces([]);
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleMarketplace = (marketplace: string) => {
    setSelectedMarketplaces(prev =>
      prev.includes(marketplace)
        ? prev.filter(m => m !== marketplace)
        : [...prev, marketplace]
    );
  };

  const isValid = name.trim() && selectedProducts.length > 0 && startDate < endDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Create New Offer
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 min-h-0">
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Offer Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Summer Sale 20% Off"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Offer Scope</Label>
                  <Select value={scope} onValueChange={(v) => setScope(v as OfferScope)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">
                        <div className="flex items-center gap-2">
                          <Box className="w-4 h-4" />
                          By Product
                        </div>
                      </SelectItem>
                      <SelectItem value="marketplace">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4" />
                          By Marketplace
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the offer..."
                  rows={2}
                />
              </div>
            </div>

            {/* Offer Type */}
            <div className="space-y-3">
              <Label>Offer Type *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(offerTypeLabels) as OfferType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setOfferType(type)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                      offerType === type
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-full",
                      offerType === type ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      {offerTypeIcons[type]}
                    </div>
                    <span className="text-xs text-center font-medium">{offerTypeLabels[type]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Discount Configuration */}
            {offerType !== 'free_shipping' && (
              <div className="space-y-3 p-4 rounded-lg bg-muted/50 border">
                <Label className="text-sm font-semibold">Discount Configuration</Label>
                
                {['percent_discount', 'quantity_discount', 'bulk_purchase'].includes(offerType) && (
                  <div className="flex items-center gap-3">
                    <Label className="w-32">Discount %</Label>
                    <Input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="w-24"
                      min={1}
                      max={100}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                )}

                {offerType === 'fixed_discount' && (
                  <div className="flex items-center gap-3">
                    <Label className="w-32">Discount Amount</Label>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Number(e.target.value))}
                        className="w-24"
                        min={0.01}
                        step={0.01}
                      />
                    </div>
                  </div>
                )}

                {['quantity_discount', 'bulk_purchase'].includes(offerType) && (
                  <div className="flex items-center gap-3">
                    <Label className="w-32">Minimum Qty</Label>
                    <Input
                      type="number"
                      value={minQty}
                      onChange={(e) => setMinQty(Number(e.target.value))}
                      className="w-24"
                      min={2}
                    />
                    <span className="text-muted-foreground">units</span>
                  </div>
                )}

                {['bogo_half', 'bogo_free'].includes(offerType) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Label className="w-32">Buy Qty</Label>
                      <Input
                        type="number"
                        value={buyQty}
                        onChange={(e) => setBuyQty(Number(e.target.value))}
                        className="w-24"
                        min={1}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="w-32">Get Qty</Label>
                      <Input
                        type="number"
                        value={getQty}
                        onChange={(e) => setGetQty(Number(e.target.value))}
                        className="w-24"
                        min={1}
                      />
                      <span className="text-muted-foreground">
                        {offerType === 'bogo_half' ? '@ 50% off' : 'free'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Date Range */}
            <div className="space-y-3">
              <Label>Offer Period *</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(startDate, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(endDate, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Product Selection - only show when not in product context */}
            {!hideProductSelection && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Select Products *</Label>
                  <Badge variant="secondary">{selectedProducts.length} selected</Badge>
                </div>
                <Input
                  placeholder="Search products by name or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                <ScrollArea className="h-48 border rounded-lg">
                  <div className="p-2 space-y-1">
                    {filteredProducts.slice(0, 50).map((product) => (
                      <div
                        key={product.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                          selectedProducts.includes(product.id)
                            ? "bg-primary/10"
                            : "hover:bg-muted"
                        )}
                        onClick={() => toggleProduct(product.id)}
                      >
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleProduct(product.id)}
                        />
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.vendorSku}</p>
                        </div>
                        <span className="text-sm font-medium">${product.salePrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Show selected product count when hidden */}
            {hideProductSelection && selectedProducts.length > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm">
                  <span className="font-medium">{selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''}</span>
                  <span className="text-muted-foreground"> will receive this offer</span>
                </p>
              </div>
            )}

            {/* Marketplace Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Marketplaces (optional)</Label>
                <span className="text-xs text-muted-foreground">
                  {selectedMarketplaces.length === 0 ? 'All marketplaces' : `${selectedMarketplaces.length} selected`}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {allMarketplaces.map((mp) => (
                  <button
                    key={mp}
                    type="button"
                    onClick={() => toggleMarketplace(mp)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                      selectedMarketplaces.includes(mp)
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:bg-muted"
                    )}
                  >
                    <MarketplaceLogo platform={mp} size="sm" />
                    <span className="text-[10px] text-muted-foreground capitalize">{mp}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Create Offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
