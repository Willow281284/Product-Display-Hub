import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Product, ProductType, KitComponent } from '@/types/product';
import { KitMappingDialog } from './KitMappingDialog';
import { Box, Package, Layers } from 'lucide-react';

interface ManualProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (product: Record<string, string>) => void;
  products?: Product[]; // For kit mapping
}

interface FieldConfig {
  id: string;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: string;
}

const basicFields: FieldConfig[] = [
  { id: 'name', label: 'Product Name', required: true, placeholder: 'Enter product name' },
  { id: 'vendorSku', label: 'SKU', required: true, placeholder: 'Enter SKU' },
  { id: 'brand', label: 'Brand', required: false, placeholder: 'Enter brand' },
  { id: 'vendorName', label: 'Vendor', required: false, placeholder: 'Enter vendor name' },
];

const identifierFields: FieldConfig[] = [
  { id: 'asin', label: 'ASIN', placeholder: 'Amazon Standard Identification Number' },
  { id: 'fnsku', label: 'FNSKU', placeholder: 'Fulfillment Network SKU' },
  { id: 'gtin', label: 'GTIN', placeholder: 'Global Trade Item Number' },
  { id: 'ean', label: 'EAN', placeholder: 'European Article Number' },
  { id: 'isbn', label: 'ISBN', placeholder: 'International Standard Book Number' },
  { id: 'manufacturerPart', label: 'MPN', placeholder: 'Manufacturer Part Number' },
];

const pricingFields: FieldConfig[] = [
  { id: 'landedCost', label: 'Landed Cost', placeholder: '0.00', type: 'number' },
  { id: 'shippingCost', label: 'Shipping Cost', placeholder: '0.00', type: 'number' },
  { id: 'salePrice', label: 'Sale Price', placeholder: '0.00', type: 'number' },
];

const inventoryFields: FieldConfig[] = [
  { id: 'purchaseQty', label: 'Purchase Qty', placeholder: '0', type: 'number' },
  { id: 'stockQty', label: 'Stock Qty', placeholder: '0', type: 'number' },
  { id: 'soldQty', label: 'Sold Qty', placeholder: '0', type: 'number' },
  { id: 'returnQty', label: 'Return Qty', placeholder: '0', type: 'number' },
];

export function ManualProductDialog({ open, onOpenChange, onSave, products = [] }: ManualProductDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [productType, setProductType] = useState<ProductType>('single');
  const [kitComponents, setKitComponents] = useState<KitComponent[]>([]);
  const [kitMappingOpen, setKitMappingOpen] = useState(false);

  const handleChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = () => {
    // Validate required fields
    const missingRequired = basicFields
      .filter(f => f.required && !formData[f.id]?.trim())
      .map(f => f.label);

    if (missingRequired.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please fill in: ${missingRequired.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    // Add product type and kit components to form data
    const productData = {
      ...formData,
      productType,
      kitComponents: JSON.stringify(kitComponents),
    };

    onSave(productData);
    setFormData({});
    setProductType('single');
    setKitComponents([]);
    toast({
      title: "Product created",
      description: `"${formData.name}" has been created successfully as a ${productType} product.`,
    });
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setFormData({});
      setProductType('single');
      setKitComponents([]);
    }
    onOpenChange(isOpen);
  };

  const renderFields = (fields: FieldConfig[]) => (
    <div className="grid gap-4">
      {fields.map(field => (
        <div key={field.id} className="grid gap-2">
          <Label htmlFor={field.id} className="flex items-center gap-1">
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id={field.id}
            type={field.type || 'text'}
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
          />
        </div>
      ))}
    </div>
  );

  // Get product by ID for display
  const getProductById = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
            <DialogDescription>
              Enter product details manually. Required fields are marked with an asterisk.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="type">Type</TabsTrigger>
              <TabsTrigger value="identifiers">Identifiers</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 h-[350px] mt-4">
              <TabsContent value="basic" className="mt-0 px-1">
                {renderFields(basicFields)}
              </TabsContent>

              <TabsContent value="type" className="mt-0 px-1 space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Product Type</Label>
                  <RadioGroup
                    value={productType}
                    onValueChange={(value) => setProductType(value as ProductType)}
                    className="grid gap-3"
                  >
                    <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="single" id="type-single" />
                      <Label htmlFor="type-single" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">Single Product</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          A standalone product that is sold individually
                        </p>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="kit" id="type-kit" />
                      <Label htmlFor="type-kit" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Box className="w-5 h-5 text-primary" />
                          <span className="font-medium">Kit Product</span>
                          <Badge variant="secondary" className="ml-2">Bundle</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          A bundle of multiple products sold together as one unit
                        </p>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors opacity-60">
                      <RadioGroupItem value="variation" id="type-variation" disabled />
                      <Label htmlFor="type-variation" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Layers className="w-5 h-5 text-blue-500" />
                          <span className="font-medium">Variation Product</span>
                          <Badge variant="outline" className="ml-2">Auto-created</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Variations are created automatically when adding product options
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Kit Mapping Section */}
                {productType === 'kit' && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold">Kit Mapping</Label>
                        <p className="text-sm text-muted-foreground">
                          Add products to include in this kit
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setKitMappingOpen(true)}
                        className="gap-2"
                      >
                        <Box className="w-4 h-4" />
                        {kitComponents.length > 0 ? 'Edit Kit' : 'Add Products'}
                      </Button>
                    </div>

                    {kitComponents.length > 0 ? (
                      <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                        <div className="text-sm font-medium flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          {kitComponents.length} product{kitComponents.length !== 1 ? 's' : ''} in kit
                        </div>
                        <div className="space-y-1">
                          {kitComponents.slice(0, 3).map((component) => {
                            const product = getProductById(component.productId);
                            return (
                              <div
                                key={component.productId}
                                className="text-sm text-muted-foreground flex items-center gap-2"
                              >
                                <span>•</span>
                                <span>{product?.name || `Product ${component.productId}`}</span>
                                <Badge variant="secondary" className="text-xs">
                                  ×{component.quantity}
                                </Badge>
                              </div>
                            );
                          })}
                          {kitComponents.length > 3 && (
                            <div className="text-sm text-muted-foreground">
                              +{kitComponents.length - 3} more products
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                        <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No products added to kit yet</p>
                        <p className="text-xs mt-1">Click "Add Products" to map kit components</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="identifiers" className="mt-0 px-1">
                {renderFields(identifierFields)}
              </TabsContent>

              <TabsContent value="pricing" className="mt-0 px-1">
                {renderFields(pricingFields)}
              </TabsContent>

              <TabsContent value="inventory" className="mt-0 px-1">
                {renderFields(inventoryFields)}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Create {productType === 'kit' ? 'Kit' : 'Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kit Mapping Dialog */}
      <KitMappingDialog
        open={kitMappingOpen}
        onOpenChange={setKitMappingOpen}
        products={products}
        selectedComponents={kitComponents}
        onSave={setKitComponents}
      />
    </>
  );
}
