import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Product } from '@/types/product';
import { MarketplaceCompact } from '@/components/products/MarketplaceCompact';
import { MarketplaceLogo } from '@/components/products/MarketplaceLogo';
import { MarketplaceSelectionDialog } from '@/components/products/MarketplaceSelectionDialog';
import { TagBadge } from '@/components/products/TagBadge';
import { CopyButton } from '@/components/products/CopyButton';
import { EditableCombobox } from '@/components/products/EditableCombobox';
import { useTags } from '@/hooks/useTags';
import { APlusContentEditor } from '@/components/batches/APlusContentEditor';
import { VariationSettingsEditor } from '@/components/products/VariationSettingsEditor';
import { ManageOptionsDialog } from '@/components/products/ManageOptionsDialog';
import { TagDialog } from '@/components/products/TagDialog';
import { MultiIdentifierField } from '@/components/products/MultiIdentifierField';
import { KitMappingDialog } from '@/components/products/KitMappingDialog';
import { Tag } from '@/types/tag';
import { KitComponent, ProductType } from '@/types/product';
import { mockProducts } from '@/data/mockProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  ArrowLeft,
  Video,
  Play,
  ChevronRight,
  Warehouse,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';

export default function ProductCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isKitMode = searchParams.get('type') === 'kit';
  
  // Use the tags hook for tag management
  const { tags, addTag, toggleProductTag } = useTags();
  
  // State for tag dialog
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  
  // Kit product state
  const [productType, setProductType] = useState<ProductType>(isKitMode ? 'kit' : 'single');
  const [kitComponents, setKitComponents] = useState<KitComponent[]>([]);
  const [showKitMappingDialog, setShowKitMappingDialog] = useState(false);
  
  // Generate a temporary product ID for the new product
  const tempProductId = useMemo(() => `new-${Date.now()}`, []);

  // Available brands and vendors (could be loaded from API/localStorage)
  const [availableBrands, setAvailableBrands] = useState<string[]>(() => {
    const stored = localStorage.getItem('product-brands');
    const defaults = ['HyperX', 'Logitech', 'Razer', 'Corsair', 'SteelSeries', 'Sony', 'Microsoft', 'Samsung', 'Apple', 'Dell'];
    return stored ? [...new Set([...defaults, ...JSON.parse(stored)])] : defaults;
  });
  
  const [availableVendors, setAvailableVendors] = useState<string[]>(() => {
    const stored = localStorage.getItem('product-vendors');
    const defaults = ['GameStop Distribution', 'Tech Direct', 'Global Supplies', 'Prime Wholesale', 'Direct Import Co'];
    return stored ? [...new Set([...defaults, ...JSON.parse(stored)])] : defaults;
  });

  // Product form state
  const [productData, setProductData] = useState<Partial<Product>>({
    name: '',
    brand: '',
    vendorSku: '',
    vendorName: '',
    manufacturerPart: '',
    salePrice: 0,
    landedCost: 0,
    shippingCost: 0,
    stockQty: 0,
    purchaseQty: 0,
    soldQty: 0,
    returnQty: 0,
    asin: '',
    fnsku: '',
    gtin: '',
    ean: '',
    isbn: '',
  });
  
  const [activeTab, setActiveTab] = useState('overview');
  const [description, setDescription] = useState('');
  const [bulletPoints, setBulletPoints] = useState<string[]>(['', '', '', '', '']);
  const [aplusContent, setAplusContent] = useState('');
  const [productTitle, setProductTitle] = useState('');
  
  // Pricing & Inventory fields
  const [msrp, setMsrp] = useState<number>(0);
  const [buyBoxMinPrice, setBuyBoxMinPrice] = useState<number>(0);
  const [buyBoxMaxPrice, setBuyBoxMaxPrice] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  
  // Multi-value identifiers state
  const [multiSkus, setMultiSkus] = useState<string[]>(['']);
  const [multiAsins, setMultiAsins] = useState<string[]>(['']);
  const [multiFnskus, setMultiFnskus] = useState<string[]>(['']);
  const [multiUpcs, setMultiUpcs] = useState<string[]>(['']);
  const [multiGtins, setMultiGtins] = useState<string[]>(['']);
  const [multiEans, setMultiEans] = useState<string[]>(['']);
  const [multiIsbns, setMultiIsbns] = useState<string[]>(['']);
  
  // Extra Attributes
  const [extraAttributes, setExtraAttributes] = useState<{ name: string; value: string; type: 'text' | 'number' }[]>([]);
  
  // Product Options
  const [productOptions, setProductOptions] = useState<{ 
    name: string; 
    choices: string[]; 
    displayAs: 'list' | 'color';
    linkImages: boolean;
  }[]>([]);
  
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
    multiSkus?: string[];
    multiAsins?: string[];
    multiFnskus?: string[];
    multiUpcs?: string[];
    multiGtins?: string[];
    weight?: number;
    weightUnit?: string;
    weightPerQty?: { qty: number; weight: number }[];
    height?: number;
    width?: number;
    length?: number;
    dimensionsPerQty?: { qty: number; height: number; width: number; length: number }[];
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
    extraAttributes?: { name: string; value: string; type?: 'text' | 'number' }[];
  }>>([]);
  
  const [newOptionChoice, setNewOptionChoice] = useState('');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [showManageOptionsDialog, setShowManageOptionsDialog] = useState(false);
  const [productMedia, setProductMedia] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [draggedMediaIndex, setDraggedMediaIndex] = useState<number | null>(null);

  // Marketplace state
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);
  const allPlatforms = [
    'amazon', 'walmart', 'ebay', 'newegg', 'bestbuy', 'target', 
    'etsy', 'shopify', 'temu', 'macys', 'costco', 'homedepot', 
    'lowes', 'wayfair', 'overstock'
  ];

  // Generate variation data from product options choices (cartesian product)
  useEffect(() => {
    if (productOptions.length > 0 && productOptions.some(opt => opt.choices.length > 0)) {
      // Get all option arrays with their choices
      const optionArrays = productOptions
        .filter(opt => opt.choices.length > 0)
        .map(opt => ({ name: opt.name, choices: opt.choices }));
      
      if (optionArrays.length === 0) {
        setVariationData([]);
        return;
      }
      
      // Generate cartesian product of all choices
      const generateCombinations = (arrays: { name: string; choices: string[] }[]): { name: string; attributes: Record<string, string> }[] => {
        if (arrays.length === 0) return [];
        if (arrays.length === 1) {
          return arrays[0].choices.map(choice => ({
            name: choice,
            attributes: { [arrays[0].name]: choice }
          }));
        }
        
        const result: { name: string; attributes: Record<string, string> }[] = [];
        const [first, ...rest] = arrays;
        const restCombinations = generateCombinations(rest);
        
        for (const choice of first.choices) {
          for (const combo of restCombinations) {
            result.push({
              name: `${choice} - ${combo.name}`,
              attributes: { [first.name]: choice, ...combo.attributes }
            });
          }
        }
        
        return result;
      };
      
      const combinations = generateCombinations(optionArrays);
      
      const variations = combinations.map((combo, idx) => ({
        id: `var-${idx}`,
        name: combo.name,
        sku: productData.vendorSku 
          ? `${productData.vendorSku}-${combo.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 12).toUpperCase()}`
          : `NEW-${combo.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 12).toUpperCase()}`,
        upc: '',
        asin: '',
        fnsku: '',
        availableStock: 0,
        quantityAllocated: 0,
        onHandQty: 0,
        salePrice: productData.salePrice || 0,
        profitMargin: 0,
        // Store variation attributes
        color: combo.attributes['color'] || '',
        size: combo.attributes['size'] || '',
        material: combo.attributes['material'] || '',
        style: combo.attributes['style'] || '',
        pattern: combo.attributes['pattern'] || '',
      }));
      
      setVariationData(variations);
    } else {
      setVariationData([]);
    }
  }, [productOptions, productData.vendorSku, productData.salePrice]);

  // Helper to detect if URL is a video
  const isVideoUrl = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext)) || 
           lowerUrl.includes('video') ||
           (lowerUrl.startsWith('data:video/'));
  };

  // Count images and videos
  const imageCount = productMedia.filter(m => m.type === 'image').length;
  const videoCount = productMedia.filter(m => m.type === 'video').length;

  // Track if form has content
  const hasContent = useMemo(() => {
    return !!(
      productData.name ||
      productData.brand ||
      productData.vendorSku ||
      productData.vendorName ||
      productData.salePrice ||
      description ||
      productTitle ||
      bulletPoints.some(bp => bp.trim()) ||
      productMedia.length > 0
    );
  }, [productData, description, productTitle, bulletPoints, productMedia]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleSave = () => {
    if (!productData.name?.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!productData.vendorSku?.trim()) {
      toast.error('SKU is required');
      return;
    }
    toast.success('Product created successfully');
    navigate('/');
  };

  const handleSaveAndList = () => {
    if (!productData.name?.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!productData.vendorSku?.trim()) {
      toast.error('SKU is required');
      return;
    }
    toast.success('Product created and listed successfully');
    navigate('/');
  };

  const handleCancel = () => {
    if (hasContent) {
      if (confirm('Are you sure you want to discard your changes?')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  // Add new brand to the list
  const handleAddBrand = (name: string) => {
    const updated = [...new Set([...availableBrands, name])];
    setAvailableBrands(updated);
    localStorage.setItem('product-brands', JSON.stringify(updated));
  };

  // Add new vendor to the list
  const handleAddVendor = (name: string, details?: string) => {
    const updated = [...new Set([...availableVendors, name])];
    setAvailableVendors(updated);
    localStorage.setItem('product-vendors', JSON.stringify(updated));
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

  const updateField = (field: keyof Product, value: string | number) => {
    setProductData(prev => ({ ...prev, [field]: value }));
  };

  // Handler to update a specific variation
  const handleUpdateVariation = useCallback((index: number, data: Partial<typeof variationData[0]>) => {
    setVariationData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...data };
      return updated;
    });
  }, []);

  // Media handlers
  const handleAddMedia = () => {
    if (!newMediaUrl.trim()) return;
    const isVideo = isVideoUrl(newMediaUrl);
    setProductMedia(prev => [...prev, { url: newMediaUrl, type: isVideo ? 'video' : 'image' }]);
    setNewMediaUrl('');
  };

  const handleRemoveMedia = (index: number) => {
    setProductMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    setDraggedMediaIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedMediaIndex === null || draggedMediaIndex === index) return;
    
    setProductMedia(prev => {
      const updated = [...prev];
      const [removed] = updated.splice(draggedMediaIndex, 1);
      updated.splice(index, 0, removed);
      return updated;
    });
    setDraggedMediaIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedMediaIndex(null);
  };

  // Bullet point handlers
  const addBulletPoint = () => {
    setBulletPoints(prev => [...prev, '']);
  };

  const removeBulletPoint = (index: number) => {
    setBulletPoints(prev => prev.filter((_, i) => i !== index));
  };

  const updateBulletPoint = (index: number, value: string) => {
    setBulletPoints(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  // Calculate gross profit
  const grossProfit = (productData.salePrice || 0) - (productData.landedCost || 0) - (productData.shippingCost || 0);
  const grossProfitPercent = productData.salePrice ? ((grossProfit / productData.salePrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b shrink-0 bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleCancel} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-20 h-20 rounded-lg bg-muted border flex items-center justify-center">
              {productMedia.length > 0 ? (
                <img
                  src={productMedia[0].url}
                  alt="Product"
                  className="w-full h-full rounded-lg object-cover"
                />
              ) : (
                <Package className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <Input
                  value={productData.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Enter product name *"
                  className="text-2xl font-semibold h-auto py-1.5 w-[500px]"
                />
              </h1>
              <p className="mt-1.5 flex items-center gap-4 text-base text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-4 h-4" />
                  New Product
                </span>
                <Badge variant="outline" className="text-sm">Draft</Badge>
                {productType === 'kit' && (
                  <Badge variant="secondary" className="text-sm gap-1">
                    <Box className="w-3 h-3" />
                    Kit Product
                  </Badge>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button variant="outline" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={handleSaveAndList}>
              <Save className="w-4 h-4 mr-2" />
              Save & List
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs and Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="px-6 mt-3 justify-start shrink-0">
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
          <TabsTrigger value="images" className="gap-2">
            <Image className="w-4 h-4" />
            Images
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
          {productType === 'kit' && (
            <TabsTrigger value="kit-mapping" className="gap-2">
              <Box className="w-4 h-4" />
              Kit Mapping
            </TabsTrigger>
          )}
        </TabsList>

        <ScrollArea className="flex-1">
          <div className="px-6">
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
                        <div className="mt-1">
                          <EditableCombobox
                            value={productData.brand || ''}
                            onChange={(value) => updateField('brand', value)}
                            options={availableBrands}
                            onAddNew={handleAddBrand}
                            placeholder="Select brand..."
                            label="Brand"
                            addNewLabel="Add New Brand"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Vendor</Label>
                        <div className="mt-1">
                          <EditableCombobox
                            value={productData.vendorName || ''}
                            onChange={(value) => updateField('vendorName', value)}
                            options={availableVendors}
                            onAddNew={handleAddVendor}
                            placeholder="Select vendor..."
                            label="Vendor"
                            addNewLabel="Add New Vendor"
                            showDetails={true}
                            detailsLabel="Vendor Details"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">SKU *</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={productData.vendorSku || ''}
                          onChange={(e) => updateField('vendorSku', e.target.value)}
                          placeholder="Enter SKU"
                          className="flex-1"
                        />
                        <CopyButton value={productData.vendorSku || ''} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">MPN (Manufacturer Part Number)</Label>
                      <Input
                        value={productData.manufacturerPart || ''}
                        onChange={(e) => updateField('manufacturerPart', e.target.value)}
                        placeholder="Enter MPN"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Product Type */}
                  <div className="mt-6">
                    <h4 className="text-md font-medium flex items-center gap-2 mb-3">
                      <Layers className="w-4 h-4 text-primary" />
                      Product Type
                    </h4>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant={productType === 'single' ? 'default' : 'outline'}
                        className="flex-1 h-auto py-3 flex-col gap-1"
                        onClick={() => setProductType('single')}
                      >
                        <Package className="w-5 h-5" />
                        <span>Single Product</span>
                      </Button>
                      <Button
                        type="button"
                        variant={productType === 'kit' ? 'default' : 'outline'}
                        className="flex-1 h-auto py-3 flex-col gap-1"
                        onClick={() => {
                          setProductType('kit');
                          if (activeTab !== 'kit-mapping') {
                            // Optionally switch to kit mapping tab
                          }
                        }}
                      >
                        <Box className="w-5 h-5" />
                        <span>Kit Product</span>
                      </Button>
                    </div>
                    {productType === 'kit' && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Kit products bundle multiple products together. Configure components in the Kit Mapping tab.
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Quick Stats
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">Sale Price</span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        value={productData.salePrice || ''}
                        onChange={(e) => updateField('salePrice', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="text-xl font-bold h-auto py-1 bg-transparent border-0 border-b border-dashed border-muted-foreground/30 rounded-none focus-visible:ring-0 focus-visible:border-primary"
                      />
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">Profit Margin</span>
                      </div>
                      <p className={cn(
                        "text-2xl font-bold",
                        grossProfitPercent > 0 ? "text-green-600" : grossProfitPercent < 0 ? "text-red-600" : "text-muted-foreground"
                      )}>
                        {grossProfitPercent.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Layers className="w-4 h-4" />
                        <span className="text-sm">In Stock</span>
                      </div>
                      <Input
                        type="number"
                        value={productData.stockQty || ''}
                        onChange={(e) => updateField('stockQty', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="text-2xl font-bold h-auto py-1 bg-transparent border-0 border-b border-dashed border-muted-foreground/30 rounded-none focus-visible:ring-0 focus-visible:border-primary"
                      />
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Globe className="w-4 h-4" />
                        <span className="text-sm">Marketplaces</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {selectedMarketplaces.length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" />
                    Cost Breakdown
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Landed Cost</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={productData.landedCost || ''}
                        onChange={(e) => updateField('landedCost', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-24 text-right"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Shipping Cost</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={productData.shippingCost || ''}
                        onChange={(e) => updateField('shippingCost', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-24 text-right"
                      />
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center font-medium">
                      <span>Gross Profit</span>
                      <span className={cn(
                        grossProfit >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatCurrency(grossProfit)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inventory Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-primary" />
                    Inventory
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4 grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-sm">Purchase Qty</Label>
                      <Input
                        type="number"
                        value={productData.purchaseQty || ''}
                        onChange={(e) => updateField('purchaseQty', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Sold Qty</Label>
                      <Input
                        type="number"
                        value={productData.soldQty || ''}
                        onChange={(e) => updateField('soldQty', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Return Qty</Label>
                      <Input
                        type="number"
                        value={productData.returnQty || ''}
                        onChange={(e) => updateField('returnQty', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Stock Qty</Label>
                      <Input
                        type="number"
                        value={productData.stockQty || ''}
                        onChange={(e) => updateField('stockQty', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">Sale Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={productData.salePrice || ''}
                          onChange={(e) => updateField('salePrice', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">MSRP</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={msrp || ''}
                          onChange={(e) => setMsrp(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">Discount %</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={discountPercent || ''}
                          onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Landed Cost</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={productData.landedCost || ''}
                          onChange={(e) => updateField('landedCost', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">BuyBox Min Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={buyBoxMinPrice || ''}
                          onChange={(e) => setBuyBoxMinPrice(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">BuyBox Max Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={buyBoxMaxPrice || ''}
                          onChange={(e) => setBuyBoxMaxPrice(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Shipping Cost</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={productData.shippingCost || ''}
                        onChange={(e) => updateField('shippingCost', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Profit Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Profit Summary
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Sale Price</span>
                      <span className="font-medium">{formatCurrency(productData.salePrice || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">- Landed Cost</span>
                      <span className="text-red-500">{formatCurrency(productData.landedCost || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">- Shipping Cost</span>
                      <span className="text-red-500">{formatCurrency(productData.shippingCost || 0)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Gross Profit</span>
                      <span className={cn(
                        "font-bold text-lg",
                        grossProfit >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatCurrency(grossProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Profit Margin</span>
                      <span className={cn(
                        "font-bold text-lg",
                        grossProfitPercent >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {grossProfitPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inventory */}
                <div className="space-y-4 col-span-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-primary" />
                    Inventory
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4 grid grid-cols-4 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-sm">Purchase Qty</Label>
                      <Input
                        type="number"
                        value={productData.purchaseQty || ''}
                        onChange={(e) => updateField('purchaseQty', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Stock Qty</Label>
                      <Input
                        type="number"
                        value={productData.stockQty || ''}
                        onChange={(e) => updateField('stockQty', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Sold Qty</Label>
                      <Input
                        type="number"
                        value={productData.soldQty || ''}
                        onChange={(e) => updateField('soldQty', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Return Qty</Label>
                      <Input
                        type="number"
                        value={productData.returnQty || ''}
                        onChange={(e) => updateField('returnQty', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Identifiers Tab */}
            <TabsContent value="identifiers" className="mt-0 p-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Barcode className="w-5 h-5 text-primary" />
                  Product Identifiers
                </h3>
                
                {/* Internal Identifiers */}
                <Card className="p-4">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Internal Identifiers
                  </h4>
                  <div className="space-y-4">
                    <MultiIdentifierField
                      label="SKU (Stock Keeping Unit)"
                      values={multiSkus}
                      onChange={setMultiSkus}
                      placeholder="Enter SKU"
                    />
                  </div>
                </Card>

                {/* Universal Product Codes */}
                <Card className="p-4">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Universal Product Codes
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <MultiIdentifierField
                      label="UPC (Universal Product Code)"
                      values={multiUpcs}
                      onChange={setMultiUpcs}
                      placeholder="Enter UPC"
                    />
                    <MultiIdentifierField
                      label="GTIN (Global Trade Item Number)"
                      values={multiGtins}
                      onChange={setMultiGtins}
                      placeholder="Enter GTIN"
                    />
                    <MultiIdentifierField
                      label="EAN (European Article Number)"
                      values={multiEans}
                      onChange={setMultiEans}
                      placeholder="Enter EAN"
                    />
                    <MultiIdentifierField
                      label="ISBN (Book Number)"
                      values={multiIsbns}
                      onChange={setMultiIsbns}
                      placeholder="Enter ISBN"
                    />
                  </div>
                </Card>

                {/* Marketplace Identifiers */}
                <Card className="p-4">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Marketplace Identifiers
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <MultiIdentifierField
                      label="ASIN (Amazon)"
                      values={multiAsins}
                      onChange={setMultiAsins}
                      placeholder="Enter ASIN"
                    />
                    <MultiIdentifierField
                      label="FNSKU (Amazon FBA)"
                      values={multiFnskus}
                      onChange={setMultiFnskus}
                      placeholder="Enter FNSKU"
                    />
                    <div>
                      <Label className="text-sm text-muted-foreground mb-1 block">MPN (Manufacturer Part Number)</Label>
                      <Input
                        value={productData.manufacturerPart || ''}
                        onChange={(e) => updateField('manufacturerPart', e.target.value)}
                        placeholder="Enter MPN"
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Images Tab */}
            <TabsContent value="images" className="mt-0 p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Image className="w-5 h-5 text-primary" />
                    Product Media
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Image className="w-4 h-4" />
                    <span>{imageCount} images</span>
                    <Video className="w-4 h-4 ml-2" />
                    <span>{videoCount} videos</span>
                  </div>
                </div>

                {/* Add Media */}
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <Input
                      value={newMediaUrl}
                      onChange={(e) => setNewMediaUrl(e.target.value)}
                      placeholder="Enter image or video URL"
                      className="flex-1"
                    />
                    <Button onClick={handleAddMedia} disabled={!newMediaUrl.trim()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Drag and drop to reorder. First image will be the main product image.
                  </p>
                </Card>

                {/* Media Grid */}
                <div className="grid grid-cols-4 gap-4">
                  {productMedia.map((media, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "relative aspect-square rounded-lg border-2 overflow-hidden cursor-move group",
                        index === 0 ? "border-primary" : "border-border",
                        draggedMediaIndex === index && "opacity-50"
                      )}
                    >
                      {media.type === 'video' ? (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Play className="w-12 h-12 text-muted-foreground" />
                        </div>
                      ) : (
                        <img
                          src={media.url}
                          alt={`Media ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {index === 0 && (
                        <Badge className="absolute top-2 left-2" variant="secondary">
                          Main
                        </Badge>
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                        onClick={() => handleRemoveMedia(index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {productMedia.length === 0 && (
                    <div className="col-span-4 border-2 border-dashed border-border rounded-lg p-12 text-center">
                      <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No media added yet</p>
                      <p className="text-sm text-muted-foreground">Add images or videos using the field above</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Marketplaces Tab */}
            <TabsContent value="marketplaces" className="mt-0 p-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Target Marketplaces
                </h3>
                <p className="text-muted-foreground">
                  Select which marketplaces you want to list this product on.
                </p>
                
                <div className="grid grid-cols-3 gap-4">
                  {allPlatforms.map(platform => (
                    <Card 
                      key={platform}
                      className={cn(
                        "p-4 cursor-pointer transition-colors",
                        selectedMarketplaces.includes(platform) 
                          ? "border-primary bg-primary/5" 
                          : "hover:border-muted-foreground/50"
                      )}
                      onClick={() => {
                        setSelectedMarketplaces(prev => 
                          prev.includes(platform)
                            ? prev.filter(p => p !== platform)
                            : [...prev, platform]
                        );
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={selectedMarketplaces.includes(platform)}
                          onCheckedChange={() => {}}
                        />
                        <MarketplaceLogo platform={platform as any} size="sm" />
                        <span className="capitalize font-medium">{platform}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="mt-0 p-6">
              <div className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <Type className="w-5 h-5 text-primary" />
                    Product Title
                  </Label>
                  <Input
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                    placeholder="Enter product title for listings"
                    className="text-lg"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Description
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter product description..."
                    className="min-h-[150px]"
                  />
                </div>

                {/* Bullet Points */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      <List className="w-5 h-5 text-primary" />
                      Bullet Points
                    </Label>
                    <Button variant="outline" size="sm" onClick={addBulletPoint}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Point
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {bulletPoints.map((point, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-muted-foreground w-6">{index + 1}.</span>
                        <Input
                          value={point}
                          onChange={(e) => updateBulletPoint(index, e.target.value)}
                          placeholder={`Bullet point ${index + 1}`}
                          className="flex-1"
                        />
                        {bulletPoints.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBulletPoint(index)}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* A+ Content */}
                <div className="space-y-2">
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    A+ Content
                  </Label>
                  <APlusContentEditor
                    value={aplusContent}
                    onChange={setAplusContent}
                    batchItemId={tempProductId}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Product Options Tab */}
            <TabsContent value="options" className="mt-0 p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    Product Options
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowManageOptionsDialog(true)}>
                      <Settings2 className="w-4 h-4 mr-2" />
                      Manage Options
                    </Button>
                    <Button onClick={addProductOption}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                </div>

                {productOptions.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Palette className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No product options defined</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add options like size, color, or material to create product variations
                    </p>
                    <Button onClick={addProductOption}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Option
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    {/* Option List */}
                    <Card className="p-4">
                      <h4 className="font-medium mb-4">Options</h4>
                      <div className="space-y-2">
                        {productOptions.map((option, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg cursor-pointer",
                              selectedOptionIndex === index
                                ? "bg-primary/10 border border-primary"
                                : "bg-muted/30 hover:bg-muted/50"
                            )}
                            onClick={() => setSelectedOptionIndex(index)}
                          >
                            <div>
                              <p className="font-medium capitalize">{option.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {option.choices.length} choice{option.choices.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeProductOption(index);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Selected Option Details */}
                    {productOptions[selectedOptionIndex] && (
                      <Card className="p-4">
                        <h4 className="font-medium mb-4">
                          Edit: {productOptions[selectedOptionIndex].name}
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm">Option Name</Label>
                            <Select
                              value={productOptions[selectedOptionIndex].name}
                              onValueChange={(value) => updateOptionSettings('name', value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="color">Color</SelectItem>
                                <SelectItem value="size">Size</SelectItem>
                                <SelectItem value="material">Material</SelectItem>
                                <SelectItem value="style">Style</SelectItem>
                                <SelectItem value="pattern">Pattern</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-sm">Display As</Label>
                            <Select
                              value={productOptions[selectedOptionIndex].displayAs}
                              onValueChange={(value) => updateOptionSettings('displayAs', value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="list">List</SelectItem>
                                <SelectItem value="color">Color Swatches</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center gap-2">
                            <Switch
                              checked={productOptions[selectedOptionIndex].linkImages}
                              onCheckedChange={(checked) => updateOptionSettings('linkImages', checked)}
                            />
                            <Label className="text-sm">Link to Images</Label>
                          </div>

                          <Separator />

                          <div>
                            <Label className="text-sm mb-2 block">Choices</Label>
                            <div className="flex gap-2 mb-2">
                              <Input
                                value={newOptionChoice}
                                onChange={(e) => setNewOptionChoice(e.target.value)}
                                placeholder="Add new choice"
                                onKeyDown={(e) => e.key === 'Enter' && addOptionChoice()}
                              />
                              <Button onClick={addOptionChoice} disabled={!newOptionChoice.trim()}>
                                Add
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {productOptions[selectedOptionIndex].choices.map((choice, idx) => (
                                <Badge key={idx} variant="secondary" className="gap-1">
                                  {choice}
                                  <button
                                    onClick={() => removeOptionChoice(idx)}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {/* Variation Settings */}
                {variationData.length > 0 && (
                  <div className="mt-6">
                    <VariationSettingsEditor
                      productName={productData.name || 'New Product'}
                      variations={variationData}
                      onUpdateVariation={handleUpdateVariation}
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Extra Attributes Tab */}
            <TabsContent value="extra" className="mt-0 p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-primary" />
                    Extra Attributes
                  </h3>
                  <Button onClick={addExtraAttribute}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Attribute
                  </Button>
                </div>

                {extraAttributes.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Settings2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No extra attributes defined</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add custom attributes for marketplace-specific requirements
                    </p>
                    <Button onClick={addExtraAttribute}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Attribute
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {extraAttributes.map((attr, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <Input
                            value={attr.name}
                            onChange={(e) => updateExtraAttribute(index, 'name', e.target.value)}
                            placeholder="Attribute name"
                            className="font-medium border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => removeExtraAttribute(index)}
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground" />
                          </Button>
                        </div>
                        <Input
                          type={attr.type === 'number' ? 'number' : 'text'}
                          value={attr.value}
                          onChange={(e) => updateExtraAttribute(index, 'value', e.target.value)}
                          placeholder="Value"
                          className="mb-2"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant={attr.type === 'text' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="flex-1"
                            onClick={() => updateExtraAttribute(index, 'type', 'text')}
                          >
                            Text
                          </Button>
                          <Button
                            variant={attr.type === 'number' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="flex-1"
                            onClick={() => updateExtraAttribute(index, 'type', 'number')}
                          >
                            Number
                          </Button>
                        </div>
                      </Card>
                    ))}
                    <Card
                      className="p-4 border-dashed cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center min-h-[140px]"
                      onClick={addExtraAttribute}
                    >
                      <div className="text-center">
                        <Plus className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Add Attribute</p>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tags Tab */}
            <TabsContent value="tags" className="mt-0 p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TagIcon className="w-5 h-5 text-primary" />
                    Product Tags
                  </h3>
                  <Button onClick={() => setShowTagDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Manage Tags
                  </Button>
                </div>

                {selectedTags.length === 0 ? (
                  <Card className="p-12 text-center">
                    <TagIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No tags assigned</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add tags to organize and filter your products
                    </p>
                    <Button onClick={() => setShowTagDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Tags
                    </Button>
                  </Card>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                      <TagBadge
                        key={tag.id}
                        tag={tag}
                        onRemove={() => {
                          setSelectedTags(prev => prev.filter(t => t.id !== tag.id));
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Kit Mapping Tab */}
            {productType === 'kit' && (
              <TabsContent value="kit-mapping" className="mt-0 p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Box className="w-5 h-5 text-primary" />
                      Kit Components
                    </h3>
                    <Button onClick={() => setShowKitMappingDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      {kitComponents.length > 0 ? 'Edit Kit Mapping' : 'Add Products to Kit'}
                    </Button>
                  </div>

                  {kitComponents.length === 0 ? (
                    <Card className="p-12 text-center">
                      <Box className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No products in this kit</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add products to create a kit bundle
                      </p>
                      <Button onClick={() => setShowKitMappingDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Products to Kit
                      </Button>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-3">
                        {kitComponents.map((component) => {
                          const product = mockProducts.find(p => p.id === component.productId);
                          if (!product) return null;
                          return (
                            <div
                              key={component.productId}
                              className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30"
                            >
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 rounded object-cover bg-muted"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{product.name}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                                    {product.vendorSku}
                                  </code>
                                  <span>•</span>
                                  <span>{product.brand}</span>
                                </div>
                              </div>
                              <div className="text-center">
                                <Badge variant="secondary" className="text-lg px-3 py-1">
                                  ×{component.quantity}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">Quantity</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">
                                  ${(product.salePrice * component.quantity).toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ${product.salePrice.toFixed(2)} each
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                        <div>
                          <p className="font-medium">Kit Summary</p>
                          <p className="text-sm text-muted-foreground">
                            {kitComponents.length} product{kitComponents.length !== 1 ? 's' : ''} •{' '}
                            {kitComponents.reduce((sum, c) => sum + c.quantity, 0)} total items
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Component Value</p>
                          <p className="text-xl font-bold text-primary">
                            ${kitComponents
                              .reduce((sum, c) => {
                                const product = mockProducts.find(p => p.id === c.productId);
                                return sum + (product?.salePrice || 0) * c.quantity;
                              }, 0)
                              .toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </div>
        </ScrollArea>
      </Tabs>

      {/* Dialogs */}
      <ManageOptionsDialog
        open={showManageOptionsDialog}
        onOpenChange={setShowManageOptionsDialog}
        options={productOptions}
        onOptionsChange={setProductOptions}
        variationCount={variationData.length}
      />

      <TagDialog
        open={showTagDialog}
        onOpenChange={setShowTagDialog}
        onSave={(tag) => {
          setSelectedTags(prev => [...prev, tag]);
          setShowTagDialog(false);
        }}
      />

      <KitMappingDialog
        open={showKitMappingDialog}
        onOpenChange={setShowKitMappingDialog}
        products={mockProducts}
        selectedComponents={kitComponents}
        onSave={setKitComponents}
        excludeProductId={tempProductId}
      />
    </div>
  );
}
