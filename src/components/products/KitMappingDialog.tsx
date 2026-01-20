import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Product, KitComponent } from '@/types/product';
import { 
  Search, 
  Package, 
  Plus, 
  Minus, 
  Trash2,
  Box,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KitMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  selectedComponents: KitComponent[];
  onSave: (components: KitComponent[]) => void;
  excludeProductId?: string; // Exclude the current product from the list
}

export function KitMappingDialog({
  open,
  onOpenChange,
  products,
  selectedComponents,
  onSave,
  excludeProductId,
}: KitMappingDialogProps) {
  const [search, setSearch] = useState('');
  const [components, setComponents] = useState<KitComponent[]>(selectedComponents);

  // Reset state when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setComponents(selectedComponents);
      setSearch('');
    }
    onOpenChange(isOpen);
  };

  // Filter products (exclude variations and kits, and the current product)
  const availableProducts = useMemo(() => {
    return products.filter(p => {
      // Exclude the current product being edited
      if (excludeProductId && p.id === excludeProductId) return false;
      // Only allow single products to be added to kits
      if (p.productType !== 'single') return false;
      return true;
    });
  }, [products, excludeProductId]);

  // Filtered products based on search
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return availableProducts;
    const searchLower = search.toLowerCase();
    return availableProducts.filter(
      p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.vendorSku.toLowerCase().includes(searchLower) ||
        p.productId.toLowerCase().includes(searchLower)
    );
  }, [availableProducts, search]);

  // Check if product is selected
  const isSelected = (productId: string) => {
    return components.some(c => c.productId === productId);
  };

  // Get quantity for a product
  const getQuantity = (productId: string) => {
    const component = components.find(c => c.productId === productId);
    return component?.quantity || 0;
  };

  // Toggle product selection
  const toggleProduct = (productId: string) => {
    if (isSelected(productId)) {
      setComponents(components.filter(c => c.productId !== productId));
    } else {
      setComponents([...components, { productId, quantity: 1 }]);
    }
  };

  // Update quantity
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setComponents(components.filter(c => c.productId !== productId));
    } else {
      setComponents(
        components.map(c =>
          c.productId === productId ? { ...c, quantity } : c
        )
      );
    }
  };

  // Get product by ID
  const getProduct = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  const handleSave = () => {
    onSave(components);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Box className="w-5 h-5 text-primary" />
            Kit Mapping
          </DialogTitle>
          <DialogDescription>
            Select products to include in this kit and specify quantities.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Left side - Product selection */}
          <div className="flex-1 flex flex-col min-h-0 lg:border-r">
            <div className="p-4 border-b flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name, SKU, or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 space-y-2">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No products found</p>
                  </div>
                ) : (
                  filteredProducts.map((product) => {
                    const selected = isSelected(product.id);
                    return (
                      <div
                        key={product.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                          selected
                            ? "bg-primary/5 border-primary/30"
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => toggleProduct(product.id)}
                      >
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => toggleProduct(product.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover bg-muted flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <code className="bg-muted px-1 py-0.5 rounded truncate max-w-[100px]">
                              {product.vendorSku}
                            </code>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline">{product.brand}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-medium text-sm">
                            ${product.salePrice.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {product.stockQty} in stock
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right side - Selected components */}
          <div className="w-full lg:w-80 flex flex-col bg-muted/30 border-t lg:border-t-0 min-h-0 max-h-[40vh] lg:max-h-none flex-shrink-0 lg:flex-shrink">
            <div className="p-4 border-b bg-background flex-shrink-0">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="w-4 h-4" />
                Kit Contents
                <Badge variant="secondary" className="ml-auto">
                  {components.length} items
                </Badge>
              </h3>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 space-y-3">
                {components.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No products added yet</p>
                    <p className="text-xs">Click products on the left to add them</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                    {components.map((component) => {
                      const product = getProduct(component.productId);
                      if (!product) return null;

                      return (
                        <div
                          key={component.productId}
                          className="bg-background rounded-lg border p-3 space-y-2"
                        >
                          <div className="flex items-start gap-2">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-8 h-8 rounded object-cover bg-muted flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs truncate">
                                {product.name}
                              </p>
                              <code className="text-xs text-muted-foreground truncate block">
                                {product.vendorSku}
                              </code>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0"
                              onClick={() => toggleProduct(component.productId)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <Label className="text-xs text-muted-foreground flex-shrink-0">
                              Qty
                            </Label>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6 flex-shrink-0"
                                onClick={() =>
                                  updateQuantity(
                                    component.productId,
                                    component.quantity - 1
                                  )
                                }
                                disabled={component.quantity <= 1}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <Input
                                type="number"
                                min={1}
                                value={component.quantity}
                                onChange={(e) =>
                                  updateQuantity(
                                    component.productId,
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="h-6 w-10 text-center text-sm px-1"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6 flex-shrink-0"
                                onClick={() =>
                                  updateQuantity(
                                    component.productId,
                                    component.quantity + 1
                                  )
                                }
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <span className="font-medium text-xs flex-shrink-0">
                              ${(product.salePrice * component.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>

            {components.length > 0 && (
              <div className="p-4 border-t bg-background flex-shrink-0">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Total Items:</span>
                  <span className="font-medium">
                    {components.reduce((sum, c) => sum + c.quantity, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Component Value:</span>
                  <span className="font-semibold text-primary">
                    $
                    {components
                      .reduce((sum, c) => {
                        const product = getProduct(c.productId);
                        return sum + (product?.salePrice || 0) * c.quantity;
                      }, 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t flex-shrink-0 flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSave} className="w-full sm:w-auto">
            Save Kit Mapping ({components.length} products)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}