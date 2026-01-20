import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MarketplaceLogo } from '@/components/products/MarketplaceLogo';
import { BatchItem } from '@/types/batch';
import { AlertCircle, Save, RefreshCw, Loader2 } from 'lucide-react';

interface BatchItemErrorDialogProps {
  item: BatchItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveAndRetry: (itemId: string, updates: {
    product_name: string;
    product_sku: string | null;
    stock_qty: number | null;
    sale_price: number | null;
    profit_margin: number | null;
  }) => Promise<void>;
}

export function BatchItemErrorDialog({
  item,
  open,
  onOpenChange,
  onSaveAndRetry,
}: BatchItemErrorDialogProps) {
  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [profitMargin, setProfitMargin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      setProductName(item.product_name);
      setSku(item.product_sku || '');
      setStockQty(item.stock_qty?.toString() || '');
      setSalePrice(item.sale_price?.toString() || '');
      setProfitMargin(item.profit_margin?.toString() || '');
    }
  }, [item]);

  const handleSaveAndRetry = async () => {
    if (!item) return;
    
    setIsSaving(true);
    try {
      await onSaveAndRetry(item.id, {
        product_name: productName,
        product_sku: sku || null,
        stock_qty: stockQty ? parseInt(stockQty) : null,
        sale_price: salePrice ? parseFloat(salePrice) : null,
        profit_margin: profitMargin ? parseFloat(profitMargin) : null,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Fix Error & Retry
          </DialogTitle>
          <DialogDescription>
            Review and correct the product details, then retry the listing.
          </DialogDescription>
        </DialogHeader>

        {/* Error Message */}
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Error Message</p>
              <p className="text-muted-foreground mt-1">{item.error_message || 'Unknown error'}</p>
            </div>
          </div>
        </div>

        {/* Marketplace Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Target Marketplace:</span>
          <MarketplaceLogo platform={item.marketplace} size="md" />
        </div>

        {/* Editable Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-name">Product Name</Label>
            <Input
              id="product-name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Enter product name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU number"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Sale Price ($)</Label>
              <Input
                id="price"
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="margin">Profit Margin (%)</Label>
              <Input
                id="margin"
                type="number"
                value={profitMargin}
                onChange={(e) => setProfitMargin(e.target.value)}
                placeholder="0.0"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Product ID (readonly) */}
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Product ID:</span> {item.product_id}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveAndRetry} disabled={isSaving || !productName.trim()}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Save & Retry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
