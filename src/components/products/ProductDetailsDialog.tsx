import { useState, useEffect, useMemo, useCallback } from 'react';
import { Product } from '@/types/product';
import { MarketplaceCompact } from './MarketplaceCompact';
import { MarketplaceLogo } from './MarketplaceLogo';
import { MarketplaceSelectionDialog } from './MarketplaceSelectionDialog';
import { TagBadge } from './TagBadge';
import { CopyButton } from './CopyButton';
import { Tag } from '@/types/tag';
import { APlusContentEditor } from '@/components/batches/APlusContentEditor';
import { VariationSettingsEditor } from './VariationSettingsEditor';
import { ManageOptionsDialog } from './ManageOptionsDialog';
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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Package,
  DollarSign,
  BarChart3,
  Globe,
  Tag as TagIcon,
  Edit,
  Save,
  X,
  Box,
  Truck,
  TrendingUp,
  ShoppingCart,
  RotateCcw,
  Layers,
  Hash,
  Building2,
  Barcode,
  CheckCircle2,
  XCircle,
  FileText,
  List,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  Settings2,
  Palette,
  Image,
  Type,
  ToggleLeft,
  Link2Off,
  Power,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface ProductDetailsDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags?: Tag[];
  getProductTags?: (productId: string) => Tag[];
  onToggleProductTag?: (productId: string, tagId: string) => void;
  onSave?: (productId: string, updates: Partial<Product>) => void;
}

export function ProductDetailsDialog({
  product,
  open,
  onOpenChange,
  tags = [],
  getProductTags,
  onToggleProductTag,
  onSave,
}: ProductDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Partial<Product>>({});
  const [activeTab, setActiveTab] = useState('overview');
  const [description, setDescription] = useState('');
  const [bulletPoints, setBulletPoints] = useState<string[]>(['', '', '', '', '']);
  const [aplusContent, setAplusContent] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [msrp, setMsrp] = useState<number>(0);
  const [buyBoxMinPrice, setBuyBoxMinPrice] = useState<number>(0);
  const [buyBoxMaxPrice, setBuyBoxMaxPrice] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [showAllMarketplaces, setShowAllMarketplaces] = useState(false);
  const [extraAttributes, setExtraAttributes] = useState<{ name: string; value: string; type: 'text' | 'number' }[]>([
    { name: 'Batteries Included', value: 'False', type: 'text' },
    { name: 'Batteries Required', value: 'False', type: 'text' },
    { name: 'Department', value: 'unisex-adult', type: 'text' },
    { name: 'Material', value: 'Zinc', type: 'text' },
    { name: 'Item Package Quantity', value: '1', type: 'number' },
    { name: 'Pattern', value: 'Animal Print', type: 'text' },
  ]);
  const [productOptions, setProductOptions] = useState<{ 
    name: string; 
    choices: string[]; 
    displayAs: 'list' | 'color';
    linkImages: boolean;
  }[]>([
    { name: 'color', choices: ['#03-bell', 'Born to Ride', 'Middle Finger With Rose', 'Never Ride Faster Than Your Angel Can Fly', 'No Excuses', 'Proud to Be an American'], displayAs: 'list', linkImages: false }
  ]);
  const [variationData, setVariationData] = useState<Array<{
    id: string;
    name: string;
    sku: string;
    upc?: string;
    asin?: string;
    fnsku?: string;
    barcode?: string;
    harmcode?: string;
    vendorSku?: string;
    weight?: number;
    weightUnit?: string;
    height?: number;
    width?: number;
    length?: number;
    invQtyAdjustment?: number;
    purchaseQty?: number;
    soldQty?: number;
    returnReceiveQty?: number;
    availableStock?: number;
    quantityAllocated?: number;
    reserveQty?: number;
    damageQty?: number;
    onHandQty?: number;
    virtualStock?: number;
    purchasePrice?: number;
    inboundFreight?: number;
    extraDuty?: number;
    landedCost?: number;
    fvf?: number;
    tac?: number;
    salePrice?: number;
    msrp?: number;
    competitorPrice?: number;
    profitMargin?: number;
    minBuyBox?: number;
    maxBuyBox?: number;
    extraAttributes?: { name: string; value: string }[];
  }>>([]);
  const [newOptionChoice, setNewOptionChoice] = useState('');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUpdatingMarketplaces, setIsUpdatingMarketplaces] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [hasMarketplaceChanges, setHasMarketplaceChanges] = useState(false);
  const [selectedForPublish, setSelectedForPublish] = useState<string[]>([]);
  const [showManageOptionsDialog, setShowManageOptionsDialog] = useState(false);

  // All available platforms
  const allPlatforms = [
    'amazon', 'walmart', 'ebay', 'newegg', 'bestbuy', 'target', 
    'etsy', 'shopify', 'temu', 'macys', 'costco', 'homedepot', 
    'lowes', 'wayfair', 'overstock'
  ];

  // Memoize marketplace data to prevent random values from changing on re-render
  // MUST be before early return to maintain consistent hook order
  const allMarketplaceData = useMemo(() => {
    if (!product) return [];
    const existingMap = new Map(product.marketplaces.map(mp => [mp.platform, mp]));
    return allPlatforms.map(platform => {
      const existing = existingMap.get(platform as any);
      return {
        platform,
        status: existing?.status || 'not_listed',
        soldQty: existing?.status === 'live' ? Math.floor(Math.random() * 30) + 5 : 0,
        revenue: 0,
        priceSync: existing?.status === 'live',
        invSync: existing?.status === 'live',
      };
    });
  }, [product?.id, product?.marketplaces]);

  useEffect(() => {
    if (product && open) {
      setEditedProduct({
        name: product.name,
        brand: product.brand,
        vendorSku: product.vendorSku,
        vendorName: product.vendorName,
        manufacturerPart: product.manufacturerPart,
        salePrice: product.salePrice,
        landedCost: product.landedCost,
        shippingCost: product.shippingCost,
        stockQty: product.stockQty,
        purchaseQty: product.purchaseQty,
        soldQty: product.soldQty,
        returnQty: product.returnQty,
        asin: product.asin,
        fnsku: product.fnsku,
        gtin: product.gtin,
        ean: product.ean,
        isbn: product.isbn,
      });
      setIsEditing(false);
      setActiveTab('overview');
    }
  }, [product, open]);

  // Generate variation data from product options choices
  useEffect(() => {
    if (productOptions.length > 0) {
      const allChoices = productOptions.flatMap((opt, optIdx) => 
        opt.choices.map((choice, choiceIdx) => ({
          id: `${optIdx}-${choiceIdx}`,
          name: choice,
          sku: `DA-DES-7-11Y5A-${choice.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase()}`,
          upc: '',
          asin: `B0YYSMQC71`,
          fnsku: '',
          availableStock: 0,
          quantityAllocated: 0,
          onHandQty: 0,
          salePrice: 14.99,
          profitMargin: 15.5,
        }))
      );
      setVariationData(allChoices);
    }
  }, [productOptions]);

  // Handler to update a specific variation
  const handleUpdateVariation = useCallback((index: number, data: Partial<typeof variationData[0]>) => {
    setVariationData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...data };
      return updated;
    });
  }, []);

  if (!product) return null;

  const productTags = getProductTags ? getProductTags(product.id) : [];

  const liveMarketplaces = product.marketplaces.filter(m => m.status === 'live');
  const inactiveMarketplaces = product.marketplaces.filter(m => m.status === 'inactive');
  const errorMarketplaces = product.marketplaces.filter(m => m.status === 'error');
  const notListedMarketplaces = product.marketplaces.filter(m => m.status === 'not_listed');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(product.id, editedProduct);
      toast.success('Product updated successfully');
    } else {
      toast.info('Product changes saved locally', {
        description: 'Backend integration coming soon'
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProduct({
      name: product.name,
      brand: product.brand,
      vendorSku: product.vendorSku,
      vendorName: product.vendorName,
      manufacturerPart: product.manufacturerPart,
      salePrice: product.salePrice,
      landedCost: product.landedCost,
      shippingCost: product.shippingCost,
      stockQty: product.stockQty,
      purchaseQty: product.purchaseQty,
      soldQty: product.soldQty,
      returnQty: product.returnQty,
      asin: product.asin,
      fnsku: product.fnsku,
      gtin: product.gtin,
      ean: product.ean,
      isbn: product.isbn,
    });
    setIsEditing(false);
  };

  const addExtraAttribute = () => {
    setExtraAttributes(prev => [...prev, { name: '', value: '', type: 'text' as const }]);
  };

  const updateExtraAttribute = (index: number, field: 'name' | 'value' | 'type', value: string) => {
    setExtraAttributes(prev => {
      const updated = [...prev];
      if (field === 'type') {
        updated[index] = { ...updated[index], type: value as 'text' | 'number' };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const removeExtraAttribute = (index: number) => {
    setExtraAttributes(prev => prev.filter((_, i) => i !== index));
  };

  const addProductOption = () => {
    setProductOptions(prev => [...prev, { name: 'size', choices: [], displayAs: 'list', linkImages: false }]);
    setSelectedOptionIndex(productOptions.length);
  };

  const removeProductOption = (index: number) => {
    setProductOptions(prev => prev.filter((_, i) => i !== index));
    if (selectedOptionIndex >= productOptions.length - 1) {
      setSelectedOptionIndex(Math.max(0, productOptions.length - 2));
    }
  };

  const addOptionChoice = () => {
    if (!newOptionChoice.trim()) return;
    setProductOptions(prev => {
      const updated = [...prev];
      updated[selectedOptionIndex] = {
        ...updated[selectedOptionIndex],
        choices: [...updated[selectedOptionIndex].choices, newOptionChoice.trim()]
      };
      return updated;
    });
    setNewOptionChoice('');
  };

  const removeOptionChoice = (choiceIndex: number) => {
    setProductOptions(prev => {
      const updated = [...prev];
      updated[selectedOptionIndex] = {
        ...updated[selectedOptionIndex],
        choices: updated[selectedOptionIndex].choices.filter((_, i) => i !== choiceIndex)
      };
      return updated;
    });
  };

  const updateOptionSettings = (field: 'name' | 'displayAs' | 'linkImages', value: string | boolean) => {
    setProductOptions(prev => {
      const updated = [...prev];
      updated[selectedOptionIndex] = { ...updated[selectedOptionIndex], [field]: value };
      return updated;
    });
  };

  // Direct publish for a single marketplace (row button)
  const handleDirectPublish = async (platform: string) => {
    setIsPublishing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsPublishing(false);
    toast.success(`Published to ${platform}`, {
      description: 'Listing is now being processed'
    });
  };

  // Check if a marketplace can be published (not_listed, inactive, or error)
  const canPublish = (status: string) => status !== 'live';

  // Toggle checkbox selection for publishable marketplaces
  const handleTogglePublishSelect = (platform: string) => {
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
    const count = selectedForPublish.length;
    setSelectedForPublish([]);
    setIsPublishing(false);
    
    const methodLabels = { manual: 'Manual', upc: 'UPC', ai: 'AI' };
    toast.success(`Published ${count} marketplace(s) via ${methodLabels[method]}`, {
      description: 'Listings are now being processed'
    });
  };

  const handleMarketplaceSaveChanges = () => {
    if (liveMarketplaces.length > 0 && hasMarketplaceChanges) {
      setShowSyncDialog(true);
    } else {
      toast.success('Changes saved successfully');
    }
  };

  const handleSyncConfirm = async (selectedPlatforms: string[]) => {
    setIsUpdatingMarketplaces(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsUpdatingMarketplaces(false);
    toast.success(`Updated ${selectedPlatforms.length} live marketplace(s)`, {
      description: 'Changes have been pushed to selected marketplaces'
    });
    setHasMarketplaceChanges(false);
  };

  const handleMarketplaceFieldChange = () => {
    setHasMarketplaceChanges(true);
  };

  const updateField = (field: keyof Product, value: string | number) => {
    setEditedProduct(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[98vw] !w-[1400px] !h-[95vh] !max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-20 h-20 rounded-lg object-cover bg-muted border"
              />
              <div>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  {isEditing ? (
                    <Input
                      value={editedProduct.name || ''}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="text-2xl font-semibold h-auto py-1.5 w-[500px]"
                    />
                  ) : (
                    <>
                      {product.name}
                      {product.kitProduct && (
                        <Badge variant="secondary" className="ml-2">
                          <Box className="w-3 h-3 mr-1" />
                          Kit
                        </Badge>
                      )}
                    </>
                  )}
                </DialogTitle>
                <DialogDescription className="mt-1.5 flex items-center gap-4 text-base">
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-4 h-4" />
                    {product.productId}
                  </span>
                  {product.variationId && (
                    <Badge variant="outline" className="text-sm">
                      Variation: {product.variationId}
                    </Badge>
                  )}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Product
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-3 justify-start shrink-0">
            <TabsTrigger value="overview" className="gap-2">
              <Package className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Pricing & Inventory
            </TabsTrigger>
            <TabsTrigger value="identifiers" className="gap-2">
              <Barcode className="w-4 h-4" />
              Identifiers
            </TabsTrigger>
            <TabsTrigger value="marketplaces" className="gap-2">
              <Globe className="w-4 h-4" />
              Marketplaces
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <FileText className="w-4 h-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="options" className="gap-2">
              <Palette className="w-4 h-4" />
              Product Options
            </TabsTrigger>
            <TabsTrigger value="extra" className="gap-2">
              <Settings2 className="w-4 h-4" />
              Extra Attributes
            </TabsTrigger>
            <TabsTrigger value="tags" className="gap-2">
              <TagIcon className="w-4 h-4" />
              Tags
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Basic Information
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">Brand</Label>
                        {isEditing ? (
                          <Input
                            value={editedProduct.brand || ''}
                            onChange={(e) => updateField('brand', e.target.value)}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-base font-medium mt-1">{product.brand}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Vendor</Label>
                        {isEditing ? (
                          <Input
                            value={editedProduct.vendorName || ''}
                            onChange={(e) => updateField('vendorName', e.target.value)}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-base font-medium mt-1">{product.vendorName || '—'}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">SKU</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {isEditing ? (
                          <Input
                            value={editedProduct.vendorSku || ''}
                            onChange={(e) => updateField('vendorSku', e.target.value)}
                          />
                        ) : (
                          <>
                            <code className="text-sm bg-muted px-2 py-1 rounded">{product.vendorSku}</code>
                            <CopyButton value={product.vendorSku} />
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">MPN (Manufacturer Part Number)</Label>
                      {isEditing ? (
                        <Input
                          value={editedProduct.manufacturerPart || ''}
                          onChange={(e) => updateField('manufacturerPart', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-base font-medium mt-1">{product.manufacturerPart || '—'}</p>
                      )}
                    </div>
                    {product.variation && (
                      <div>
                        <Label className="text-muted-foreground text-sm">Variation</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{product.variation.type}</Badge>
                          <span className="text-base font-medium">{product.variation.value}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Quick Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">Sale Price</span>
                      </div>
                      <p className="text-2xl font-bold">{formatCurrency(product.salePrice)}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">Profit Margin</span>
                      </div>
                      <p className={cn(
                        "text-2xl font-bold",
                        product.grossProfitPercent > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {product.grossProfitPercent}%
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Layers className="w-4 h-4" />
                        <span className="text-sm">In Stock</span>
                      </div>
                      <p className={cn(
                        "text-2xl font-bold",
                        product.stockQty === 0 ? "text-red-600" : "text-green-600"
                      )}>
                        {product.stockQty}
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <ShoppingCart className="w-4 h-4" />
                        <span className="text-sm">Total Sold</span>
                      </div>
                      <p className="text-2xl font-bold">{product.soldQty}</p>
                    </div>
                  </div>

                  {/* Marketplace Summary */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Marketplace Status
                    </h4>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-base">{liveMarketplaces.length} Live</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-base">{inactiveMarketplaces.length} Inactive</span>
                      </div>
                      {errorMarketplaces.length > 0 && (
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-destructive" />
                          <span className="text-base text-destructive">{errorMarketplaces.length} Error</span>
                        </div>
                      )}
                      {notListedMarketplaces.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span className="text-base text-gray-400">{notListedMarketplaces.length} Not Listed</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {(showAllMarketplaces ? product.marketplaces : product.marketplaces.slice(0, 6)).map(mp => (
                        <div 
                          key={mp.platform} 
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-md border",
                            mp.status === 'live' && "bg-green-500/10 border-green-500/30",
                            mp.status === 'inactive' && "bg-muted border-muted-foreground/20",
                            mp.status === 'error' && "bg-destructive/10 border-destructive/30",
                            mp.status === 'not_listed' && "bg-gray-500/10 border-gray-400/30"
                          )}
                        >
                          <MarketplaceLogo platform={mp.platform} size="sm" />
                          <span className={cn(
                            "text-xs font-medium",
                            mp.status === 'live' && "text-green-600",
                            mp.status === 'inactive' && "text-muted-foreground",
                            mp.status === 'error' && "text-destructive",
                            mp.status === 'not_listed' && "text-gray-400"
                          )}>
                            {mp.status === 'not_listed' ? 'Not Listed' : mp.status.charAt(0).toUpperCase() + mp.status.slice(1)}
                          </span>
                        </div>
                      ))}
                      {product.marketplaces.length > 6 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAllMarketplaces(!showAllMarketplaces)}
                          className="text-sm text-primary h-auto py-1 px-2"
                        >
                          {showAllMarketplaces 
                            ? 'Show less' 
                            : `+${product.marketplaces.length - 6} more`
                          }
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description Preview */}
                <div className="col-span-2 mt-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-primary" />
                    Content Preview
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-muted-foreground text-sm">Description & A+ Content</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setActiveTab('content')}
                        className="text-xs h-7"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit Content
                      </Button>
                    </div>
                    {description ? (
                      <p className="text-sm line-clamp-2">{description}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No description set. Click Edit Content to add.</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Pricing & Inventory Tab */}
            <TabsContent value="pricing" className="mt-0 p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Pricing */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Pricing
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                    <div>
                      <Label className="text-muted-foreground text-sm">Sale Price</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editedProduct.salePrice || ''}
                          onChange={(e) => updateField('salePrice', parseFloat(e.target.value))}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-2xl font-bold mt-1">{formatCurrency(product.salePrice)}</p>
                      )}
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">MSRP</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={msrp || ''}
                          onChange={(e) => setMsrp(parseFloat(e.target.value) || 0)}
                          className="mt-1"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Discount %</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={discountPercent || ''}
                          onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                          className="mt-1"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">BuyBox Min Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={buyBoxMinPrice || ''}
                          onChange={(e) => setBuyBoxMinPrice(parseFloat(e.target.value) || 0)}
                          className="mt-1"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">BuyBox Max Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={buyBoxMaxPrice || ''}
                          onChange={(e) => setBuyBoxMaxPrice(parseFloat(e.target.value) || 0)}
                          className="mt-1"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">Landed Cost</Label>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editedProduct.landedCost || ''}
                            onChange={(e) => updateField('landedCost', parseFloat(e.target.value))}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-base font-medium mt-1">{formatCurrency(product.landedCost)}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Shipping Cost</Label>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editedProduct.shippingCost || ''}
                            onChange={(e) => updateField('shippingCost', parseFloat(e.target.value))}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-base font-medium mt-1">{formatCurrency(product.shippingCost)}</p>
                        )}
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">Gross Profit</Label>
                        <p className={cn(
                          "text-base font-bold mt-1",
                          product.grossProfitAmount > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatCurrency(product.grossProfitAmount)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Profit Margin</Label>
                        <p className={cn(
                          "text-base font-bold mt-1",
                          product.grossProfitPercent > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {product.grossProfitPercent}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inventory */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Inventory
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">In Stock</Label>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editedProduct.stockQty || ''}
                            onChange={(e) => updateField('stockQty', parseInt(e.target.value))}
                            className="mt-1"
                          />
                        ) : (
                          <p className={cn(
                            "text-2xl font-bold mt-1",
                            product.stockQty === 0 ? "text-red-600" : "text-green-600"
                          )}>
                            {product.stockQty}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Purchased</Label>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editedProduct.purchaseQty || ''}
                            onChange={(e) => updateField('purchaseQty', parseInt(e.target.value))}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-2xl font-bold mt-1">{product.purchaseQty}</p>
                        )}
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4" />
                          Total Sold
                        </Label>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editedProduct.soldQty || ''}
                            onChange={(e) => updateField('soldQty', parseInt(e.target.value))}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-base font-medium mt-1">{product.soldQty}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm flex items-center gap-2">
                          <RotateCcw className="w-4 h-4" />
                          Returns
                        </Label>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editedProduct.returnQty || ''}
                            onChange={(e) => updateField('returnQty', parseInt(e.target.value))}
                            className="mt-1"
                          />
                        ) : (
                          <p className={cn(
                            "text-base font-medium mt-1",
                            product.returnQty > 0 && "text-orange-600"
                          )}>
                            {product.returnQty}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Identifiers Tab */}
            <TabsContent value="identifiers" className="mt-0 p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Barcode className="w-5 h-5 text-primary" />
                  Product Identifiers
                </h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">Product ID</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm bg-muted px-2 py-1 rounded">{product.productId}</code>
                          <CopyButton value={product.productId} />
                        </div>
                      </div>
                      {product.variationId && (
                        <div>
                          <Label className="text-muted-foreground text-sm">Variation ID</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">{product.variationId}</code>
                            <CopyButton value={product.variationId} />
                          </div>
                        </div>
                      )}
                      <div>
                        <Label className="text-muted-foreground text-sm">ASIN (Amazon)</Label>
                        {isEditing ? (
                          <Input
                            value={editedProduct.asin || ''}
                            onChange={(e) => updateField('asin', e.target.value)}
                            className="mt-1"
                            placeholder="B0XXXXXXXX"
                          />
                        ) : product.asin ? (
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm bg-muted px-2 py-1 rounded">{product.asin}</code>
                            <CopyButton value={product.asin} />
                          </div>
                        ) : (
                          <p className="text-base text-muted-foreground mt-1">—</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">FNSKU (Amazon FBA)</Label>
                        {isEditing ? (
                          <Input
                            value={editedProduct.fnsku || ''}
                            onChange={(e) => updateField('fnsku', e.target.value)}
                            className="mt-1"
                            placeholder="X0XXXXXXXX"
                          />
                        ) : product.fnsku ? (
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm bg-muted px-2 py-1 rounded">{product.fnsku}</code>
                            <CopyButton value={product.fnsku} />
                          </div>
                        ) : (
                          <p className="text-base text-muted-foreground mt-1">—</p>
                        )}
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">GTIN</Label>
                        {isEditing ? (
                          <Input
                            value={editedProduct.gtin || ''}
                            onChange={(e) => updateField('gtin', e.target.value)}
                            className="mt-1"
                            placeholder="Enter GTIN"
                          />
                        ) : product.gtin ? (
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm bg-muted px-2 py-1 rounded">{product.gtin}</code>
                            <CopyButton value={product.gtin} />
                          </div>
                        ) : (
                          <p className="text-base text-muted-foreground mt-1">—</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">EAN</Label>
                        {isEditing ? (
                          <Input
                            value={editedProduct.ean || ''}
                            onChange={(e) => updateField('ean', e.target.value)}
                            className="mt-1"
                            placeholder="Enter EAN"
                          />
                        ) : product.ean ? (
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm bg-muted px-2 py-1 rounded">{product.ean}</code>
                            <CopyButton value={product.ean} />
                          </div>
                        ) : (
                          <p className="text-base text-muted-foreground mt-1">—</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">ISBN</Label>
                        {isEditing ? (
                          <Input
                            value={editedProduct.isbn || ''}
                            onChange={(e) => updateField('isbn', e.target.value)}
                            className="mt-1"
                            placeholder="Enter ISBN"
                          />
                        ) : product.isbn ? (
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm bg-muted px-2 py-1 rounded">{product.isbn}</code>
                            <CopyButton value={product.isbn} />
                          </div>
                        ) : (
                          <p className="text-base text-muted-foreground mt-1">—</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Marketplaces Tab */}
            <TabsContent value="marketplaces" className="mt-0">
              <div className="space-y-0">
                <h3 className="sr-only">Marketplace Management</h3>

                {/* Summary Bar with Icons */}
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center gap-8 flex-wrap border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-700 rounded-lg">
                      <Package className="w-4 h-4 text-slate-300" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">SKU</p>
                      <p className="font-mono font-medium text-sm">{product.vendorSku}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-700 rounded-lg">
                      <Barcode className="w-4 h-4 text-slate-300" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Product ID</p>
                      <p className="font-mono font-medium text-sm">{product.productId}</p>
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
                      <p className="font-medium text-sm">{product.stockQty} units</p>
                    </div>
                  </div>
                  
                  {/* Status Counts */}
                  <div className="ml-auto flex items-center gap-2">
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
                      {liveMarketplaces.length} Live
                    </Badge>
                    {inactiveMarketplaces.length > 0 && (
                      <Badge variant="secondary" className="px-3 py-1 gap-1.5 bg-slate-600 text-slate-200">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        {inactiveMarketplaces.length} Inactive
                      </Badge>
                    )}
                    {notListedMarketplaces.length > 0 && (
                      <Badge variant="outline" className="px-3 py-1 gap-1.5 border-slate-500 text-slate-300 border-dashed">
                        {notListedMarketplaces.length} Not Listed
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-800 border-b border-slate-700">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">Marketplace</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Platform where product is listed</TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">Sold</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Total units sold on this marketplace</TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">Revenue</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Total revenue from this marketplace</TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">MSRP</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Manufacturer's Suggested Retail Price (editable)</TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">Discount</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Discount percentage from MSRP (editable)</TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">Sale Price</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Current selling price (editable)</TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">Price Sync</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Auto-sync price changes across marketplaces</TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">Stock</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Current stock level (editable)</TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">Inv Sync</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Auto-sync inventory across marketplaces</TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">Actions</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Unlink or remove from marketplace</TooltipContent>
                          </Tooltip>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-slate-900">
                      {allMarketplaceData.map((mp) => {
                        const msrpPrice = msrp || product.salePrice * 1.2;
                        const revenue = mp.soldQty * product.salePrice;
                        const currentStock = mp.status === 'live' ? product.stockQty : 0;
                        
                          return (
                            <tr 
                              key={mp.platform} 
                              className={cn(
                                "border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors",
                                mp.status === 'not_listed' && "opacity-60"
                              )}
                            >
                              {/* Marketplace */}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {canPublish(mp.status) && (
                                    <Checkbox
                                      checked={selectedForPublish.includes(mp.platform)}
                                      onCheckedChange={() => handleTogglePublishSelect(mp.platform)}
                                      className="border-slate-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                    />
                                  )}
                                  <MarketplaceLogo platform={mp.platform} size="md" />
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-xs px-2 py-0.5",
                                      mp.status === 'live' && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                                      mp.status === 'inactive' && "bg-slate-600 text-slate-300 border-slate-500",
                                      mp.status === 'error' && "bg-red-500/20 text-red-400 border-red-500/30",
                                      mp.status === 'not_listed' && "bg-transparent text-slate-500 border-slate-600 border-dashed"
                                    )}
                                  >
                                    {mp.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />}
                                    {mp.status === 'not_listed' ? 'Not Listed' : mp.status.charAt(0).toUpperCase() + mp.status.slice(1)}
                                  </Badge>
                                </div>
                              </td>
                              
                              {mp.status === 'not_listed' ? (
                                <>
                                  <td className="px-4 py-3 text-center text-slate-600">—</td>
                                  <td className="px-4 py-3 text-center text-slate-600">—</td>
                                  <td className="px-4 py-3 text-center text-slate-600">—</td>
                                  <td className="px-4 py-3 text-center text-slate-600">—</td>
                                  <td className="px-4 py-3 text-center text-slate-600">—</td>
                                  <td className="px-4 py-3 text-center text-slate-600">—</td>
                                  <td className="px-4 py-3 text-center text-slate-600">—</td>
                                  <td className="px-4 py-3 text-center text-slate-600">—</td>
                                  <td className="px-4 py-3 text-center">
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
                                  </td>
                                </>
                              ) : (
                                <>
                                  {/* Sold */}
                                  <td className="px-4 py-3 text-center">
                                    <div>
                                      <span className="text-lg font-bold text-white">{mp.soldQty}</span>
                                      <p className="text-[10px] text-slate-500">units</p>
                                    </div>
                                  </td>
                                  
                                  {/* Revenue */}
                                  <td className="px-4 py-3 text-center">
                                    <span className="text-base font-semibold text-emerald-400">{formatCurrency(revenue)}</span>
                                  </td>
                                  
                                  {/* MSRP Price - Editable */}
                                  <td className="px-4 py-3 text-center">
                                    <div className="relative inline-flex items-center">
                                      <span className="absolute left-2 text-slate-400 text-sm">$</span>
                                      <Input
                                        type="number"
                                        defaultValue={msrpPrice}
                                        onChange={handleMarketplaceFieldChange}
                                        className="w-24 h-8 text-center pl-5 bg-slate-800 border-slate-600 text-white font-semibold"
                                      />
                                    </div>
                                  </td>
                                  
                                  {/* Discount - Editable */}
                                  <td className="px-4 py-3 text-center">
                                    <div className="relative inline-flex items-center">
                                      <Input
                                        type="number"
                                        defaultValue={Math.round((1 - product.salePrice / msrpPrice) * 100)}
                                        onChange={handleMarketplaceFieldChange}
                                        className="w-16 h-8 text-center bg-slate-800 border-amber-500/50 text-amber-400 font-semibold"
                                      />
                                      <span className="absolute right-2 text-amber-400 text-sm">%</span>
                                    </div>
                                  </td>
                                  
                                  {/* Sale Price - Editable */}
                                  <td className="px-4 py-3 text-center">
                                    <div className="relative inline-flex items-center">
                                      <span className="absolute left-2 text-slate-400 text-sm">$</span>
                                      <Input
                                        type="number"
                                        defaultValue={product.salePrice}
                                        onChange={handleMarketplaceFieldChange}
                                        className="w-24 h-8 text-center pl-5 bg-slate-800 border-emerald-500/50 text-white font-semibold"
                                      />
                                    </div>
                                  </td>
                                  
                                  {/* Price Sync */}
                                  <td className="px-4 py-3 text-center">
                                    <Switch 
                                      defaultChecked={mp.priceSync}
                                      className="data-[state=checked]:bg-emerald-500"
                                    />
                                  </td>
                                  
                                  {/* Stock - Editable */}
                                  <td className="px-4 py-3 text-center">
                                    <Input
                                      type="number"
                                      defaultValue={currentStock}
                                      onChange={handleMarketplaceFieldChange}
                                      className="w-16 h-8 text-center bg-slate-800 border-slate-600 text-white font-semibold mx-auto"
                                    />
                                  </td>
                                  
                                  {/* Inventory Sync */}
                                  <td className="px-4 py-3 text-center">
                                    <Switch 
                                      defaultChecked={mp.invSync}
                                      className="data-[state=checked]:bg-emerald-500"
                                    />
                                  </td>
                                  
                                  {/* Actions */}
                                  <td className="px-4 py-3 text-center">
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
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* Publish / Re-publish Products */}
                <div className="px-6 py-4 bg-slate-900 border-t border-slate-700">
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

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-900 border-t border-slate-700 flex justify-end gap-3">
                  <Button variant="outline" className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700">
                    Cancel
                  </Button>
                  <Button 
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={handleMarketplaceSaveChanges}
                  >
                    Save Changes
                  </Button>
                </div>

                {/* Marketplace Selection Dialog for Syncing Changes */}
                <MarketplaceSelectionDialog
                  open={showSyncDialog}
                  onOpenChange={setShowSyncDialog}
                  title="Update Live Marketplaces"
                  description="You have unsaved changes. Select which live marketplaces to update with these changes."
                  marketplaces={liveMarketplaces.map(mp => ({ 
                    platform: mp.platform, 
                    label: mp.platform, 
                    status: mp.status 
                  }))}
                  onConfirm={handleSyncConfirm}
                  confirmLabel="Update"
                  isLoading={isUpdatingMarketplaces}
                  mode="sync"
                />
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="mt-0 p-6">
              <div className="space-y-6">
                {/* Product Title */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Type className="w-5 h-5 text-primary" />
                    Product Title
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <Input
                      value={productTitle || product.name}
                      onChange={(e) => setProductTitle(e.target.value)}
                      placeholder="Enter product title..."
                      className="text-lg"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      The main title displayed on marketplace listings.
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Product Description
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter a detailed product description..."
                      className="min-h-[120px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Write a compelling description that highlights key features and benefits.
                    </p>
                  </div>
                </div>

                {/* Bullet Points */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <List className="w-5 h-5 text-primary" />
                    Bullet Points
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    {bulletPoints.map((bullet, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center shrink-0">
                          {index + 1}
                        </Badge>
                        <Input
                          value={bullet}
                          onChange={(e) => {
                            const newBullets = [...bulletPoints];
                            newBullets[index] = e.target.value;
                            setBulletPoints(newBullets);
                          }}
                          placeholder={`Bullet point ${index + 1}...`}
                        />
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Use bullet points to highlight key product features. Most marketplaces support 5 bullet points.
                    </p>
                  </div>
                </div>

                {/* A+ Content */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    A+ Content
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <APlusContentEditor
                      value={aplusContent}
                      onChange={setAplusContent}
                      batchItemId={product.id}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Product Options Tab */}
            <TabsContent value="options" className="mt-0 p-6">
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-foreground text-background px-4 py-3 rounded-t-lg -mx-6 -mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">PRODUCT OPTIONS</h3>
                    <span className="text-sm opacity-80">({productOptions.length} OPTIONS, {variationData.length} VARIATIONS)</span>
                  </div>
                </div>

                {productOptions.length > 0 && (
                  <div className="space-y-6">
                    {/* Option Tabs */}
                    {productOptions.length > 1 && (
                      <div className="flex gap-2 flex-wrap">
                        {productOptions.map((opt, idx) => (
                          <Button
                            key={idx}
                            variant={selectedOptionIndex === idx ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedOptionIndex(idx)}
                          >
                            {opt.name}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Current Option Editor */}
                    <div className="grid grid-cols-[1fr_auto] gap-8">
                      <div className="space-y-4">
                        {/* Option Name */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            Option Name
                            <span className="text-muted-foreground text-xs">ⓘ</span>
                          </Label>
                          <Select
                            value={productOptions[selectedOptionIndex]?.name || 'color'}
                            onValueChange={(val) => updateOptionSettings('name', val)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="color">color</SelectItem>
                              <SelectItem value="size">size</SelectItem>
                              <SelectItem value="style">style</SelectItem>
                              <SelectItem value="material">material</SelectItem>
                              <SelectItem value="pattern">pattern</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Option Choices */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            Option Choices
                            <span className="text-muted-foreground text-xs">ⓘ</span>
                          </Label>
                          <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[60px] bg-background">
                            {productOptions[selectedOptionIndex]?.choices.map((choice, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="px-3 py-1.5 gap-2 text-sm"
                              >
                                <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                                {choice}
                                <button
                                  onClick={() => removeOptionChoice(idx)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                            <Input
                              value={newOptionChoice}
                              onChange={(e) => setNewOptionChoice(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && addOptionChoice()}
                              placeholder="Type and press Enter..."
                              className="border-0 shadow-none w-40 h-8 focus-visible:ring-0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right Side Controls */}
                      <div className="space-y-4">
                        <Button variant="outline" className="gap-2">
                          <Image className="w-4 h-4" />
                          Link Images
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProductOption(selectedOptionIndex)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>

                        {/* Display As */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1 text-sm">
                            Display As
                            <span className="text-muted-foreground text-xs">ⓘ</span>
                          </Label>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant={productOptions[selectedOptionIndex]?.displayAs === 'list' ? 'default' : 'outline'}
                              onClick={() => updateOptionSettings('displayAs', 'list')}
                              className="gap-1"
                            >
                              <List className="w-3 h-3" />
                              List
                            </Button>
                            <Button
                              size="sm"
                              variant={productOptions[selectedOptionIndex]?.displayAs === 'color' ? 'default' : 'outline'}
                              onClick={() => updateOptionSettings('displayAs', 'color')}
                              className="gap-1"
                            >
                              <Palette className="w-3 h-3" />
                              Color
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={addProductOption} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Option
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="gap-2"
                    onClick={() => setShowManageOptionsDialog(true)}
                  >
                    <Settings2 className="w-4 h-4" />
                    Manage Options
                  </Button>
                </div>

                {/* Manage Options Dialog */}
                <ManageOptionsDialog
                  open={showManageOptionsDialog}
                  onOpenChange={setShowManageOptionsDialog}
                  options={productOptions}
                  onOptionsChange={setProductOptions}
                  variationCount={variationData.length}
                />

                {/* Variation Settings Editor - Show when there are variations */}
                {variationData.length > 0 && (
                  <div className="mt-6">
                    <VariationSettingsEditor
                      variations={variationData}
                      onUpdateVariation={handleUpdateVariation}
                      productName={product.name}
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Extra Attributes Tab */}
            <TabsContent value="extra" className="mt-0">
              <div className="space-y-0">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold tracking-wide">EXTRA PRODUCT ATTRIBUTES</h3>
                    <span className="text-sm text-slate-300">({extraAttributes.length} ATTRIBUTES)</span>
                  </div>
                </div>

                {/* Attribute Grid */}
                <div className="p-6">
                  {extraAttributes.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Settings2 className="w-12 h-12 mx-auto mb-4 opacity-40" />
                      <p className="font-medium text-lg mb-2">No Extra Attributes</p>
                      <p className="text-sm mb-6">Add custom product attributes for marketplace requirements</p>
                      <Button onClick={addExtraAttribute} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add First Attribute
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        {extraAttributes.map((attr, index) => (
                          <div 
                            key={index} 
                            className={cn(
                              "bg-card border rounded-lg overflow-hidden transition-all hover:shadow-md group",
                              "hover:border-primary/50"
                            )}
                          >
                            {/* Card Header */}
                            <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <Input
                                  value={attr.name}
                                  onChange={(e) => updateExtraAttribute(index, 'name', e.target.value)}
                                  placeholder="Attribute Name"
                                  className="border-0 p-0 h-auto font-medium text-sm bg-transparent focus-visible:ring-0 truncate"
                                />
                              </div>
                              <div className="flex items-center gap-2 ml-2 shrink-0">
                                <button
                                  onClick={() => updateExtraAttribute(index, 'type', attr.type === 'text' ? 'number' : 'text')}
                                  className={cn(
                                    "w-6 h-6 rounded flex items-center justify-center transition-colors",
                                    attr.type === 'number' 
                                      ? "bg-primary/10 text-primary" 
                                      : "bg-muted text-muted-foreground hover:text-foreground"
                                  )}
                                  title={attr.type === 'text' ? 'Text Field' : 'Number Field'}
                                >
                                  {attr.type === 'number' ? (
                                    <Hash className="w-3.5 h-3.5" />
                                  ) : (
                                    <Type className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => removeExtraAttribute(index)}
                                  className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                  title="Remove Attribute"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Card Value */}
                            <div className="px-4 py-3 min-h-[52px]">
                              <Input
                                value={attr.value}
                                onChange={(e) => updateExtraAttribute(index, 'value', e.target.value)}
                                placeholder="Enter value..."
                                type={attr.type === 'number' ? 'number' : 'text'}
                                className={cn(
                                  "border-0 p-0 h-auto bg-transparent focus-visible:ring-0 text-base",
                                  attr.type === 'number' && attr.value && "text-primary font-semibold",
                                  !attr.value && "text-muted-foreground italic"
                                )}
                              />
                            </div>
                          </div>
                        ))}

                        {/* Add New Attribute Card */}
                        <button
                          onClick={addExtraAttribute}
                          className="bg-card border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all min-h-[100px]"
                        >
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Plus className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-medium">Add Attribute</span>
                        </button>
                      </div>

                      <p className="text-xs text-muted-foreground text-center">
                        Click on any field to edit. Use the type icon to toggle between text (A) and number (#) fields.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tags Tab */}
            <TabsContent value="tags" className="mt-0 p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TagIcon className="w-5 h-5 text-primary" />
                  Product Tags
                </h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  {/* Current Tags */}
                  <div className="mb-4">
                    <Label className="text-muted-foreground text-sm">Current Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {productTags.length > 0 ? (
                        productTags.map(tag => (
                          <TagBadge key={tag.id} tag={tag} size="md" />
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">No tags assigned</p>
                      )}
                    </div>
                  </div>

                  {/* Available Tags */}
                  {tags.length > 0 && onToggleProductTag && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <Label className="text-muted-foreground text-sm">Manage Tags</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {tags.map(tag => {
                            const isAssigned = productTags.some(t => t.id === tag.id);
                            return (
                              <div
                                key={tag.id}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                                  isAssigned 
                                    ? "bg-primary/10 border-primary" 
                                    : "hover:bg-muted"
                                )}
                                onClick={() => onToggleProductTag(product.id, tag.id)}
                              >
                                <Checkbox checked={isAssigned} />
                                <span
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{ backgroundColor: tag.color }}
                                />
                                <span className="text-sm">{tag.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}