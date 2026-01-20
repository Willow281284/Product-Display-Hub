import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MarketplaceLogo } from './MarketplaceLogo';
import { Product } from '@/types/product';
import { marketplacePlatforms } from '@/data/mockProducts';
import { Store, Loader2, Sparkles, Barcode, Upload, ArrowLeft, ArrowRight, Eye, Package, Pencil, Copy, Wand2 } from 'lucide-react';

type PublishMethod = 'ai' | 'upc' | 'manual';
type Step = 'configure' | 'preview';

// Key format: productId-marketplace
interface MarketplaceItemData {
  sku: string;
  stockQty: number | null;
  salePrice: number | null;
  msrp: number | null;
  shippingCost: number | null;
  condition: string;
}

const conditionOptions = ['New', 'Refurbished', 'Used - Like New', 'Used - Good', 'Used - Acceptable'];

interface BatchCreationResult {
  batchId: string;
  batchName: string;
  totalItems: number;
}

interface BulkListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Product[];
  onCreateBatch: (
    name: string,
    products: { id: string; name: string; sku?: string; stockQty?: number; salePrice?: number; profitMargin?: number; marketplace?: string }[],
    marketplaces: string[],
    publishMethod?: PublishMethod
  ) => Promise<BatchCreationResult | null>;
  onBatchCreated?: (batchId: string) => void;
}

const marketplaceLabels: Record<string, string> = {
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

const publishMethods = [
  {
    id: 'ai' as PublishMethod,
    label: 'AI Auto-Fill',
    description: 'Use AI to generate optimized titles, descriptions & attributes',
    icon: Sparkles,
  },
  {
    id: 'upc' as PublishMethod,
    label: 'UPC Match',
    description: 'Match products using UPC/barcode to existing marketplace listings',
    icon: Barcode,
  },
  {
    id: 'manual' as PublishMethod,
    label: 'Manual Publish',
    description: 'Publish with existing product data as-is',
    icon: Upload,
  },
];

export function BulkListingDialog({
  open,
  onOpenChange,
  selectedProducts,
  onCreateBatch,
}: BulkListingDialogProps) {
  const [step, setStep] = useState<Step>('configure');
  const [batchName, setBatchName] = useState('');
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<Set<string>>(new Set());
  const [publishMethod, setPublishMethod] = useState<PublishMethod>('ai');
  const [isCreating, setIsCreating] = useState(false);
  
  // Editable data per product-marketplace combination
  // Key format: "productId|marketplace"
  const [editedItems, setEditedItems] = useState<Record<string, MarketplaceItemData>>({});

  const getItemKey = (productId: string, marketplace: string) => `${productId}|${marketplace}`;

  // Initialize edited items for all product-marketplace combinations
  const initializeEditedItems = () => {
    const initial: Record<string, MarketplaceItemData> = {};
    const marketplaceArray = Array.from(selectedMarketplaces);
    
    selectedProducts.forEach((p) => {
      marketplaceArray.forEach((marketplace) => {
        const key = getItemKey(p.id, marketplace);
        initial[key] = {
          sku: p.vendorSku || '',
          stockQty: p.stockQty ?? null,
          salePrice: p.salePrice ?? null,
          msrp: null,
          shippingCost: null,
          condition: 'New',
        };
      });
    });
    setEditedItems(initial);
  };

  const updateItemField = (
    productId: string, 
    marketplace: string, 
    field: keyof MarketplaceItemData, 
    value: string | number | null
  ) => {
    const key = getItemKey(productId, marketplace);
    setEditedItems((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  // Copy values from one marketplace to all others for a product
  const copyToAllMarketplaces = (productId: string, sourceMarketplace: string) => {
    const sourceKey = getItemKey(productId, sourceMarketplace);
    const sourceData = editedItems[sourceKey];
    if (!sourceData) return;

    const marketplaceArray = Array.from(selectedMarketplaces);
    setEditedItems((prev) => {
      const updated = { ...prev };
      marketplaceArray.forEach((mp) => {
        if (mp !== sourceMarketplace) {
          const key = getItemKey(productId, mp);
          updated[key] = { ...sourceData };
        }
      });
      return updated;
    });
  };

  // Fill all items with the same value for a specific field
  const fillAllItems = (field: keyof MarketplaceItemData, value: string | number | null) => {
    setEditedItems((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        updated[key] = { ...updated[key], [field]: value };
      });
      return updated;
    });
  };

  const toggleMarketplace = (marketplace: string) => {
    const newSet = new Set(selectedMarketplaces);
    if (newSet.has(marketplace)) {
      newSet.delete(marketplace);
    } else {
      newSet.add(marketplace);
    }
    setSelectedMarketplaces(newSet);
  };

  const selectAllMarketplaces = () => {
    setSelectedMarketplaces(new Set(marketplacePlatforms));
  };

  const clearMarketplaces = () => {
    setSelectedMarketplaces(new Set());
  };

  const handleCreate = async () => {
    if (!batchName.trim() || selectedMarketplaces.size === 0) return;

    setIsCreating(true);
    try {
      // Create one entry per product-marketplace with specific data
      const marketplaceArray = Array.from(selectedMarketplaces);
      const products = selectedProducts.flatMap((p) =>
        marketplaceArray.map((marketplace) => {
          const key = getItemKey(p.id, marketplace);
          const edited = editedItems[key];
          return { 
            id: p.id, 
            name: p.name,
            sku: edited?.sku || p.vendorSku,
            stockQty: edited?.stockQty ?? p.stockQty,
            salePrice: edited?.salePrice ?? p.salePrice,
            profitMargin: p.grossProfitPercent,
            marketplace,
          };
        })
      );
      
      // For backwards compatibility, pass unique products but the batch items will be per-marketplace
      const uniqueProducts = selectedProducts.map((p) => {
        const firstMarketplace = marketplaceArray[0];
        const key = getItemKey(p.id, firstMarketplace);
        const edited = editedItems[key];
        return { 
          id: p.id, 
          name: p.name,
          sku: edited?.sku || p.vendorSku,
          stockQty: edited?.stockQty ?? p.stockQty,
          salePrice: edited?.salePrice ?? p.salePrice,
          profitMargin: p.grossProfitPercent,
        };
      });
      
      await onCreateBatch(batchName, uniqueProducts, marketplaceArray, publishMethod);
      
      // Reset form
      setBatchName('');
      setSelectedMarketplaces(new Set());
      setPublishMethod('ai');
      setEditedItems({});
      setStep('configure');
      onOpenChange(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setStep('configure');
      setEditedItems({});
    }
    onOpenChange(open);
  };

  const handleProceedToPreview = () => {
    initializeEditedItems();
    setStep('preview');
  };

  // Calculate data status for a specific product-marketplace combination
  const getItemStatus = (productId: string, marketplace: string) => {
    const key = getItemKey(productId, marketplace);
    const edited = editedItems[key];
    const missingFields: string[] = [];
    
    if (!edited?.sku) missingFields.push('SKU');
    if (edited?.salePrice === null || edited?.salePrice === undefined) missingFields.push('Price');
    if (edited?.stockQty === null || edited?.stockQty === undefined) missingFields.push('Stock');
    
    return { missingFields, hasIssues: missingFields.length > 0 };
  };

  // Count items with issues
  const itemsWithIssues = useMemo(() => {
    const marketplaceArray = Array.from(selectedMarketplaces);
    let count = 0;
    selectedProducts.forEach((p) => {
      marketplaceArray.forEach((mp) => {
        if (getItemStatus(p.id, mp).hasIssues) count++;
      });
    });
    return count;
  }, [selectedProducts, selectedMarketplaces, editedItems]);

  // Generate flat list of product-marketplace items for the table
  const previewItems = useMemo(() => {
    const marketplaceArray = Array.from(selectedMarketplaces);
    return selectedProducts.flatMap((product) =>
      marketplaceArray.map((marketplace) => ({
        product,
        marketplace,
        key: getItemKey(product.id, marketplace),
      }))
    );
  }, [selectedProducts, selectedMarketplaces]);

  const canProceedToPreview = batchName.trim() && selectedMarketplaces.size > 0;
  const totalItems = selectedProducts.length * selectedMarketplaces.size;
  const selectedMethod = publishMethods.find(m => m.id === publishMethod);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'preview' ? (
              <>
                <Eye className="w-5 h-5" />
                Preview Batch Data
              </>
            ) : (
              <>
                <Store className="w-5 h-5" />
                Bulk List to Marketplaces
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'preview' 
              ? `Review and edit ${totalItems} listings. Each marketplace can have different pricing and stock.`
              : `Select marketplaces to list ${selectedProducts.length} selected product${selectedProducts.length > 1 ? 's' : ''} on.`
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'configure' ? (
          <div className="space-y-4 flex-1 overflow-y-auto">
            {/* Batch Name */}
            <div className="space-y-2">
              <Label htmlFor="batch-name">Batch Name</Label>
              <Input
                id="batch-name"
                placeholder="e.g., January 2025 Product Launch"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
              />
            </div>

            {/* Publish Method Selection */}
            <div className="space-y-2">
              <Label>Publish Method</Label>
              <RadioGroup
                value={publishMethod}
                onValueChange={(value) => setPublishMethod(value as PublishMethod)}
                className="grid gap-2"
              >
                {publishMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <label
                      key={method.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        publishMethod === method.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value={method.id} className="mt-0.5" />
                      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        publishMethod === method.id ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{method.label}</div>
                        <div className="text-xs text-muted-foreground">{method.description}</div>
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>

            {/* Marketplace Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Marketplaces</Label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAllMarketplaces}
                    className="h-7 text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearMarketplaces}
                    className="h-7 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-[180px] border rounded-lg p-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {marketplacePlatforms.map((marketplace) => (
                    <label
                      key={marketplace}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        selectedMarketplaces.has(marketplace)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Checkbox
                        checked={selectedMarketplaces.has(marketplace)}
                        onCheckedChange={() => toggleMarketplace(marketplace)}
                      />
                      <MarketplaceLogo platform={marketplace} size="sm" />
                      <span className="text-sm truncate">
                        {marketplaceLabels[marketplace] || marketplace}
                      </span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Products:</span>
                <span className="font-medium">{selectedProducts.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Marketplaces:</span>
                <span className="font-medium">{selectedMarketplaces.size}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Method:</span>
                <span className="font-medium flex items-center gap-1">
                  {selectedMethod && <selectedMethod.icon className="w-3.5 h-3.5" />}
                  {selectedMethod?.label}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t pt-1 mt-1">
                <span className="text-muted-foreground">Total Listings:</span>
                <span className="font-bold text-primary">{totalItems}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Preview Step */
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            {/* Summary Bar */}
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg flex-wrap shrink-0">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{selectedProducts.length} Products</span>
              </div>
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{selectedMarketplaces.size} Marketplaces</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedMethod && <selectedMethod.icon className="w-4 h-4 text-muted-foreground" />}
                <span className="text-sm font-medium">{selectedMethod?.label}</span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                {itemsWithIssues > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {itemsWithIssues} with missing data
                  </Badge>
                )}
                <Badge variant="secondary">
                  {totalItems} Total Listings
                </Badge>
              </div>
            </div>

            {/* Editable hint + Fill All */}
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Pencil className="w-3 h-3" />
                <span>Edit data per marketplace. Use the copy button to apply values to all marketplaces for a product.</span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 gap-1.5">
                    <Wand2 className="w-3.5 h-3.5" />
                    Fill All
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-3">
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Set value for all {totalItems} listings</p>
                    <div className="space-y-2">
                      <Label className="text-xs">Stock Quantity</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="e.g. 100"
                          className="h-8 text-sm"
                          id="fill-stock"
                        />
                        <Button
                          size="sm"
                          className="h-8 px-3"
                          onClick={() => {
                            const input = document.getElementById('fill-stock') as HTMLInputElement;
                            if (input?.value) {
                              fillAllItems('stockQty', parseInt(input.value));
                              toast({ title: 'Stock updated', description: `Set stock to ${input.value} for all ${totalItems} listings` });
                            }
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Sale Price</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 29.99"
                          className="h-8 text-sm"
                          id="fill-price"
                        />
                        <Button
                          size="sm"
                          className="h-8 px-3"
                          onClick={() => {
                            const input = document.getElementById('fill-price') as HTMLInputElement;
                            if (input?.value) {
                              fillAllItems('salePrice', parseFloat(input.value));
                              toast({ title: 'Price updated', description: `Set sale price to $${input.value} for all ${totalItems} listings` });
                            }
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">MSRP</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 39.99"
                          className="h-8 text-sm"
                          id="fill-msrp"
                        />
                        <Button
                          size="sm"
                          className="h-8 px-3"
                          onClick={() => {
                            const input = document.getElementById('fill-msrp') as HTMLInputElement;
                            if (input?.value) {
                              fillAllItems('msrp', parseFloat(input.value));
                              toast({ title: 'MSRP updated', description: `Set MSRP to $${input.value} for all ${totalItems} listings` });
                            }
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Shipping Cost</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 5.99"
                          className="h-8 text-sm"
                          id="fill-shipping"
                        />
                        <Button
                          size="sm"
                          className="h-8 px-3"
                          onClick={() => {
                            const input = document.getElementById('fill-shipping') as HTMLInputElement;
                            if (input?.value) {
                              fillAllItems('shippingCost', parseFloat(input.value));
                              toast({ title: 'Shipping updated', description: `Set shipping to $${input.value} for all ${totalItems} listings` });
                            }
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Condition</Label>
                      <div className="flex gap-2">
                        <Select onValueChange={(value) => {
                          fillAllItems('condition', value);
                          toast({ title: 'Condition updated', description: `Set condition to "${value}" for all ${totalItems} listings` });
                        }}>
                          <SelectTrigger className="h-8 text-sm flex-1">
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                          <SelectContent>
                            {conditionOptions.map((opt) => (
                              <SelectItem key={opt} value={opt} className="text-sm">
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Products Data Table - Per Marketplace */}
            <div className="flex-1 min-h-0 border rounded-lg overflow-auto">
              <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[160px]">Product</TableHead>
                      <TableHead className="w-[90px]">Marketplace</TableHead>
                      <TableHead className="w-[100px]">SKU</TableHead>
                      <TableHead className="w-[70px]">Stock</TableHead>
                      <TableHead className="w-[90px]">Price</TableHead>
                      <TableHead className="w-[90px]">MSRP</TableHead>
                      <TableHead className="w-[80px]">Shipping</TableHead>
                      <TableHead className="w-[100px]">Condition</TableHead>
                      <TableHead className="w-[60px]">Status</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewItems.map(({ product, marketplace, key }, index) => {
                      const edited = editedItems[key];
                      const { missingFields, hasIssues } = getItemStatus(product.id, marketplace);
                      
                      // Check if this is the first row for this product (for visual grouping)
                      const isFirstForProduct = index === 0 || 
                        previewItems[index - 1].product.id !== product.id;
                      
                      return (
                        <TableRow 
                          key={key} 
                          className={`${hasIssues ? 'bg-destructive/5' : ''} ${isFirstForProduct ? 'border-t-2' : ''}`}
                        >
                          <TableCell className="py-2">
                            {isFirstForProduct ? (
                              <div className="flex items-center gap-2">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-7 h-7 rounded object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                    <Package className="w-3.5 h-3.5 text-muted-foreground" />
                                  </div>
                                )}
                                <span className="font-medium text-xs truncate max-w-[120px]">
                                  {product.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground pl-9">↳</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1.5">
                              <MarketplaceLogo platform={marketplace} size="sm" />
                              <span className="text-xs font-medium">
                                {marketplaceLabels[marketplace] || marketplace}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              value={edited?.sku || ''}
                              onChange={(e) => updateItemField(product.id, marketplace, 'sku', e.target.value)}
                              placeholder="SKU"
                              className="h-7 text-xs font-mono"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              type="number"
                              value={edited?.stockQty ?? ''}
                              onChange={(e) => updateItemField(
                                product.id, 
                                marketplace,
                                'stockQty', 
                                e.target.value ? Number(e.target.value) : null
                              )}
                              placeholder="0"
                              className="h-7 text-xs font-mono text-right"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={edited?.salePrice ?? ''}
                                onChange={(e) => updateItemField(
                                  product.id, 
                                  marketplace,
                                  'salePrice', 
                                  e.target.value ? Number(e.target.value) : null
                                )}
                                placeholder="0.00"
                                className="h-7 text-xs font-mono pl-5 text-right"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="p-1">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={edited?.msrp ?? ''}
                                onChange={(e) => updateItemField(
                                  product.id, 
                                  marketplace,
                                  'msrp', 
                                  e.target.value ? Number(e.target.value) : null
                                )}
                                placeholder="MSRP"
                                className="h-7 text-xs font-mono pl-5 text-right"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="p-1">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={edited?.shippingCost ?? ''}
                                onChange={(e) => updateItemField(
                                  product.id, 
                                  marketplace,
                                  'shippingCost', 
                                  e.target.value ? Number(e.target.value) : null
                                )}
                                placeholder="0.00"
                                className="h-7 text-xs font-mono pl-5 text-right"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="p-1">
                            <Select
                              value={edited?.condition || 'New'}
                              onValueChange={(value) => updateItemField(product.id, marketplace, 'condition', value)}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {conditionOptions.map((opt) => (
                                  <SelectItem key={opt} value={opt} className="text-xs">
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="py-2">
                            {hasIssues ? (
                              <Badge variant="destructive" className="text-[10px] px-1.5">
                                {missingFields.length}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] px-1.5">
                                ✓
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            {selectedMarketplaces.size > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => copyToAllMarketplaces(product.id, marketplace)}
                                title="Copy to all marketplaces"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
            </div>

            {/* AI Note for AI method */}
            {publishMethod === 'ai' && (
              <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-medium">AI Auto-Fill:</span>{' '}
                  <span className="text-muted-foreground">
                    Missing fields will be automatically generated using AI based on product names and available data.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-4">
          {step === 'preview' ? (
            <>
              <Button variant="outline" onClick={() => setStep('configure')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    {selectedMethod && <selectedMethod.icon className="w-4 h-4 mr-2" />}
                    {publishMethod === 'ai' ? 'AI Publish' : publishMethod === 'upc' ? 'UPC Match' : 'Publish'} ({totalItems} items)
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleProceedToPreview}
                disabled={!canProceedToPreview}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Data
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}