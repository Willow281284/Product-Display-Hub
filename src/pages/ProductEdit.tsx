import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Product } from '@/types/product';
import { mockProducts } from '@/data/mockProducts';
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
import { VariationSelector } from '@/components/products/VariationSelector';
import { MultiIdentifierField } from '@/components/products/MultiIdentifierField';
import { ProductOffersTab } from '@/components/products/ProductOffersTab';
import { useOffers } from '@/hooks/useOffers';
import { getOfferStatus, formatOfferDiscount, offerStatusConfig } from '@/types/offer';
import { Tag } from '@/types/tag';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
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
  ArrowLeft,
  Video,
  Play,
  ChevronRight,
  Warehouse,
  CalendarIcon,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function ProductEdit() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  
  // Use the tags hook for tag management
  const { tags, addTag, getProductTags, toggleProductTag } = useTags();
  
  // Use the offers hook
  const { offers, getOffersForProduct } = useOffers();
  
  // State for tag dialog
  const [showTagDialog, setShowTagDialog] = useState(false);
  
  // Find the product from mock data
  const product = useMemo(() => {
    return mockProducts.find(p => p.id === productId) || null;
  }, [productId]);
  
  // Get current product's tags
  const productTags = useMemo(() => {
    if (!product) return [];
    return getProductTags(product.id);
  }, [product, getProductTags]);

  // Get offers summary for this product
  const offersSummary = useMemo(() => {
    if (!productId) return { activeOffers: 0, totalOffers: 0, totalRevenue: 0, topOffers: [] };
    
    const productOffers = offers.filter(o => o.productIds.includes(productId));
    const activeOffers = productOffers.filter(o => {
      const status = getOfferStatus(o);
      return status === 'active' || status === 'ending_soon' || status === 'just_created';
    });
    
    // Generate mock revenue for active offers
    const totalRevenue = activeOffers.reduce((sum, offer, idx) => {
      const seed = offer.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return sum + ((seed % 5000) + 500) * (idx + 1);
    }, 0);
    
    return {
      activeOffers: activeOffers.length,
      totalOffers: productOffers.length,
      totalRevenue,
      topOffers: activeOffers.slice(0, 3),
    };
  }, [offers, productId]);

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

  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Partial<Product>>({});
  const [activeTab, setActiveTab] = useState('overview');
  const [description, setDescription] = useState('');
  const [bulletPoints, setBulletPoints] = useState<string[]>(['', '', '', '', '']);
  const [aplusContent, setAplusContent] = useState('');
  const [productTitle, setProductTitle] = useState('');
  
  // Initial values for tracking changes
  const [initialDescription, setInitialDescription] = useState('');
  const [initialBulletPoints, setInitialBulletPoints] = useState<string[]>(['', '', '', '', '']);
  const [initialAplusContent, setInitialAplusContent] = useState('');
  const [initialProductTitle, setInitialProductTitle] = useState('');
  const [initialMediaCount, setInitialMediaCount] = useState(1);
  
  // Pricing & Inventory fields
  const [msrp, setMsrp] = useState<number>(0);
  const [buyBoxMinPrice, setBuyBoxMinPrice] = useState<number>(0);
  const [buyBoxMaxPrice, setBuyBoxMaxPrice] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  
  // Initial values for pricing fields
  const [initialMsrp, setInitialMsrp] = useState<number>(0);
  const [initialBuyBoxMinPrice, setInitialBuyBoxMinPrice] = useState<number>(0);
  const [initialBuyBoxMaxPrice, setInitialBuyBoxMaxPrice] = useState<number>(0);
  const [initialDiscountPercent, setInitialDiscountPercent] = useState<number>(0);
  
  // Sales Overview state
  const [salesDataPeriod, setSalesDataPeriod] = useState('30');
  const [salesCustomStartDate, setSalesCustomStartDate] = useState<Date | undefined>();
  const [salesCustomEndDate, setSalesCustomEndDate] = useState<Date | undefined>();
  
  // Revenue & Profit Summary period
  const [revenuePeriod, setRevenuePeriod] = useState('30');
  const [showAllMarketplaces, setShowAllMarketplaces] = useState(false);
  
  // Variation selection for Sales, FBA, WFS
  const [selectedSalesVariation, setSelectedSalesVariation] = useState<string>('all');
  const [selectedFbaVariation, setSelectedFbaVariation] = useState<string>('all');
  const [selectedWfsVariation, setSelectedWfsVariation] = useState<string>('all');
  
  // Multi-value identifiers state
  const [multiSkus, setMultiSkus] = useState<string[]>(['']);
  const [multiAsins, setMultiAsins] = useState<string[]>(['']);
  const [multiFnskus, setMultiFnskus] = useState<string[]>(['']);
  const [multiUpcs, setMultiUpcs] = useState<string[]>(['']);
  const [multiGtins, setMultiGtins] = useState<string[]>(['']);
  const [multiEans, setMultiEans] = useState<string[]>(['']);
  const [multiIsbns, setMultiIsbns] = useState<string[]>(['']);
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
    // Multi-value identifiers
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
  const [initialVariationData, setInitialVariationData] = useState<string>('[]');
  const [newOptionChoice, setNewOptionChoice] = useState('');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUpdatingMarketplaces, setIsUpdatingMarketplaces] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [hasMarketplaceChanges, setHasMarketplaceChanges] = useState(false);
  const [selectedForPublish, setSelectedForPublish] = useState<string[]>([]);
  const [showManageOptionsDialog, setShowManageOptionsDialog] = useState(false);
  const [productMedia, setProductMedia] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [draggedMediaIndex, setDraggedMediaIndex] = useState<number | null>(null);

  // Helper to detect if URL is a video
  const isVideoUrl = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext)) || 
           lowerUrl.includes('video') ||
           (lowerUrl.startsWith('data:video/'));
  };

  // Initialize product media from the product
  useEffect(() => {
    if (product) {
      // Initialize with the main product image
      setProductMedia([{ url: product.image, type: 'image' }]);
      setInitialMediaCount(1);
      // Initialize content fields with product name as default title
      setProductTitle(product.name);
      setInitialProductTitle(product.name);
    }
  }, [product?.id]);

  // Count images and videos

  // Count images and videos
  const imageCount = productMedia.filter(m => m.type === 'image').length;
  const videoCount = productMedia.filter(m => m.type === 'video').length;

  // All available platforms
  const allPlatforms = [
    'amazon', 'walmart', 'ebay', 'newegg', 'bestbuy', 'target', 
    'etsy', 'shopify', 'temu', 'macys', 'costco', 'homedepot', 
    'lowes', 'wayfair', 'overstock'
  ];

  // Memoize marketplace data with stable soldQty values
  const allMarketplaceData = useMemo(() => {
    if (!product) return [];
    const existingMap = new Map(product.marketplaces.map(mp => [mp.platform, mp]));
    // Use a seeded approach based on platform index for stable mock data
    return allPlatforms.map((platform, idx) => {
      const existing = existingMap.get(platform as any);
      // Generate stable mock sold qty based on platform index
      const stableSoldQty = existing?.status === 'live' ? (5 + ((idx * 7 + 13) % 30)) : 0;
      return {
        platform,
        status: existing?.status || 'not_listed',
        soldQty: stableSoldQty,
        revenue: 0,
        priceSync: existing?.status === 'live',
        invSync: existing?.status === 'live',
      };
    });
  }, [product?.id, product?.marketplaces]);

  // Memoize variation forecast data to prevent re-render changes
  const variationForecastData = useMemo(() => {
    return variationData.slice(0, 5).map((variation, idx) => {
      // Use a stable velocity based on variation index
      const velocity = 5 + ((idx * 3 + 7) % 10);
      const salesAmount = velocity * 30 * (variation.salePrice || 14.99);
      const profitAmount = salesAmount * 0.22;
      const stockDays = velocity > 0 ? (variation.availableStock || 0) / velocity : 0;
      return {
        id: variation.id,
        name: variation.name,
        velocity,
        salesAmount,
        profitAmount,
        stockDays,
      };
    });
  }, [variationData]);

  useEffect(() => {
    if (product) {
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
      
      // Initialize multi-identifiers from product data
      setMultiSkus(product.vendorSku ? [product.vendorSku] : ['']);
      setMultiAsins(product.asin ? [product.asin] : ['']);
      setMultiFnskus(product.fnsku ? [product.fnsku] : ['']);
      setMultiUpcs(['']); // UPC not in product type yet
      setMultiGtins(product.gtin ? [product.gtin] : ['']);
      setMultiEans(product.ean ? [product.ean] : ['']);
      setMultiIsbns(product.isbn ? [product.isbn] : ['']);
      
      setIsEditing(false);
      setActiveTab('overview');
    }
  }, [product]);

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
      setInitialVariationData(JSON.stringify(allChoices));
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

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const liveMarketplaces = allMarketplaceData.filter(m => m.status === 'live');
  const inactiveMarketplaces = allMarketplaceData.filter(m => m.status === 'inactive');
  const errorMarketplaces = allMarketplaceData.filter(m => m.status === 'error');
  const notListedMarketplaces = allMarketplaceData.filter(m => m.status === 'not_listed');

  // Track if any changes have been made
  const hasChanges = useMemo(() => {
    if (!product) return false;
    
    // Check basic product fields
    const basicFieldsChanged = (
      editedProduct.name !== product.name ||
      editedProduct.brand !== product.brand ||
      editedProduct.vendorName !== product.vendorName ||
      editedProduct.vendorSku !== product.vendorSku ||
      editedProduct.manufacturerPart !== product.manufacturerPart ||
      editedProduct.salePrice !== product.salePrice ||
      editedProduct.landedCost !== product.landedCost ||
      editedProduct.shippingCost !== product.shippingCost ||
      editedProduct.stockQty !== product.stockQty ||
      editedProduct.purchaseQty !== product.purchaseQty ||
      editedProduct.soldQty !== product.soldQty ||
      editedProduct.returnQty !== product.returnQty ||
      editedProduct.asin !== product.asin ||
      editedProduct.fnsku !== product.fnsku ||
      editedProduct.gtin !== product.gtin ||
      editedProduct.ean !== product.ean ||
      editedProduct.isbn !== product.isbn
    );
    
    // Check content fields
    const contentFieldsChanged = (
      description !== initialDescription ||
      productTitle !== initialProductTitle ||
      aplusContent !== initialAplusContent ||
      JSON.stringify(bulletPoints) !== JSON.stringify(initialBulletPoints) ||
      productMedia.length !== initialMediaCount
    );
    
    // Check pricing & inventory fields
    const pricingFieldsChanged = (
      msrp !== initialMsrp ||
      buyBoxMinPrice !== initialBuyBoxMinPrice ||
      buyBoxMaxPrice !== initialBuyBoxMaxPrice ||
      discountPercent !== initialDiscountPercent
    );
    
    // Check variation data changes
    const variationDataChanged = JSON.stringify(variationData) !== initialVariationData;
    
    return basicFieldsChanged || contentFieldsChanged || pricingFieldsChanged || variationDataChanged;
  }, [editedProduct, product, description, initialDescription, productTitle, initialProductTitle, 
      aplusContent, initialAplusContent, bulletPoints, initialBulletPoints, productMedia.length, initialMediaCount,
      msrp, initialMsrp, buyBoxMinPrice, initialBuyBoxMinPrice, buyBoxMaxPrice, initialBuyBoxMaxPrice, discountPercent, initialDiscountPercent,
      variationData, initialVariationData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleSave = () => {
    toast.success('Product updated successfully');
    setIsEditing(false);
  };

  const handleSaveAndList = () => {
    toast.success('Product updated and listed successfully');
    setIsEditing(false);
    // Navigate back to products list
    navigate('/');
  };

  const handleCancel = () => {
    // Reset basic product fields
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
    // Reset content fields
    setDescription(initialDescription);
    setBulletPoints([...initialBulletPoints]);
    setAplusContent(initialAplusContent);
    setProductTitle(initialProductTitle);
    setProductMedia([{ url: product.image, type: 'image' }]);
    // Reset pricing fields
    setMsrp(initialMsrp);
    setBuyBoxMinPrice(initialBuyBoxMinPrice);
    setBuyBoxMaxPrice(initialBuyBoxMaxPrice);
    setDiscountPercent(initialDiscountPercent);
    setIsEditing(false);
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

  const displayedMarketplaces = showAllMarketplaces ? allMarketplaceData : allMarketplaceData.slice(0, 6);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Same as Dialog Header */}
      <div className="px-6 py-4 border-b shrink-0 bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img
              src={product.image}
              alt={product.name}
              className="w-20 h-20 rounded-lg object-cover bg-muted border"
            />
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
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
              </h1>
              <p className="mt-1.5 flex items-center gap-4 text-base text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-4 h-4" />
                  {product.productId}
                </span>
                {product.variationId && (
                  <Badge variant="outline" className="text-sm">
                    Variation: {product.variationId}
                  </Badge>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button variant="outline" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button onClick={handleSaveAndList}>
                  <Save className="w-4 h-4 mr-2" />
                  Save & List
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs and Content - Same structure as Dialog */}
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
          <TabsTrigger value="sales" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Sales Overview
          </TabsTrigger>
          <TabsTrigger value="offers" className="gap-2">
            <TagIcon className="w-4 h-4" />
            Offers
          </TabsTrigger>
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
                            value={editedProduct.brand || ''}
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
                            value={editedProduct.vendorName || ''}
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
                      <Label className="text-muted-foreground text-sm">SKU</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={editedProduct.vendorSku || ''}
                          onChange={(e) => updateField('vendorSku', e.target.value)}
                          className="flex-1"
                        />
                        <CopyButton value={editedProduct.vendorSku || ''} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">MPN (Manufacturer Part Number)</Label>
                      <Input
                        value={editedProduct.manufacturerPart || ''}
                        onChange={(e) => updateField('manufacturerPart', e.target.value)}
                        className="mt-1"
                      />
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

                  {/* Offers Overview */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <TagIcon className="w-4 h-4" />
                        Active Offers
                      </h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setActiveTab('offers')}
                        className="text-xs h-7"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Manage Offers
                      </Button>
                    </div>
                    {offersSummary.totalOffers > 0 ? (
                      <>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="text-center p-2 bg-background rounded-lg">
                            <p className="text-xl font-bold text-primary">{offersSummary.activeOffers}</p>
                            <p className="text-xs text-muted-foreground">Active</p>
                          </div>
                          <div className="text-center p-2 bg-background rounded-lg">
                            <p className="text-xl font-bold">{offersSummary.totalOffers}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                          </div>
                          <div className="text-center p-2 bg-background rounded-lg">
                            <p className="text-xl font-bold text-emerald-600">${offersSummary.totalRevenue.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Revenue</p>
                          </div>
                        </div>
                        {offersSummary.topOffers.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground font-medium">Top Offers</p>
                            {offersSummary.topOffers.map(offer => {
                              const status = getOfferStatus(offer);
                              const statusConfig = offerStatusConfig[status];
                              return (
                                <div 
                                  key={offer.id} 
                                  className="flex items-center justify-between p-2 bg-background rounded-lg"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm font-medium truncate">{offer.name}</span>
                                    <Badge className={cn("text-xs shrink-0", statusConfig.bgColor, statusConfig.color)}>
                                      {statusConfig.label}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                    {formatOfferDiscount(offer)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <TagIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No offers for this product</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 text-xs"
                          onClick={() => setActiveTab('offers')}
                        >
                          Create an Offer
                        </Button>
                      </div>
                    )}
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
                      {displayedMarketplaces.map(mp => (
                        <div
                          key={mp.platform}
                          title={`${mp.platform} — ${mp.status === 'not_listed' ? 'Not Listed' : mp.status}`}
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-md border",
                            mp.status === 'live' && "bg-green-500/10 border-green-500/30",
                            mp.status === 'inactive' && "bg-muted border-muted-foreground/20",
                            mp.status === 'error' && "bg-destructive/10 border-destructive/30",
                            mp.status === 'not_listed' && "bg-gray-500/10 border-gray-400/30"
                          )}
                        >
                          <MarketplaceLogo platform={mp.platform} size="sm" />
                          <span className="text-xs font-medium text-foreground capitalize">
                            {mp.platform}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-medium",
                              mp.status === 'live' && "text-green-600",
                              mp.status === 'inactive' && "text-muted-foreground",
                              mp.status === 'error' && "text-destructive",
                              mp.status === 'not_listed' && "text-gray-400"
                            )}
                          >
                            • {mp.status === 'not_listed' ? 'Not Listed' : mp.status.charAt(0).toUpperCase() + mp.status.slice(1)}
                          </span>
                        </div>
                      ))}
                      {allMarketplaceData.length > 6 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAllMarketplaces(!showAllMarketplaces)}
                          className="text-sm text-primary h-auto py-1 px-2"
                        >
                          {showAllMarketplaces
                            ? 'Show less'
                            : `+${allMarketplaceData.length - 6} more`
                          }
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Stats - Now Editable */}
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
                        value={editedProduct.salePrice || ''}
                        onChange={(e) => updateField('salePrice', parseFloat(e.target.value) || 0)}
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
                      <Input
                        type="number"
                        value={editedProduct.stockQty || ''}
                        onChange={(e) => updateField('stockQty', parseInt(e.target.value) || 0)}
                        className={cn(
                          "text-xl font-bold h-auto py-1 bg-transparent border-0 border-b border-dashed border-muted-foreground/30 rounded-none focus-visible:ring-0 focus-visible:border-primary",
                          (editedProduct.stockQty || 0) === 0 ? "text-red-600" : "text-green-600"
                        )}
                      />
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Truck className="w-4 h-4" />
                        <span className="text-sm">Shipping Cost</span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        value={editedProduct.shippingCost || ''}
                        onChange={(e) => updateField('shippingCost', parseFloat(e.target.value) || 0)}
                        className="text-xl font-bold h-auto py-1 bg-transparent border-0 border-b border-dashed border-muted-foreground/30 rounded-none focus-visible:ring-0 focus-visible:border-primary"
                      />
                    </div>
                  </div>

                  {/* Revenue & Profit Summary */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground">Revenue & Profit Summary</h3>
                      <Select value={revenuePeriod} onValueChange={setRevenuePeriod}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">Last 7 days</SelectItem>
                          <SelectItem value="14">Last 14 days</SelectItem>
                          <SelectItem value="30">Last 30 days</SelectItem>
                          <SelectItem value="60">Last 60 days</SelectItem>
                          <SelectItem value="90">Last 90 days</SelectItem>
                          <SelectItem value="365">Last 365 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-emerald-600 mb-2">
                          <DollarSign className="w-4 h-4 shrink-0" />
                          <span className="text-xs font-medium">Total Revenue</span>
                        </div>
                        <p className="text-xl font-bold text-emerald-600 truncate">${(35657.96 * parseInt(revenuePeriod) / 30).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-xs text-muted-foreground mt-1">{Math.round(942 * parseInt(revenuePeriod) / 30)} units sold</p>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-blue-600 mb-2">
                          <TrendingUp className="w-4 h-4 shrink-0" />
                          <span className="text-xs font-medium">Gross Profit</span>
                        </div>
                        <p className="text-xl font-bold text-blue-600 truncate">${(product.grossProfitAmount * parseInt(revenuePeriod)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-xs text-muted-foreground mt-1">{product.grossProfitPercent}% margin</p>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-purple-600 mb-2">
                          <BarChart3 className="w-4 h-4 shrink-0" />
                          <span className="text-xs font-medium">Avg Daily Sales</span>
                        </div>
                        <p className="text-xl font-bold text-purple-600 truncate">31.4</p>
                        <p className="text-xs text-muted-foreground mt-1">units/day</p>
                      </div>
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-orange-600 mb-2">
                          <Package className="w-4 h-4 shrink-0" />
                          <span className="text-xs font-medium">Days of Stock</span>
                        </div>
                        <p className={cn(
                          "text-xl font-bold truncate",
                          (editedProduct.stockQty || 0) / 31.4 < 14 ? "text-red-600" : "text-orange-600"
                        )}>
                          {((editedProduct.stockQty || 0) / 31.4).toFixed(0)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">at current velocity</p>
                      </div>
                    </div>
                  </div>

                  {/* Forecasting Overview */}
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Sales Forecast
                    <Badge variant="secondary" className="text-xs font-normal">AI Powered</Badge>
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-6">
                      {/* Next 30 Days Forecast */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Next 30 Days</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Projected Sales</span>
                            <span className="text-lg font-bold text-primary">$38,450</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Projected Units</span>
                            <span className="text-lg font-bold">1,020</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Projected Profit</span>
                            <span className="text-lg font-bold text-emerald-600">$8,659</span>
                          </div>
                        </div>
                      </div>
                      {/* Next 60 Days Forecast */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Next 60 Days</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Projected Sales</span>
                            <span className="text-lg font-bold text-primary">$78,200</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Projected Units</span>
                            <span className="text-lg font-bold">2,080</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Projected Profit</span>
                            <span className="text-lg font-bold text-emerald-600">$17,596</span>
                          </div>
                        </div>
                      </div>
                      {/* Next 90 Days Forecast */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Next 90 Days</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Projected Sales</span>
                            <span className="text-lg font-bold text-primary">$115,800</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Projected Units</span>
                            <span className="text-lg font-bold">3,075</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Projected Profit</span>
                            <span className="text-lg font-bold text-emerald-600">$26,055</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Restock Alert */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-500" />
                          <span className="font-medium">Restock Recommendation</span>
                        </div>
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                          Order in {Math.max(0, ((editedProduct.stockQty || 0) / 31.4) - 7).toFixed(0)} days
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Based on current velocity of 31.4 units/day, recommend ordering <span className="font-semibold text-foreground">1,500 units</span> to maintain 45 days of stock.
                      </p>
                    </div>
                  </div>

                  {/* Variation Breakdown */}
                  {variationData.length > 0 && (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Forecast by Variation
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium text-muted-foreground">Variation</th>
                              <th className="text-right py-2 font-medium text-muted-foreground">30d Sales</th>
                              <th className="text-right py-2 font-medium text-muted-foreground">30d Profit</th>
                              <th className="text-right py-2 font-medium text-muted-foreground">Velocity</th>
                              <th className="text-right py-2 font-medium text-muted-foreground">Stock Days</th>
                              <th className="text-right py-2 font-medium text-muted-foreground">Restock</th>
                            </tr>
                          </thead>
                          <tbody>
                            {variationForecastData.map((item) => (
                              <tr key={item.id} className="border-b border-muted/50">
                                <td className="py-2 font-medium">{item.name}</td>
                                <td className="text-right py-2 text-emerald-600 font-medium">${item.salesAmount.toFixed(0)}</td>
                                <td className="text-right py-2 text-blue-600 font-medium">${item.profitAmount.toFixed(0)}</td>
                                <td className="text-right py-2">{item.velocity.toFixed(1)}/day</td>
                                <td className={cn("text-right py-2 font-medium", item.stockDays < 14 ? "text-red-600" : "text-foreground")}>
                                  {item.stockDays.toFixed(0)}
                                </td>
                                <td className="text-right py-2">
                                  <Badge variant={item.stockDays < 14 ? "destructive" : "secondary"} className="text-xs">
                                    {item.stockDays < 14 ? 'Urgent' : item.stockDays < 30 ? 'Soon' : 'OK'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
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
                      <Input
                        type="number"
                        step="0.01"
                        value={editedProduct.salePrice || ''}
                        onChange={(e) => updateField('salePrice', parseFloat(e.target.value))}
                        className="mt-1"
                      />
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">Landed Cost</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editedProduct.landedCost || ''}
                          onChange={(e) => updateField('landedCost', parseFloat(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Shipping Cost</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editedProduct.shippingCost || ''}
                          onChange={(e) => updateField('shippingCost', parseFloat(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">Gross Profit</Label>
                        <p className={cn(
                          "text-lg font-semibold mt-1",
                          ((editedProduct.salePrice || 0) - (editedProduct.landedCost || 0)) > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatCurrency((editedProduct.salePrice || 0) - (editedProduct.landedCost || 0))}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Profit Margin</Label>
                        <p className={cn(
                          "text-lg font-semibold mt-1",
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
                        <Label className="text-muted-foreground text-sm">Stock Qty</Label>
                        <Input
                          type="number"
                          value={editedProduct.stockQty || ''}
                          onChange={(e) => updateField('stockQty', parseInt(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Purchase Qty</Label>
                        <Input
                          type="number"
                          value={editedProduct.purchaseQty || ''}
                          onChange={(e) => updateField('purchaseQty', parseInt(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm flex items-center gap-1">
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Sold Qty
                        </Label>
                        <Input
                          type="number"
                          value={editedProduct.soldQty || ''}
                          onChange={(e) => updateField('soldQty', parseInt(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm flex items-center gap-1">
                          <RotateCcw className="w-3.5 h-3.5" />
                          Return Qty
                        </Label>
                        <Input
                          type="number"
                          value={editedProduct.returnQty || ''}
                          onChange={(e) => updateField('returnQty', parseInt(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FBA & WFS Inventory Section */}
              <div className="grid grid-cols-2 gap-6 mt-6">
                {/* FBA Inventory - Read Only */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Package className="w-5 h-5 text-orange-500" />
                      FBA Inventory
                      <Badge variant="secondary" className="text-xs font-normal">Read Only</Badge>
                    </h3>
                  </div>
                  {/* Variation Selector for FBA */}
                  <VariationSelector
                    value={selectedFbaVariation}
                    onValueChange={setSelectedFbaVariation}
                    variations={variationData}
                    className="w-full"
                  />
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="space-y-1">
                      {/* Main Metrics */}
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm">Available</span>
                        <span className="font-medium">1,130</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm">Inbound</span>
                        <span className="font-medium">0</span>
                      </div>
                      
                      {/* Reserved - Collapsible */}
                      <Collapsible>
                        <CollapsibleTrigger className="flex justify-between items-center py-2 border-b w-full hover:bg-muted/50 rounded px-1 -mx-1">
                          <span className="text-sm flex items-center gap-1">
                            <ChevronRight className="w-4 h-4 transition-transform [[data-state=open]_&]:rotate-90" />
                            Reserved
                          </span>
                          <span className="font-medium">36</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-6 space-y-1">
                          <div className="flex justify-between py-1.5 text-sm">
                            <span className="text-muted-foreground">Customer orders</span>
                            <span>3</span>
                          </div>
                          <div className="flex justify-between py-1.5 text-sm">
                            <span className="text-muted-foreground">FC transfer</span>
                            <span>11</span>
                          </div>
                          <div className="flex justify-between py-1.5 text-sm border-b">
                            <span className="text-muted-foreground">FC processing</span>
                            <span>22</span>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                      
                      {/* Unfulfillable - Collapsible */}
                      <Collapsible>
                        <CollapsibleTrigger className="flex justify-between items-center py-2 border-b w-full hover:bg-muted/50 rounded px-1 -mx-1">
                          <span className="text-sm flex items-center gap-1">
                            <ChevronRight className="w-4 h-4 transition-transform [[data-state=open]_&]:rotate-90" />
                            Unfulfillable
                          </span>
                          <span className="font-medium">0</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-6 space-y-1">
                          <div className="flex justify-between py-1.5 text-sm">
                            <span className="text-muted-foreground">Warehouse damaged</span>
                            <span>0</span>
                          </div>
                          <div className="flex justify-between py-1.5 text-sm">
                            <span className="text-muted-foreground">Carrier damaged</span>
                            <span>0</span>
                          </div>
                          <div className="flex justify-between py-1.5 text-sm">
                            <span className="text-muted-foreground">Customer damaged</span>
                            <span>0</span>
                          </div>
                          <div className="flex justify-between py-1.5 text-sm">
                            <span className="text-muted-foreground">Expired</span>
                            <span>0</span>
                          </div>
                          <div className="flex justify-between py-1.5 text-sm">
                            <span className="text-muted-foreground">Defective</span>
                            <span>0</span>
                          </div>
                          <div className="flex justify-between py-1.5 text-sm border-b">
                            <span className="text-muted-foreground">Distributor damaged</span>
                            <span>0</span>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                      
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm">Researching</span>
                        <span className="font-medium">40</span>
                      </div>
                      
                      {/* Total */}
                      <div className="flex justify-between py-2 font-semibold">
                        <span>Total</span>
                        <span>1,206</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* WFS Inventory - Read Only */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Warehouse className="w-5 h-5 text-blue-500" />
                      WFS Inventory
                      <Badge variant="secondary" className="text-xs font-normal">Read Only</Badge>
                    </h3>
                  </div>
                  {/* Variation Selector for WFS */}
                  <VariationSelector
                    value={selectedWfsVariation}
                    onValueChange={setSelectedWfsVariation}
                    variations={variationData}
                    className="w-full"
                  />
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="space-y-1">
                      {/* Main Metrics */}
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm">Available</span>
                        <span className="font-medium">850</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm">Inbound</span>
                        <span className="font-medium">200</span>
                      </div>
                      
                      {/* Reserved - Collapsible */}
                      <Collapsible>
                        <CollapsibleTrigger className="flex justify-between items-center py-2 border-b w-full hover:bg-muted/50 rounded px-1 -mx-1">
                          <span className="text-sm flex items-center gap-1">
                            <ChevronRight className="w-4 h-4 transition-transform [[data-state=open]_&]:rotate-90" />
                            Reserved
                          </span>
                          <span className="font-medium">25</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-6 space-y-1">
                          <div className="flex justify-between py-1.5 text-sm">
                            <span className="text-muted-foreground">Customer orders</span>
                            <span>15</span>
                          </div>
                          <div className="flex justify-between py-1.5 text-sm">
                            <span className="text-muted-foreground">FC transfer</span>
                            <span>5</span>
                          </div>
                          <div className="flex justify-between py-1.5 text-sm border-b">
                            <span className="text-muted-foreground">FC processing</span>
                            <span>5</span>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                      
                      {/* Unfulfillable - Collapsible */}
                      <Collapsible>
                        <CollapsibleTrigger className="flex justify-between items-center py-2 border-b w-full hover:bg-muted/50 rounded px-1 -mx-1">
                          <span className="text-sm flex items-center gap-1">
                            <ChevronRight className="w-4 h-4 transition-transform [[data-state=open]_&]:rotate-90" />
                            Unfulfillable
                          </span>
                          <span className="font-medium">12</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-6 space-y-1">
                          <div className="flex justify-between py-1.5 text-sm">
                            <span className="text-muted-foreground">Warehouse damaged</span>
                            <span>2</span>
                          </div>
                          <div className="flex justify-between py-1.5 text-sm">
                            <span className="text-muted-foreground">Carrier damaged</span>
                            <span>3</span>
                          </div>
                          <div className="flex justify-between py-1.5 text-sm">
                            <span className="text-muted-foreground">Customer damaged</span>
                            <span>5</span>
                          </div>
                          <div className="flex justify-between py-1.5 text-sm">
                            <span className="text-muted-foreground">Expired</span>
                            <span>0</span>
                          </div>
                          <div className="flex justify-between py-1.5 text-sm">
                            <span className="text-muted-foreground">Defective</span>
                            <span>2</span>
                          </div>
                          <div className="flex justify-between py-1.5 text-sm border-b">
                            <span className="text-muted-foreground">Distributor damaged</span>
                            <span>0</span>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                      
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm">Researching</span>
                        <span className="font-medium">8</span>
                      </div>
                      
                      {/* Total */}
                      <div className="flex justify-between py-2 font-semibold">
                        <span>Total</span>
                        <span>1,095</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Identifiers Tab */}
            <TabsContent value="identifiers" className="mt-0 p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Barcode className="w-5 h-5 text-primary" />
                    Product Identifiers
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Add multiple identifiers for the same product when selling across marketplaces
                  </p>
                </div>
                
                {/* Primary Identifiers - SKU, UPC, ASIN, FNSKU */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-primary" />
                    Primary Identifiers
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <MultiIdentifierField
                      label="SKU (Stock Keeping Unit)"
                      values={multiSkus}
                      onChange={setMultiSkus}
                      placeholder="Enter SKU..."
                      icon={<Hash className="w-3.5 h-3.5" />}
                    />
                    <MultiIdentifierField
                      label="UPC (Universal Product Code)"
                      values={multiUpcs}
                      onChange={setMultiUpcs}
                      placeholder="Enter UPC..."
                      icon={<Barcode className="w-3.5 h-3.5" />}
                    />
                    <MultiIdentifierField
                      label="ASIN (Amazon Standard ID)"
                      values={multiAsins}
                      onChange={setMultiAsins}
                      placeholder="Enter ASIN..."
                      icon={<Package className="w-3.5 h-3.5" />}
                    />
                    <MultiIdentifierField
                      label="FNSKU (Fulfillment Network SKU)"
                      values={multiFnskus}
                      onChange={setMultiFnskus}
                      placeholder="Enter FNSKU..."
                      icon={<Truck className="w-3.5 h-3.5" />}
                    />
                  </div>
                </div>

                {/* Additional Identifiers - GTIN, EAN, ISBN */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    Global Identifiers
                  </h4>
                  <div className="grid grid-cols-3 gap-6">
                    <MultiIdentifierField
                      label="GTIN (Global Trade Item Number)"
                      values={multiGtins}
                      onChange={setMultiGtins}
                      placeholder="Enter GTIN..."
                      icon={<Globe className="w-3.5 h-3.5" />}
                    />
                    <MultiIdentifierField
                      label="EAN (European Article Number)"
                      values={multiEans}
                      onChange={setMultiEans}
                      placeholder="Enter EAN..."
                      icon={<Globe className="w-3.5 h-3.5" />}
                    />
                    <MultiIdentifierField
                      label="ISBN (Book Identifier)"
                      values={multiIsbns}
                      onChange={setMultiIsbns}
                      placeholder="Enter ISBN..."
                      icon={<FileText className="w-3.5 h-3.5" />}
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-muted/20 rounded-lg p-4 border border-border/50">
                  <h4 className="text-sm font-medium mb-3">Identifier Summary</h4>
                  <div className="flex flex-wrap gap-3">
                    {multiSkus.filter(v => v.trim()).length > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <Hash className="w-3 h-3" />
                        {multiSkus.filter(v => v.trim()).length} SKU{multiSkus.filter(v => v.trim()).length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {multiUpcs.filter(v => v.trim()).length > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <Barcode className="w-3 h-3" />
                        {multiUpcs.filter(v => v.trim()).length} UPC{multiUpcs.filter(v => v.trim()).length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {multiAsins.filter(v => v.trim()).length > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <Package className="w-3 h-3" />
                        {multiAsins.filter(v => v.trim()).length} ASIN{multiAsins.filter(v => v.trim()).length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {multiFnskus.filter(v => v.trim()).length > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <Truck className="w-3 h-3" />
                        {multiFnskus.filter(v => v.trim()).length} FNSKU{multiFnskus.filter(v => v.trim()).length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {multiGtins.filter(v => v.trim()).length > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <Globe className="w-3 h-3" />
                        {multiGtins.filter(v => v.trim()).length} GTIN{multiGtins.filter(v => v.trim()).length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {multiEans.filter(v => v.trim()).length > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <Globe className="w-3 h-3" />
                        {multiEans.filter(v => v.trim()).length} EAN{multiEans.filter(v => v.trim()).length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {multiIsbns.filter(v => v.trim()).length > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <FileText className="w-3 h-3" />
                        {multiIsbns.filter(v => v.trim()).length} ISBN{multiIsbns.filter(v => v.trim()).length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {[...multiSkus, ...multiUpcs, ...multiAsins, ...multiFnskus, ...multiGtins, ...multiEans, ...multiIsbns].filter(v => v.trim()).length === 0 && (
                      <span className="text-sm text-muted-foreground">No identifiers added yet</span>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Images & Videos Tab */}
            <TabsContent value="images" className="mt-0 p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Image className="w-5 h-5 text-primary" />
                    Product Media
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Image className="w-4 h-4" />
                      {imageCount} image{imageCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      {videoCount} video{videoCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Add Media Section */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Image Upload */}
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        Upload Images (select multiple)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              const fileArray = Array.from(files);
                              let loadedCount = 0;
                              fileArray.forEach(file => {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const result = event.target?.result as string;
                                  setProductMedia(prev => [...prev, { url: result, type: 'image' }]);
                                  loadedCount++;
                                  if (loadedCount === fileArray.length) {
                                    toast.success(`${fileArray.length} image${fileArray.length > 1 ? 's' : ''} uploaded successfully`);
                                  }
                                };
                                reader.readAsDataURL(file);
                              });
                            }
                            e.target.value = '';
                          }}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* Video Upload */}
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Upload Videos (select multiple)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="video/*"
                          multiple
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              const fileArray = Array.from(files);
                              let loadedCount = 0;
                              fileArray.forEach(file => {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const result = event.target?.result as string;
                                  setProductMedia(prev => [...prev, { url: result, type: 'video' }]);
                                  loadedCount++;
                                  if (loadedCount === fileArray.length) {
                                    toast.success(`${fileArray.length} video${fileArray.length > 1 ? 's' : ''} uploaded successfully`);
                                  }
                                };
                                reader.readAsDataURL(file);
                              });
                            }
                            e.target.value = '';
                          }}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* URL Input */}
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Add from URL (Image or Video)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="url"
                        value={newMediaUrl}
                        onChange={(e) => setNewMediaUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg or video.mp4"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (newMediaUrl.trim()) {
                            const type = isVideoUrl(newMediaUrl.trim()) ? 'video' : 'image';
                            setProductMedia(prev => [...prev, { url: newMediaUrl.trim(), type }]);
                            setNewMediaUrl('');
                            toast.success(`${type === 'video' ? 'Video' : 'Image'} added successfully`);
                          }
                        }}
                        disabled={!newMediaUrl.trim()}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Media Gallery */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">
                      Media Gallery
                      <span className="text-xs ml-2">(Drag to reorder • First image is the main image)</span>
                    </Label>
                  </div>

                  {productMedia.length > 0 ? (
                    <div className="grid grid-cols-5 gap-4">
                      {productMedia.map((media, index) => (
                        <div
                          key={index}
                          draggable
                          onDragStart={() => setDraggedMediaIndex(index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (draggedMediaIndex !== null && draggedMediaIndex !== index) {
                              const newMedia = [...productMedia];
                              const [draggedItem] = newMedia.splice(draggedMediaIndex, 1);
                              newMedia.splice(index, 0, draggedItem);
                              setProductMedia(newMedia);
                              setDraggedMediaIndex(null);
                              toast.success('Media order updated');
                            }
                          }}
                          onDragEnd={() => setDraggedMediaIndex(null)}
                          className={cn(
                            "relative group aspect-square rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all",
                            index === 0 && media.type === 'image' ? "border-primary ring-2 ring-primary/20" : "border-muted-foreground/20 hover:border-muted-foreground/40",
                            draggedMediaIndex === index && "opacity-50 scale-95"
                          )}
                        >
                          {media.type === 'image' ? (
                            <img
                              src={media.url}
                              alt={`Product image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                              <video
                                src={media.url}
                                className="w-full h-full object-cover"
                                muted
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                                  <Play className="w-6 h-6 text-slate-900 ml-1" />
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Type Badge */}
                          <div className={cn(
                            "absolute top-2 left-2 text-xs px-2 py-1 rounded-md font-medium",
                            index === 0 && media.type === 'image' 
                              ? "bg-primary text-primary-foreground" 
                              : media.type === 'video' 
                                ? "bg-purple-600 text-white" 
                                : "bg-black/60 text-white"
                          )}>
                            {index === 0 && media.type === 'image' ? 'Main' : media.type === 'video' ? 'Video' : ''}
                          </div>

                          {/* Media Number */}
                          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
                            {index + 1}
                          </div>

                          {/* Action Buttons */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {index > 0 && media.type === 'image' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newMedia = [...productMedia];
                                  // Find first image position
                                  const firstImageIndex = newMedia.findIndex(m => m.type === 'image');
                                  if (firstImageIndex !== -1 && firstImageIndex !== index) {
                                    [newMedia[firstImageIndex], newMedia[index]] = [newMedia[index], newMedia[firstImageIndex]];
                                    setProductMedia(newMedia);
                                    toast.success('Set as main image');
                                  }
                                }}
                                className="h-8"
                              >
                                Set Main
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProductMedia(prev => prev.filter((_, i) => i !== index));
                                toast.success(`${media.type === 'video' ? 'Video' : 'Image'} removed`);
                              }}
                              className="h-8"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Add More Placeholder */}
                      <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Add Media</span>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              const fileArray = Array.from(files);
                              let loadedCount = 0;
                              fileArray.forEach(file => {
                                const isVideo = file.type.startsWith('video/');
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const result = event.target?.result as string;
                                  setProductMedia(prev => [...prev, { url: result, type: isVideo ? 'video' : 'image' }]);
                                  loadedCount++;
                                  if (loadedCount === fileArray.length) {
                                    toast.success(`${fileArray.length} file${fileArray.length > 1 ? 's' : ''} uploaded successfully`);
                                  }
                                };
                                reader.readAsDataURL(file);
                              });
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30">
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <Image className="w-12 h-12 text-muted-foreground" />
                        <Video className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <h4 className="font-medium mb-2">No Media Yet</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload images and videos to showcase your product.
                      </p>
                      <label className="cursor-pointer">
                        <Button asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Media
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              const fileArray = Array.from(files);
                              let loadedCount = 0;
                              fileArray.forEach(file => {
                                const isVideo = file.type.startsWith('video/');
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const result = event.target?.result as string;
                                  setProductMedia(prev => [...prev, { url: result, type: isVideo ? 'video' : 'image' }]);
                                  loadedCount++;
                                  if (loadedCount === fileArray.length) {
                                    toast.success(`${fileArray.length} file${fileArray.length > 1 ? 's' : ''} uploaded successfully`);
                                  }
                                };
                                reader.readAsDataURL(file);
                              });
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Media Tips */}
                <div className="bg-muted/20 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    Media Guidelines
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Image className="w-3 h-3" /> Images
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                        <li>Use high-quality images (at least 1000x1000 pixels)</li>
                        <li>The first image will be used as the main product image</li>
                        <li>Use white backgrounds for main images (Amazon requirement)</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Video className="w-3 h-3" /> Videos
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                        <li>MP4 format recommended for best compatibility</li>
                        <li>Keep videos under 2 minutes for optimal engagement</li>
                        <li>Show product features and usage in action</li>
                      </ul>
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
                    <Badge variant="secondary" className="px-3 py-1 gap-1.5 bg-slate-600 text-slate-200">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      {inactiveMarketplaces.length} Inactive
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1 gap-1.5 border-slate-500 text-slate-300 border-dashed">
                      <span className="w-2 h-2 rounded-full bg-gray-500" />
                      {notListedMarketplaces.length} Not Listed
                    </Badge>
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
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-medium text-white capitalize">{mp.platform}</span>
                                    <Badge 
                                      variant="outline" 
                                      className={cn(
                                        "text-[10px] px-1.5 py-0 h-4 w-fit",
                                        mp.status === 'live' && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                                        mp.status === 'inactive' && "bg-slate-600 text-slate-300 border-slate-500",
                                        mp.status === 'error' && "bg-red-500/20 text-red-400 border-red-500/30",
                                        mp.status === 'not_listed' && "bg-transparent text-slate-500 border-slate-600 border-dashed"
                                      )}
                                    >
                                      {mp.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />}
                                      {mp.status === 'not_listed' ? 'Not Listed' : mp.status.charAt(0).toUpperCase() + mp.status.slice(1)}
                                    </Badge>
                                  </div>
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
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    onClick={handleMarketplaceSaveChanges}
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </div>

              {/* Sync Dialog */}
              <MarketplaceSelectionDialog
                open={showSyncDialog}
                onOpenChange={setShowSyncDialog}
                title="Sync Changes to Live Marketplaces"
                description="Select which live marketplaces should receive the updated pricing and inventory data."
                marketplaces={liveMarketplaces.map(mp => ({
                  platform: mp.platform,
                  label: mp.platform.charAt(0).toUpperCase() + mp.platform.slice(1),
                  status: mp.status
                }))}
                onConfirm={handleSyncConfirm}
                mode="sync"
                isLoading={isUpdatingMarketplaces}
              />
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <List className="w-5 h-5 text-primary" />
                      Bullet Points
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setBulletPoints(prev => [...prev, ''])}
                      className="gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Add Bullet
                    </Button>
                  </div>
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
                        {bulletPoints.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setBulletPoints(prev => prev.filter((_, i) => i !== index))}
                            className="shrink-0 h-9 w-9 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Use bullet points to highlight key product features. Most marketplaces support 5 bullet points, but you can add more for internal use.
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
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    Product Options
                  </h3>
                  <Button onClick={() => setShowManageOptionsDialog(true)}>
                    <Settings2 className="w-4 h-4 mr-2" />
                    Manage Options
                  </Button>
                </div>

                {productOptions.length > 0 ? (
                  <div className="space-y-4">
                    {productOptions.map((option, idx) => (
                      <div key={idx} className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium capitalize">{option.name}</h4>
                          <Badge variant="secondary">{option.choices.length} choices</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {option.choices.map((choice, choiceIdx) => (
                            <Badge key={choiceIdx} variant="outline">
                              {choice}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}

                    {variationData.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-4">Variation Settings</h4>
                        <VariationSettingsEditor
                          productName={product.name}
                          variations={variationData}
                          onUpdateVariation={handleUpdateVariation}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-lg">
                    <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h4 className="font-medium mb-2">No Product Options</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add options like Size, Color, or Material to create product variations.
                    </p>
                    <Button onClick={() => setShowManageOptionsDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Options
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Extra Attributes Tab */}
            <TabsContent value="extra" className="mt-0 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-primary" />
                    Extra Attributes
                  </h3>
                  <Button onClick={addExtraAttribute} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Attribute
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {extraAttributes.map((attr, index) => (
                    <div key={index} className="bg-muted/30 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Input
                          value={attr.name}
                          onChange={(e) => updateExtraAttribute(index, 'name', e.target.value)}
                          placeholder="Attribute name"
                          className="font-medium"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExtraAttribute(index)}
                          className="shrink-0 ml-2"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={attr.type}
                          onValueChange={(value) => updateExtraAttribute(index, 'type', value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={attr.value}
                          onChange={(e) => updateExtraAttribute(index, 'value', e.target.value)}
                          placeholder="Value"
                          type={attr.type === 'number' ? 'number' : 'text'}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addExtraAttribute}
                    className="bg-muted/30 rounded-lg p-4 border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors min-h-[120px]"
                  >
                    <Plus className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Add Attribute</span>
                  </button>
                </div>
              </div>
            </TabsContent>

            {/* Tags Tab */}
            <TabsContent value="tags" className="mt-0 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TagIcon className="w-5 h-5 text-primary" />
                    Product Tags
                  </h3>
                  <Button 
                    size="sm" 
                    onClick={() => setShowTagDialog(true)}
                    className="gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Create Tag
                  </Button>
                </div>
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
                  {tags.length > 0 ? (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-muted-foreground text-sm">Manage Tags</Label>
                          <span className="text-xs text-muted-foreground">Click to assign/unassign</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
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
                                onClick={() => toggleProductTag(product.id, tag.id)}
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
                  ) : (
                    <>
                      <Separator className="my-4" />
                      <div className="text-center py-6">
                        <TagIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-muted-foreground mb-3">
                          No tags available yet.
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowTagDialog(true)}
                          className="gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          Create Your First Tag
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Tag Dialog */}
              <TagDialog
                open={showTagDialog}
                onOpenChange={setShowTagDialog}
                onSave={(tag: Tag) => {
                  addTag(tag);
                  // Automatically assign the new tag to this product
                  toggleProductTag(product.id, tag.id);
                }}
              />
            </TabsContent>

            {/* Sales Overview Tab */}
            <TabsContent value="sales" className="mt-0 p-6">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Sales
                    </h3>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Sales data synced from connected marketplaces</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      Last updated: 1/18/2026 2:44 PM
                      <RefreshCw className="w-3 h-3" />
                    </span>
                    <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">NEW</Badge>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Link2Off className="w-4 h-4" />
                      Deep Dive Sales & Traffic
                    </Button>
                  </div>
                </div>

                {/* Variation Selector for Sales */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-medium whitespace-nowrap">View data for:</Label>
                    <VariationSelector
                      value={selectedSalesVariation}
                      onValueChange={setSelectedSalesVariation}
                      variations={variationData}
                      className="flex-1"
                    />
                  </div>
                  {selectedSalesVariation !== 'all' && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Showing sales data for: <span className="font-medium text-foreground">{variationData.find(v => v.id === selectedSalesVariation)?.name}</span>
                    </p>
                  )}
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="border-b pb-3 mb-4">
                    <span className="text-sm font-medium border-b-2 border-primary pb-3">Information</span>
                  </div>

                  {/* View Sales Data Toggle & Metrics */}
                  <div className="grid grid-cols-4 gap-6">
                    {/* Left column - View toggle and rank */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-muted-foreground text-xs">View sales data for:</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Button size="sm" variant="default" className="h-7 text-xs px-3">SKU</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs px-3">ASIN</Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground text-xs">Sales rank</Label>
                          <p className="text-sm font-medium">-</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Category</Label>
                          <p className="text-sm font-medium">-</p>
                        </div>
                      </div>
                    </div>

                    {/* Last 7 days */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Last 7 days</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Units ordered</span>
                          <span className="text-sm font-medium">37</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Avg units per order</span>
                          <span className="text-sm font-medium">1.03</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Avg selling price</span>
                          <span className="text-sm font-medium">$45.99</span>
                        </div>
                      </div>
                    </div>

                    {/* Last 30 days */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Last 30 days</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Units ordered</span>
                          <span className="text-sm font-medium">942</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Avg units per order</span>
                          <span className="text-sm font-medium">1.02</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Avg selling price</span>
                          <span className="text-sm font-medium">$37.85</span>
                        </div>
                      </div>
                    </div>

                    {/* Last 90 days */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Last 90 days</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Units ordered</span>
                          <span className="text-sm font-medium">3,811</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Avg units per order</span>
                          <span className="text-sm font-medium">1.03</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Avg selling price</span>
                          <span className="text-sm font-medium">$38.87</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart Section */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="default" className="h-7 text-xs px-3">Sales</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-3">Units</Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Data shown</span>
                      <Select value={salesDataPeriod} onValueChange={setSalesDataPeriod}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">Last 7 days</SelectItem>
                          <SelectItem value="14">Last 14 days</SelectItem>
                          <SelectItem value="30">Last 30 days</SelectItem>
                          <SelectItem value="60">Last 60 days</SelectItem>
                          <SelectItem value="90">Last 90 days</SelectItem>
                          <Separator className="my-1" />
                          <SelectItem value="q1-2026">Q1 2026</SelectItem>
                          <SelectItem value="q4-2025">Q4 2025</SelectItem>
                          <SelectItem value="q3-2025">Q3 2025</SelectItem>
                          <SelectItem value="q2-2025">Q2 2025</SelectItem>
                          <SelectItem value="q1-2025">Q1 2025</SelectItem>
                          <Separator className="my-1" />
                          <SelectItem value="2026">Year 2026</SelectItem>
                          <SelectItem value="2025">Year 2025</SelectItem>
                          <SelectItem value="2024">Year 2024</SelectItem>
                          <Separator className="my-1" />
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {/* Custom Date Range Pickers */}
                      {salesDataPeriod === 'custom' && (
                        <div className="flex items-center gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "h-8 text-xs justify-start",
                                  !salesCustomStartDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="w-3 h-3 mr-1" />
                                {salesCustomStartDate ? format(salesCustomStartDate, "MMM d, yyyy") : "Start date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={salesCustomStartDate}
                                onSelect={setSalesCustomStartDate}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <span className="text-xs text-muted-foreground">to</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "h-8 text-xs justify-start",
                                  !salesCustomEndDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="w-3 h-3 mr-1" />
                                {salesCustomEndDate ? format(salesCustomEndDate, "MMM d, yyyy") : "End date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={salesCustomEndDate}
                                onSelect={setSalesCustomEndDate}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sales Chart */}
                  <div className="h-[250px] relative">
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-muted-foreground py-2">
                      <span>$10.0k</span>
                      <span>$7.5k</span>
                      <span>$5.0k</span>
                      <span>$2.5k</span>
                      <span>$0</span>
                    </div>
                    <div className="ml-14 h-full border-l border-b border-border relative">
                      {/* Chart line - simplified visual representation */}
                      <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                        <path 
                          d="M0,10 Q20,20 40,40 T80,60 T120,80 T160,150 T200,160 T240,165 T280,160 T320,170 T360,175 T400,180" 
                          fill="none" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth="2"
                        />
                      </svg>
                      {/* X-axis labels */}
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground transform translate-y-5 px-2">
                        <span>12/21</span>
                        <span>12/24</span>
                        <span>12/27</span>
                        <span>12/30</span>
                        <span>1/2</span>
                        <span>1/5</span>
                        <span>1/8</span>
                        <span>1/11</span>
                        <span>1/14</span>
                        <span>1/17</span>
                      </div>
                    </div>
                  </div>

                  {/* Comparison Options */}
                  <div className="flex items-center gap-8 mt-8 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Checkbox id="last30" defaultChecked />
                      <label htmlFor="last30" className="flex flex-col">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          Last 30 days —
                        </span>
                        <span className="text-sm font-semibold text-primary">$35,657.96</span>
                        <span className="text-xs text-muted-foreground">942 units</span>
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="last31-60" />
                      <label htmlFor="last31-60" className="flex flex-col">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          Last 31-60 days —
                        </span>
                        <span className="text-sm font-semibold text-muted-foreground">$98,033.84</span>
                        <span className="text-xs text-muted-foreground">2,477 units</span>
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="sameLastYear" />
                      <label htmlFor="sameLastYear" className="flex flex-col">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          Same 30 days last year —
                        </span>
                        <span className="text-sm font-semibold text-muted-foreground">$131.85</span>
                        <span className="text-xs text-muted-foreground">3 units</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Offers Tab */}
            <TabsContent value="offers" className="mt-0 p-6">
              <ProductOffersTab productId={product?.id || ''} productName={product?.name || ''} />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>

      {/* Manage Options Dialog */}
      <ManageOptionsDialog
        open={showManageOptionsDialog}
        onOpenChange={setShowManageOptionsDialog}
        options={productOptions}
        onOptionsChange={setProductOptions}
        variationCount={variationData.length}
      />
    </div>
  );
}
