import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tag as TagType } from '@/types/tag';
import { Product } from '@/types/product';
import { Plus, Trash2, Download, DollarSign, Package, Store, History, Tag as TagIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulkActionsBarProps {
  selectedCount: number;
  selectedProductIds: Set<string>;
  products: Product[];
  allFilteredProducts: Product[];
  tags: TagType[];
  onClearSelection: () => void;
  onBulkAddTag?: (productIds: string[], tagId: string) => void;
  onBulkRemoveTag?: (productIds: string[], tagId: string) => void;
  onBulkDelete?: (productIds: string[]) => void;
  onBulkUpdatePricing?: (productIds: string[], updates: Partial<{
    salePrice: number;
    stockQty: number;
    landedCost: number;
    purchaseQty: number;
  }>) => void;
  onOpenBulkListing?: () => void;
  onOpenBulkOffer?: (productIds: string[]) => void;
}

export function BulkActionsBar({
  selectedCount,
  selectedProductIds,
  products,
  allFilteredProducts,
  tags,
  onClearSelection,
  onBulkAddTag,
  onBulkRemoveTag,
  onBulkDelete,
  onBulkUpdatePricing,
  onOpenBulkListing,
  onOpenBulkOffer,
}: BulkActionsBarProps) {
  const { toast } = useToast();
  const [priceValue, setPriceValue] = useState('');
  const [stockValue, setStockValue] = useState('');
  const [landedCostValue, setLandedCostValue] = useState('');
  const [purchasedQtyValue, setPurchasedQtyValue] = useState('');
  const [pricingPopoverOpen, setPricingPopoverOpen] = useState(false);

  const handleBulkAddTag = (tagId: string, tagName: string) => {
    if (onBulkAddTag && selectedProductIds.size > 0) {
      onBulkAddTag(Array.from(selectedProductIds), tagId);
      toast({
        title: "Tags added",
        description: `Added "${tagName}" to ${selectedProductIds.size} product${selectedProductIds.size > 1 ? 's' : ''}`,
      });
    }
  };

  const handleBulkRemoveTag = (tagId: string, tagName: string) => {
    if (onBulkRemoveTag && selectedProductIds.size > 0) {
      onBulkRemoveTag(Array.from(selectedProductIds), tagId);
      toast({
        title: "Tags removed",
        description: `Removed "${tagName}" from ${selectedProductIds.size} product${selectedProductIds.size > 1 ? 's' : ''}`,
      });
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedProductIds.size > 0) {
      const count = selectedProductIds.size;
      onBulkDelete(Array.from(selectedProductIds));
      onClearSelection();
      toast({
        title: "Products deleted",
        description: `Deleted ${count} product${count > 1 ? 's' : ''} successfully`,
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = () => {
    const selectedProducts = allFilteredProducts.filter(p => selectedProductIds.has(p.id));
    
    const headers = [
      'ID', 'Name', 'SKU', 'Brand', 'Product ID', 'Variation ID', 'Vendor',
      'MPN', 'ASIN', 'FNSKU', 'GTIN', 'EAN', 'ISBN',
      'Landed Cost', 'Shipping Cost', 'Sale Price',
      'Purchased Qty', 'Sold Qty', 'Stock Qty', 'Return Qty',
      'Profit Margin %', 'Profit Amount', 'Kit Product', 'Marketplaces'
    ];

    const csvContent = [
      headers.join(','),
      ...selectedProducts.map(p => [
        `"${p.id}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.vendorSku}"`,
        `"${p.brand}"`,
        `"${p.productId}"`,
        `"${p.variationId || ''}"`,
        `"${p.vendorName}"`,
        `"${p.manufacturerPart}"`,
        `"${p.asin}"`,
        `"${p.fnsku}"`,
        `"${p.gtin}"`,
        `"${p.ean}"`,
        `"${p.isbn}"`,
        p.landedCost,
        p.shippingCost,
        p.salePrice,
        p.purchaseQty,
        p.soldQty,
        p.stockQty,
        p.returnQty,
        p.grossProfitPercent,
        p.grossProfitAmount,
        p.kitProduct ? 'Yes' : 'No',
        `"${p.marketplaces.map(m => `${m.platform}:${m.status}`).join(';')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "CSV exported",
      description: `Exported ${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} to CSV`,
    });
  };

  const handleBulkPricingUpdate = () => {
    if (!onBulkUpdatePricing) return;

    const updates: Partial<{
      salePrice: number;
      stockQty: number;
      landedCost: number;
      purchaseQty: number;
    }> = {};

    const updateFields: string[] = [];
    if (priceValue) { updates.salePrice = parseFloat(priceValue); updateFields.push('Sale Price'); }
    if (stockValue) { updates.stockQty = parseInt(stockValue); updateFields.push('Stock'); }
    if (landedCostValue) { updates.landedCost = parseFloat(landedCostValue); updateFields.push('Landed Cost'); }
    if (purchasedQtyValue) { updates.purchaseQty = parseInt(purchasedQtyValue); updateFields.push('Purchased Qty'); }

    if (Object.keys(updates).length > 0) {
      onBulkUpdatePricing(Array.from(selectedProductIds), updates);
      // Reset form
      setPriceValue('');
      setStockValue('');
      setLandedCostValue('');
      setPurchasedQtyValue('');
      setPricingPopoverOpen(false);
      
      toast({
        title: "Products updated",
        description: `Updated ${updateFields.join(', ')} for ${selectedProductIds.size} product${selectedProductIds.size > 1 ? 's' : ''}`,
      });
    }
  };

  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-40 mb-3 p-2 sm:p-3 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-lg">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-xs sm:text-sm font-medium">
          {selectedCount} product{selectedCount > 1 ? 's' : ''} selected
        </span>
        <Button variant="ghost" size="sm" onClick={onClearSelection} className="h-6 sm:h-7 text-[10px] sm:text-xs px-2">
          Clear
        </Button>
      </div>
      
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        {/* Add Tags */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 sm:gap-1.5 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Add</span> Tags
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="end">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Add tag to selected</p>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">No tags available</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleBulkAddTag(tag.id, tag.name)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left text-sm"
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Remove Tags */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 sm:gap-1.5 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Remove</span> Tags
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="end">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Remove tag from selected</p>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">No tags available</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleBulkRemoveTag(tag.id, tag.name)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left text-sm"
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Update Pricing/Stock */}
        <Popover open={pricingPopoverOpen} onOpenChange={setPricingPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 sm:gap-1.5 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Update</span> Values
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <p className="text-xs font-medium text-muted-foreground mb-3">Update values for {selectedCount} products</p>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="bulk-price" className="text-xs">Sale Price</Label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    id="bulk-price"
                    type="number"
                    placeholder="Leave empty to skip"
                    value={priceValue}
                    onChange={(e) => setPriceValue(e.target.value)}
                    className="h-8 pl-6 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="bulk-stock" className="text-xs">Stock Qty</Label>
                <div className="relative">
                  <Package className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                  <Input
                    id="bulk-stock"
                    type="number"
                    placeholder="Leave empty to skip"
                    value={stockValue}
                    onChange={(e) => setStockValue(e.target.value)}
                    className="h-8 pl-7 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="0"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="bulk-landed" className="text-xs">Landed Cost (MSRP)</Label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    id="bulk-landed"
                    type="number"
                    placeholder="Leave empty to skip"
                    value={landedCostValue}
                    onChange={(e) => setLandedCostValue(e.target.value)}
                    className="h-8 pl-6 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="bulk-purchased" className="text-xs">Purchased Qty</Label>
                <div className="relative">
                  <Package className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                  <Input
                    id="bulk-purchased"
                    type="number"
                    placeholder="Leave empty to skip"
                    value={purchasedQtyValue}
                    onChange={(e) => setPurchasedQtyValue(e.target.value)}
                    className="h-8 pl-7 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="0"
                  />
                </div>
              </div>
              <Button
                size="sm"
                className="w-full h-8"
                onClick={handleBulkPricingUpdate}
                disabled={!priceValue && !stockValue && !landedCostValue && !purchasedQtyValue}
              >
                Apply to {selectedCount} Products
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* List to Marketplaces */}
        {onOpenBulkListing && (
          <Button 
            variant="default" 
            size="sm" 
            className="gap-1 sm:gap-1.5 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3 bg-blue-600 hover:bg-blue-700"
            onClick={onOpenBulkListing}
          >
            <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">List to</span> Marketplaces
          </Button>
        )}

        {/* Create Bulk Offer */}
        {onOpenBulkOffer && (
          <Button 
            variant="default" 
            size="sm" 
            className="gap-1 sm:gap-1.5 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3 bg-purple-600 hover:bg-purple-700"
            onClick={() => onOpenBulkOffer(Array.from(selectedProductIds))}
          >
            <TagIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Create</span> Offer
          </Button>
        )}

        {/* Batch History - Link to page */}
        <Link to="/batches">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 sm:gap-1.5 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Batch</span> History
          </Button>
        </Link>

        {/* Export CSV */}
        <Button variant="outline" size="sm" className="gap-1 sm:gap-1.5 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3" onClick={handleExportCSV}>
          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">Export</span> CSV
        </Button>

        {/* Delete Selected */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-1 sm:gap-1.5 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedCount} products?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the selected products from your inventory.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto">
                Delete Products
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
