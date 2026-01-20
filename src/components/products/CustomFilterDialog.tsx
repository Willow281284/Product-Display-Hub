import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { X, Plus, Filter, Trash2, Sparkles, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CustomFilter,
  FilterCriteria,
  FilterField,
  FilterOperator,
  fieldLabels,
  operatorLabels,
  getOperatorsForField,
  needsValueInput,
  needsRangeInput,
} from '@/types/customFilter';

interface CustomFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter?: CustomFilter | null;
  onSave: (filter: CustomFilter) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const defaultCriteria = (): FilterCriteria => ({
  id: generateId(),
  field: 'name',
  operator: 'contains',
  value: '',
});

// Group fields by category for better organization
const fieldCategories = {
  'Basic Info': ['name', 'brand', 'vendorName', 'vendorSku', 'productId'],
  'Identifiers': ['asin', 'fnsku', 'gtin', 'ean', 'isbn', 'manufacturerPart'],
  'Pricing': ['salePrice', 'landedCost', 'shippingCost'],
  'Inventory': ['stockQty', 'soldQty', 'soldQtyLastMonth', 'soldQtyLastQuarter', 'soldQtyLastYear', 'purchaseQty', 'returnQty'],
  'Profitability': ['grossProfitPercent', 'grossProfitAmount'],
  'Forecasting': ['velocity', 'stockDays', 'restockStatus', 'suggestedRestockQty'],
  'Offers': ['hasOffer', 'offerStatus', 'offerType'],
};

// Sold quantity fields for time period selection
const soldQtyFields: FilterField[] = ['soldQty', 'soldQtyLastMonth', 'soldQtyLastQuarter', 'soldQtyLastYear'];

const soldQtyTimePeriodLabels: Record<string, string> = {
  'soldQty': 'All Time',
  'soldQtyLastMonth': 'Last Month',
  'soldQtyLastQuarter': 'Last Quarter',
  'soldQtyLastYear': 'Last Year',
};

const marketplaceFields = [
  'marketplace_amazon', 'marketplace_walmart', 'marketplace_ebay', 'marketplace_newegg',
  'marketplace_bestbuy', 'marketplace_target', 'marketplace_etsy', 'marketplace_shopify',
  'marketplace_temu', 'marketplace_macys', 'marketplace_costco', 'marketplace_homedepot',
  'marketplace_lowes', 'marketplace_wayfair', 'marketplace_overstock',
];

export function CustomFilterDialog({
  open,
  onOpenChange,
  filter,
  onSave,
}: CustomFilterDialogProps) {
  const [name, setName] = useState(filter?.name || '');
  const [description, setDescription] = useState(filter?.description || '');
  const [criteria, setCriteria] = useState<FilterCriteria[]>(
    filter?.criteria || [defaultCriteria()]
  );

  const handleFieldChange = (criteriaId: string, field: FilterField) => {
    setCriteria((prev) =>
      prev.map((c) =>
        c.id === criteriaId
          ? {
              ...c,
              field,
              operator: getOperatorsForField(field)[0],
              value: '',
            }
          : c
      )
    );
  };

  const handleOperatorChange = (criteriaId: string, operator: FilterOperator) => {
    setCriteria((prev) =>
      prev.map((c) =>
        c.id === criteriaId ? { ...c, operator, value: needsValueInput(operator) ? c.value : '' } : c
      )
    );
  };

  const handleValueChange = (criteriaId: string, value: string) => {
    setCriteria((prev) =>
      prev.map((c) => (c.id === criteriaId ? { ...c, value } : c))
    );
  };

  const addCriteria = () => {
    setCriteria((prev) => [...prev, defaultCriteria()]);
  };

  const removeCriteria = (criteriaId: string) => {
    if (criteria.length > 1) {
      setCriteria((prev) => prev.filter((c) => c.id !== criteriaId));
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: filter?.id || generateId(),
      name: name.trim(),
      description: description.trim(),
      criteria,
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    setName(filter?.name || '');
    setDescription(filter?.description || '');
    setCriteria(filter?.criteria || [defaultCriteria()]);
    onOpenChange(false);
  };

  // Reset state when dialog opens with different filter
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setName(filter?.name || '');
      setDescription(filter?.description || '');
      setCriteria(filter?.criteria || [defaultCriteria()]);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[95vh] sm:max-h-[90vh] p-0 overflow-hidden bg-background gap-0">
        {/* Header - Responsive */}
        <DialogHeader className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-white/10 shrink-0">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-xl font-bold text-white truncate">
                {filter ? 'Edit Custom Filter' : 'Create Custom Filter'}
              </DialogTitle>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5 hidden sm:block">
                Build advanced filters to find specific products
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-180px)]">
          <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
            {/* Filter Details Section */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide">
                  Filter Details
                </h3>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="w-3.5 h-3.5" />
                  <span>Give your filter a name</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="filter-name" className="text-xs sm:text-sm font-medium">
                    Filter Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="filter-name"
                    placeholder="e.g., Low Stock, Amazon Errors"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="filter-desc" className="text-xs sm:text-sm font-medium">
                    Description <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="filter-desc"
                    placeholder="What does this filter find?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Criteria Section */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide">
                    Filter Rules
                  </h3>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs h-5">
                    {criteria.length} {criteria.length === 1 ? 'rule' : 'rules'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full w-fit">
                  <Sparkles className="w-3 h-3" />
                  <span>Matches <strong className="text-foreground">ALL</strong> rules</span>
                </div>
              </div>

              <div className="space-y-4">
                {criteria.map((c, index) => {
                  const operators = getOperatorsForField(c.field);
                  const showValueInput = needsValueInput(c.operator);
                  const isMarketplaceField = c.field.startsWith('marketplace_');
                  const isSoldQtyField = soldQtyFields.includes(c.field);
                  const isRestockStatusField = c.field === 'restockStatus';
                  const isOfferField = c.field === 'hasOffer' || c.field === 'offerStatus' || c.field === 'offerType';

                  return (
                    <div
                      key={c.id}
                      className="relative bg-muted/30 border border-border rounded-lg p-3 sm:p-4 hover:border-primary/30 transition-colors"
                    >
                      {/* Rule number badge & delete button row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded">
                          Rule {index + 1}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCriteria(c.id)}
                          disabled={criteria.length === 1}
                          className={cn(
                            "h-7 px-2 text-xs gap-1",
                            criteria.length > 1 
                              ? "text-destructive hover:text-destructive hover:bg-destructive/10" 
                              : "text-muted-foreground opacity-50"
                          )}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Remove</span>
                        </Button>
                      </div>

                      {/* Fields - Stack on mobile, row on desktop */}
                      <div className={cn(
                        "grid gap-3",
                        isSoldQtyField ? "sm:grid-cols-4" : "sm:grid-cols-3"
                      )}>
                        {/* Field Select */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] sm:text-xs text-muted-foreground">Field</Label>
                          <Select
                            value={isSoldQtyField ? 'soldQty' : c.field}
                            onValueChange={(v) => handleFieldChange(c.id, v as FilterField)}
                          >
                            <SelectTrigger className="h-9 sm:h-10 bg-background text-sm">
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[280px] z-[100]">
                              {Object.entries(fieldCategories).map(([category, fields]) => (
                                <SelectGroup key={category}>
                                  <SelectLabel className="text-[10px] sm:text-xs font-semibold text-primary">
                                    {category}
                                  </SelectLabel>
                                  {fields
                                    .filter(field => !soldQtyFields.slice(1).includes(field as FilterField))
                                    .map((field) => (
                                      <SelectItem key={field} value={field} className="text-sm">
                                        {field === 'soldQty' ? 'Sold Qty' : fieldLabels[field as FilterField]}
                                      </SelectItem>
                                    ))}
                                </SelectGroup>
                              ))}
                              <SelectGroup>
                                <SelectLabel className="text-[10px] sm:text-xs font-semibold text-primary">
                                  Marketplace Status
                                </SelectLabel>
                                {marketplaceFields.map((field) => (
                                  <SelectItem key={field} value={field} className="text-sm">
                                    {fieldLabels[field as FilterField]}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Time Period Select - Only for Sold Qty fields */}
                        {isSoldQtyField && (
                          <div className="space-y-1.5">
                            <Label className="text-[10px] sm:text-xs text-muted-foreground">Time Period</Label>
                            <Select
                              value={c.field}
                              onValueChange={(v) => handleFieldChange(c.id, v as FilterField)}
                            >
                              <SelectTrigger className="h-9 sm:h-10 bg-background text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[100]">
                                {soldQtyFields.map((field) => (
                                  <SelectItem key={field} value={field} className="text-sm">
                                    {soldQtyTimePeriodLabels[field]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Operator Select */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] sm:text-xs text-muted-foreground">Condition</Label>
                          <Select
                            value={c.operator}
                            onValueChange={(v) => handleOperatorChange(c.id, v as FilterOperator)}
                          >
                            <SelectTrigger className="h-9 sm:h-10 bg-background text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[100]">
                              {operators.map((op) => (
                                <SelectItem key={op} value={op} className="text-sm">
                                  {operatorLabels[op]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Value Input - Single or Range */}
                        {showValueInput && !needsRangeInput(c.operator) && (
                          <div className="space-y-1.5">
                            <Label className="text-[10px] sm:text-xs text-muted-foreground">Value</Label>
                            {isMarketplaceField ? (
                              <Select
                                value={c.value}
                                onValueChange={(v) => handleValueChange(c.id, v)}
                              >
                                <SelectTrigger className="h-9 sm:h-10 bg-background text-sm">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent className="z-[100]">
                                  <SelectItem value="live" className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                      Live
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="inactive" className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-muted-foreground shrink-0" />
                                      Inactive
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="error" className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                                      Error
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="not_listed" className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                      Not Listed
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : isRestockStatusField ? (
                              <Select
                                value={c.value}
                                onValueChange={(v) => handleValueChange(c.id, v)}
                              >
                                <SelectTrigger className="h-9 sm:h-10 bg-background text-sm">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent className="z-[100]">
                                  <SelectItem value="in_stock" className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                      In Stock
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="low_stock" className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                      Low Stock
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="out_of_stock" className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                                      Out of Stock
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="reorder_now" className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                      Reorder Now
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : c.field === 'hasOffer' ? (
                              <Select
                                value={c.value}
                                onValueChange={(v) => handleValueChange(c.id, v)}
                              >
                                <SelectTrigger className="h-9 sm:h-10 bg-background text-sm">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="z-[100]">
                                  <SelectItem value="true" className="text-sm">Yes - Has Offer</SelectItem>
                                  <SelectItem value="false" className="text-sm">No - No Offer</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : c.field === 'offerStatus' ? (
                              <Select
                                value={c.value}
                                onValueChange={(v) => handleValueChange(c.id, v)}
                              >
                                <SelectTrigger className="h-9 sm:h-10 bg-background text-sm">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent className="z-[100]">
                                  <SelectItem value="active" className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                      Active
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="ending_soon" className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                      Ending Soon
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="just_created" className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                                      Just Created
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="scheduled" className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                      Scheduled
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : c.field === 'offerType' ? (
                              <Select
                                value={c.value}
                                onValueChange={(v) => handleValueChange(c.id, v)}
                              >
                                <SelectTrigger className="h-9 sm:h-10 bg-background text-sm">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="z-[100]">
                                  <SelectItem value="free_shipping" className="text-sm">Free Shipping</SelectItem>
                                  <SelectItem value="percent_discount" className="text-sm">% Discount</SelectItem>
                                  <SelectItem value="fixed_discount" className="text-sm">$ Discount</SelectItem>
                                  <SelectItem value="quantity_discount" className="text-sm">Quantity Discount</SelectItem>
                                  <SelectItem value="bulk_purchase" className="text-sm">Bulk Purchase</SelectItem>
                                  <SelectItem value="bogo_half" className="text-sm">BOGO 50% Off</SelectItem>
                                  <SelectItem value="bogo_free" className="text-sm">BOGO Free</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                placeholder="Enter value..."
                                value={c.value}
                                onChange={(e) => handleValueChange(c.id, e.target.value)}
                                className="h-9 sm:h-10 bg-background text-sm"
                              />
                            )}
                          </div>
                        )}

                        {/* Range Input (From/To) for "between" operator */}
                        {needsRangeInput(c.operator) && (
                          <div className="space-y-1.5 sm:col-span-1">
                            <Label className="text-[10px] sm:text-xs text-muted-foreground">Range (From - To)</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="From"
                                value={c.value.split(',')[0] || ''}
                                onChange={(e) => {
                                  const toVal = c.value.split(',')[1] || '';
                                  handleValueChange(c.id, `${e.target.value},${toVal}`);
                                }}
                                className="h-9 sm:h-10 bg-background text-sm flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-muted-foreground text-sm">–</span>
                              <Input
                                type="number"
                                placeholder="To"
                                value={c.value.split(',')[1] || ''}
                                onChange={(e) => {
                                  const fromVal = c.value.split(',')[0] || '';
                                  handleValueChange(c.id, `${fromVal},${e.target.value}`);
                                }}
                                className="h-9 sm:h-10 bg-background text-sm flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>
                          </div>
                        )}

                        {/* Placeholder for alignment when no value input */}
                        {!showValueInput && (
                          <div className="hidden sm:block" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Criteria Button */}
              <Button
                variant="outline"
                onClick={addCriteria}
                className="w-full h-10 sm:h-11 gap-2 border-dashed border-2 hover:border-primary hover:bg-primary/5 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Another Rule
              </Button>
            </div>
          </div>
        </ScrollArea>

        {/* Footer - Responsive */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-muted/30">
          <p className="text-[10px] sm:text-xs text-muted-foreground text-center sm:text-left">
            Saved locally in your browser
          </p>
          <div className="flex gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              onClick={handleCancel} 
              className="flex-1 sm:flex-none sm:min-w-[100px] h-9 sm:h-10 text-sm"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!name.trim()}
              className="flex-1 sm:flex-none sm:min-w-[120px] h-9 sm:h-10 bg-blue-600 hover:bg-blue-700 text-sm"
            >
              Save Filter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}