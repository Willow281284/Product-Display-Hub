import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Plus, Trash2, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'used_like_new', label: 'Used - Like New' },
  { value: 'used_very_good', label: 'Used - Very Good' },
  { value: 'used_good', label: 'Used - Good' },
  { value: 'used_acceptable', label: 'Used - Acceptable' },
  { value: 'refurbished', label: 'Refurbished' },
  { value: 'renewed', label: 'Renewed' },
];

interface QuantityDiscount {
  units: string;
  pricePerUnit: string;
}

interface InventoryPricingSectionProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  errors?: Record<string, boolean>;
}

export function InventoryPricingSection({ values, onChange, errors = {} }: InventoryPricingSectionProps) {
  const [standardOpen, setStandardOpen] = useState(true);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('fixed');
  
  // Parse quantity discounts from stored JSON
  const parseDiscounts = (): QuantityDiscount[] => {
    try {
      const stored = values['quantity_discounts'];
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error parsing quantity discounts:', e);
    }
    return [];
  };
  
  const discounts = parseDiscounts();
  
  const updateDiscounts = (newDiscounts: QuantityDiscount[]) => {
    onChange('quantity_discounts', JSON.stringify(newDiscounts));
  };
  
  const addDiscount = () => {
    updateDiscounts([...discounts, { units: '', pricePerUnit: '' }]);
  };
  
  const removeDiscount = (index: number) => {
    updateDiscounts(discounts.filter((_, i) => i !== index));
  };
  
  const updateDiscount = (index: number, field: keyof QuantityDiscount, value: string) => {
    const newDiscounts = [...discounts];
    newDiscounts[index] = { ...newDiscounts[index], [field]: value };
    updateDiscounts(newDiscounts);
  };

  // Reference prices (would come from marketplace API in real implementation)
  const referenceData = {
    featuredOffer: values['featured_offer_price'] || null,
    lowestPrice: values['lowest_price'] || null,
    competitivePrice: values['competitive_price'] || null,
    minSimilar: values['min_similar_price'] || null,
    medianSimilar: values['median_similar_price'] || null,
  };

  // Get inventory values
  const stock = parseInt(values['quantity'] || values['available_stock'] || '0') || 0;
  const shippingCost = values['shipping_cost'] || '';

  return (
    <div className="space-y-6">
      {/* Inventory Section */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Inventory
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Stock */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-40 shrink-0">
              <Label className="text-sm text-muted-foreground">
                Stock
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs bg-popover border z-50">
                    <p className="text-xs">Available quantity for sale</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="number"
              min="0"
              value={values['quantity'] || values['available_stock'] || ''}
              onChange={(e) => onChange('quantity', e.target.value)}
              className={cn(
                "max-w-48 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                errors['quantity'] && "border-destructive"
              )}
              placeholder="0"
            />
          </div>

          {/* Shipping Cost */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-40 shrink-0">
              <Label className="text-sm text-muted-foreground">
                Shipping ($)
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs bg-popover border z-50">
                    <p className="text-xs">Shipping cost for this product</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={values['shipping_cost'] || ''}
              onChange={(e) => onChange('shipping_cost', e.target.value)}
              className={cn(
                "max-w-48 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                errors['shipping_cost'] && "border-destructive"
              )}
              placeholder="0.00"
            />
          </div>

          {/* Condition */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-40 shrink-0">
              <Label className="text-sm text-muted-foreground">
                Condition
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs bg-popover border z-50">
                    <p className="text-xs">Product condition for marketplace compliance</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={values['condition'] || 'new'}
              onValueChange={(value) => onChange('condition', value)}
            >
              <SelectTrigger className={cn(
                "max-w-48",
                errors['condition'] && "border-destructive"
              )}>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent className="bg-popover border z-50">
                {CONDITION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Standard Price Section */}
      <Collapsible open={standardOpen} onOpenChange={setStandardOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 w-full text-left py-2 font-semibold text-base hover:text-primary transition-colors">
            {standardOpen ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
            Standard price
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          {/* Price Fields */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground shrink-0">
                Price ($)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={values['price'] || ''}
                onChange={(e) => onChange('price', e.target.value)}
                className={cn(
                  "max-w-48 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                  errors['price'] && "border-destructive"
                )}
                placeholder="0.00"
              />
            </div>

            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground shrink-0">
                MSRP ($)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={values['msrp'] || ''}
                onChange={(e) => onChange('msrp', e.target.value)}
                className={cn(
                  "max-w-48 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                  errors['msrp'] && "border-destructive"
                )}
                placeholder="0.00"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground shrink-0">
                Minimum price ($)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={values['min_price'] || ''}
                onChange={(e) => onChange('min_price', e.target.value)}
                className="max-w-48 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground shrink-0">
                Maximum price ($)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={values['max_price'] || ''}
                onChange={(e) => onChange('max_price', e.target.value)}
                className="max-w-48 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
              />
            </div>
          </div>
          
          {/* Pricing Health Link */}
          <button className="text-sm text-primary hover:underline font-medium">
            Pricing health
          </button>
          
          {/* Reference Prices Section */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">Reference prices</h4>
              <button className="text-sm text-primary hover:underline">
                Learn more
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Featured offer</span>
                {referenceData.featuredOffer ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ${referenceData.featuredOffer} + $0.00
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
              
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Lowest price</span>
                {referenceData.lowestPrice ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ${referenceData.lowestPrice} + $0.00
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
              
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Competitive price</span>
                <span className="text-muted-foreground">
                  {referenceData.competitivePrice ? `$${referenceData.competitivePrice}` : '-'}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="text-muted-foreground">Minimum price</span>
                  <p className="text-xs text-muted-foreground/70">Similar product</p>
                </div>
                <span className="text-muted-foreground">
                  {referenceData.minSimilar ? `$${referenceData.minSimilar}` : '-'}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="text-muted-foreground">Median price</span>
                  <p className="text-xs text-muted-foreground/70">Similar product</p>
                </div>
                <span className="text-muted-foreground">
                  {referenceData.medianSimilar ? `$${referenceData.medianSimilar}` : '-'}
                </span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Business Price Section */}
      <Collapsible open={businessOpen} onOpenChange={setBusinessOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 w-full text-left py-2 font-semibold text-base hover:text-primary transition-colors border-t pt-4">
            {businessOpen ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
            Business price
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          {/* Business Price Field */}
          <div className="flex items-center gap-4">
            <Label className="w-40 text-sm text-muted-foreground shrink-0">
              Business price ($)
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={values['business_price'] || ''}
              onChange={(e) => onChange('business_price', e.target.value)}
              className="max-w-48 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0.00"
            />
          </div>
          
          {/* Quantity Discounts */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quantity discounts</Label>
            
            {/* Discount Type Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-full p-1 w-fit">
              <button
                type="button"
                onClick={() => setDiscountType('percent')}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  discountType === 'percent'
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                % off
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                type="button"
                onClick={() => setDiscountType('fixed')}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  discountType === 'fixed'
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Fixed price
              </button>
            </div>
            
            {/* Discounts Table */}
            {discounts.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-sm font-medium text-muted-foreground">
                  <span>Units</span>
                  <span>{discountType === 'percent' ? '% off' : 'Price per unit ($)'}</span>
                  <span className="w-8" />
                </div>
                
                {discounts.map((discount, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <Input
                      type="number"
                      min="1"
                      value={discount.units}
                      onChange={(e) => updateDiscount(idx, 'units', e.target.value)}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={discount.pricePerUnit}
                      onChange={(e) => updateDiscount(idx, 'pricePerUnit', e.target.value)}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0.00"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDiscount(idx)}
                      className="h-9 w-9 text-primary hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add Discount Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDiscount}
              className="gap-1.5 text-primary border-primary hover:bg-primary/10"
            >
              <Plus className="w-4 h-4" />
              Add discount
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
