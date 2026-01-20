import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CopyButton } from './CopyButton';
import { toast } from 'sonner';

import {
  ChevronDown,
  ChevronRight,
  Package,
  Barcode,
  Layers,
  DollarSign,
  Settings2,
  Image,
  Upload,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  Box,
  Scale,
  Ruler,
  Plus,
  X,
  Hash,
  Truck,
  Globe,
  Check,
  Copy,
  HelpCircle,
  Link,
  ImagePlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VariationData {
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
  // Multi-qty weights (weight for 2 qty, 3 qty, etc.)
  weightPerQty?: { qty: number; weight: number }[];
  height?: number;
  width?: number;
  length?: number;
  // Multi-qty dimensions
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
  // Variation images
  images?: string[];
}

// Multi-identifier field component for variations
function VariationMultiField({
  label,
  values,
  onChange,
  placeholder,
  icon: Icon,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  icon?: React.ElementType;
}) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const displayValues = values.length === 0 ? [''] : values;

  const handleAdd = () => onChange([...displayValues, '']);
  const handleRemove = (index: number) => {
    const newValues = displayValues.filter((_, i) => i !== index);
    onChange(newValues.length === 0 ? [''] : newValues);
  };
  const handleChange = (index: number, value: string) => {
    const newValues = [...displayValues];
    newValues[index] = value;
    onChange(newValues);
  };
  const handleCopy = async (value: string, index: number) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedIndex(index);
      toast.success('Copied');
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-1.5">
          {Icon && <Icon className="w-3 h-3" />}
          {label}
          {displayValues.filter(v => v.trim()).length > 1 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {displayValues.filter(v => v.trim()).length}
            </Badge>
          )}
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAdd}
          className="h-5 text-[10px] gap-0.5 px-1.5"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      <div className="space-y-1.5">
        {displayValues.map((value, index) => (
          <div key={index} className="flex items-center gap-1">
            <Input
              value={value}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder={placeholder}
              className="h-8 text-sm flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(value, index)}
              disabled={!value}
              className="h-8 w-8 shrink-0"
            >
              {copiedIndex === index ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
            {displayValues.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Image manager component for variations
function VariationImageManager({
  images,
  onChange,
  variationName,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  variationName: string;
}) {
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    onChange([...images, newImageUrl.trim()]);
    setNewImageUrl('');
    toast.success('Image added');
  };

  const handleRemoveImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
    toast.success('Image removed');
  };

  const handleSetMain = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const [removed] = newImages.splice(index, 1);
    newImages.unshift(removed);
    onChange(newImages);
    toast.success('Set as main image');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 px-2.5">
          <Image className="w-3.5 h-3.5" />
          Images
          {images.length > 0 && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">
              {images.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" side="bottom" sideOffset={4}>
        <div className="bg-slate-800 text-white px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
          <Image className="w-4 h-4" />
          Images for {variationName}
        </div>
        <div className="p-4 space-y-4">
          {/* Add Image URL */}
          <div className="flex gap-2">
            <Input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Enter image URL"
              className="flex-1 h-9"
              onKeyDown={(e) => e.key === 'Enter' && handleAddImage()}
            />
            <Button onClick={handleAddImage} disabled={!newImageUrl.trim()} size="sm" className="h-9">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Image Grid */}
          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {images.map((url, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "relative aspect-square rounded-lg overflow-hidden border-2 group",
                    idx === 0 ? "border-primary" : "border-border"
                  )}
                >
                  <img
                    src={url}
                    alt={`${variationName} image ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  {idx === 0 && (
                    <Badge className="absolute top-1 left-1 text-[10px] px-1.5 py-0" variant="default">
                      Main
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    {idx !== 0 && (
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleSetMain(idx)}
                          >
                            <ImagePlus className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Set as main</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleRemoveImage(idx)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Remove image</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No images added</p>
              <p className="text-xs text-muted-foreground">Add images via URL above</p>
            </div>
          )}

          {/* Quick tips */}
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> The first image will be used as the main product image for this variation.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface VariationSettingsEditorProps {
  variations: VariationData[];
  onUpdateVariation: (index: number, data: Partial<VariationData>) => void;
  productName: string;
}

export function VariationSettingsEditor({
  variations,
  onUpdateVariation,
  productName,
}: VariationSettingsEditorProps) {
  const [expandedVariations, setExpandedVariations] = useState<string[]>([]);

  const toggleVariation = (id: string) => {
    setExpandedVariations((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-background flex flex-col" style={{ maxHeight: 'calc(95vh - 280px)' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white px-5 py-3 flex items-center justify-between shrink-0">
        <h3 className="font-semibold tracking-wide text-sm uppercase">Customize Settings Per Variation</h3>
        <Badge variant="secondary" className="bg-white/20 text-white text-sm px-3">
          {variations.length} Variations
        </Badge>
      </div>

      {/* Variation List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {variations.map((variation, index) => {
          const isExpanded = expandedVariations.includes(variation.id);
          
          return (
            <Collapsible
              key={variation.id}
              open={isExpanded}
              onOpenChange={() => toggleVariation(variation.id)}
            >
              {/* Variation Header Row */}
              <div className={cn(
                "border-b transition-colors",
                isExpanded ? "bg-muted/50" : "hover:bg-muted/30"
              )}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-4 px-4 py-3 cursor-pointer">
                    {/* Expand Icon */}
                    <div className="shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-primary" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Variation Name & SKU */}
                    <div className="min-w-[200px] flex-shrink-0">
                      <p className="font-semibold text-base leading-tight">{variation.name}</p>
                      <p className="text-sm text-muted-foreground font-mono mt-0.5">{variation.sku}</p>
                    </div>

                    {/* Quick Info Grid */}
                    <div className="flex-1 grid grid-cols-6 gap-6 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">UPC</p>
                        <p className="text-sm font-mono truncate">{variation.upc || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">ASIN</p>
                        {variation.asin ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(variation.asin || '');
                              toast.success('ASIN copied');
                            }}
                            className="text-sm font-mono truncate text-primary hover:underline cursor-pointer"
                            title="Click to copy"
                          >
                            {variation.asin}
                          </button>
                        ) : (
                          <p className="text-sm font-mono truncate text-muted-foreground">—</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">FNSKU</p>
                        <p className="text-sm font-mono truncate">{variation.fnsku || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">Available</p>
                        <p className={cn(
                          "text-sm font-bold",
                          (variation.availableStock || 0) > 0 ? "text-emerald-600" : "text-muted-foreground"
                        )}>
                          {variation.availableStock ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">Allocated</p>
                        <p className="text-sm font-semibold">{variation.quantityAllocated ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">On Hand</p>
                        <p className="text-sm font-semibold">{variation.onHandQty ?? 0}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <VariationImageManager
                        images={variation.images || []}
                        onChange={(images) => onUpdateVariation(index, { images })}
                        variationName={variation.name}
                      />
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Upload className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={4}>
                          <p>Bulk upload images</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={4}>
                          <p>Sync with marketplace</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleVariation(variation.id)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={4}>
                          <p>Edit variation details</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={4}>
                          <p>Preview variation</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={4}>
                          <p>Delete variation</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Expanded Content */}
                <CollapsibleContent>
                  <div className="px-5 pb-5 pt-3 space-y-5 border-t bg-muted/20">
                    {/* Row 1: Identifiers (Multi-value) */}
                    <Card className="border-muted">
                      <div className="bg-slate-800 text-white px-4 py-2 text-sm font-semibold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Barcode className="w-4 h-4" />
                          IDENTIFIERS - {variation.name}
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3.5 h-3.5 text-white/50 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="bottom" sideOffset={4} className="max-w-xs z-50 bg-popover border shadow-lg">
                              <p>Product identifiers used across marketplaces. SKU, UPC, ASIN, FNSKU, and GTIN support multiple values for products sold under different codes.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                          Multiple values supported
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-5 gap-4">
                          <VariationMultiField
                            label="SKU"
                            values={variation.multiSkus || [variation.sku || '']}
                            onChange={(values) => onUpdateVariation(index, { multiSkus: values, sku: values[0] || '' })}
                            placeholder="Enter SKU"
                            icon={Hash}
                          />
                          <VariationMultiField
                            label="UPC"
                            values={variation.multiUpcs || [variation.upc || '']}
                            onChange={(values) => onUpdateVariation(index, { multiUpcs: values, upc: values[0] || '' })}
                            placeholder="Enter UPC"
                            icon={Barcode}
                          />
                          <VariationMultiField
                            label="ASIN"
                            values={variation.multiAsins || [variation.asin || '']}
                            onChange={(values) => onUpdateVariation(index, { multiAsins: values, asin: values[0] || '' })}
                            placeholder="Enter ASIN"
                            icon={Package}
                          />
                          <VariationMultiField
                            label="FNSKU"
                            values={variation.multiFnskus || [variation.fnsku || '']}
                            onChange={(values) => onUpdateVariation(index, { multiFnskus: values, fnsku: values[0] || '' })}
                            placeholder="Enter FNSKU"
                            icon={Truck}
                          />
                          <VariationMultiField
                            label="GTIN"
                            values={variation.multiGtins || ['']}
                            onChange={(values) => onUpdateVariation(index, { multiGtins: values })}
                            placeholder="Enter GTIN"
                            icon={Globe}
                          />
                        </div>
                        {/* Additional single-value fields */}
                        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                          {[
                            { label: 'Barcode', value: variation.barcode, key: 'barcode', placeholder: 'Barcode' },
                            { label: 'Harmcode', value: variation.harmcode, key: 'harmcode', placeholder: 'Harmcode' },
                            { label: 'Vendor SKU', value: variation.vendorSku, key: 'vendorSku', placeholder: 'Vendor SKU' },
                          ].map((field) => (
                            <div key={field.key} className="space-y-1">
                              <Label className="text-xs text-muted-foreground uppercase font-medium">{field.label}</Label>
                              <div className="flex items-center gap-1">
                                <Input
                                  value={field.value || ''}
                                  onChange={(e) => onUpdateVariation(index, { [field.key]: e.target.value })}
                                  placeholder={field.placeholder}
                                  className="h-8 text-sm"
                                />
                                {field.value && <CopyButton value={field.value} />}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Row 2: Weight/Dimension */}
                    <Card className="border-muted">
                      <div className="bg-slate-800 text-white px-4 py-2 text-sm font-semibold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Scale className="w-4 h-4" />
                          WEIGHT / DIMENSION
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3.5 h-3.5 text-white/50 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="bottom" sideOffset={4} className="max-w-xs z-50 bg-popover border shadow-lg">
                              <p>Enter shipping weight and package dimensions. Use "Add Qty" to specify different weights/dimensions for multi-quantity orders (e.g., 2 units bundled together).</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs text-white/70 hover:text-white hover:bg-white/10 gap-1"
                              onClick={() => {
                                const currentQtyEntries = variation.weightPerQty || [];
                                const nextQty = currentQtyEntries.length > 0 
                                  ? Math.max(...currentQtyEntries.map(e => e.qty)) + 1 
                                  : 2;
                                onUpdateVariation(index, {
                                  weightPerQty: [...currentQtyEntries, { qty: nextQty, weight: 0 }],
                                  dimensionsPerQty: [
                                    ...(variation.dimensionsPerQty || []),
                                    { qty: nextQty, height: 0, width: 0, length: 0 }
                                  ]
                                });
                              }}
                            >
                              <Plus className="w-3 h-3" />
                              Add Qty
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p>Add weight/dimensions for bundled quantities (2 qty, 3 qty, etc.)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <CardContent className="p-4 space-y-4">
                        {/* Base (1 Qty) */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <Label className="text-xs text-muted-foreground uppercase font-medium">1 Qty (Base)</Label>
                            <Tooltip delayDuration={0}>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-3 h-3 text-muted-foreground/50 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="bottom" sideOffset={4} className="z-50 bg-popover border shadow-lg">
                                <p>Weight and dimensions for a single unit</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            {[
                              { label: 'Weight', value: variation.weight, key: 'weight', unit: 'lb', tooltip: 'Shipping weight in pounds' },
                              { label: 'Height', value: variation.height, key: 'height', unit: 'in', tooltip: 'Package height in inches' },
                              { label: 'Width', value: variation.width, key: 'width', unit: 'in', tooltip: 'Package width in inches' },
                              { label: 'Length', value: variation.length, key: 'length', unit: 'in', tooltip: 'Package length in inches' },
                            ].map((field) => (
                              <div key={field.key} className="space-y-1">
                                <Tooltip delayDuration={0}>
                                  <TooltipTrigger asChild>
                                    <Label className="text-xs text-muted-foreground uppercase font-medium cursor-help">{field.label}</Label>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p>{field.tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    value={field.value || ''}
                                    onChange={(e) => onUpdateVariation(index, { [field.key]: parseFloat(e.target.value) })}
                                    placeholder="0.00"
                                    className="h-9 text-sm pr-8"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                    {field.unit}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Additional Qty entries */}
                        {(variation.weightPerQty || []).map((entry, qtyIdx) => {
                          const dimEntry = (variation.dimensionsPerQty || [])[qtyIdx] || { height: 0, width: 0, length: 0 };
                          return (
                            <div key={entry.qty} className="space-y-2 border-t pt-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <Label className="text-xs text-muted-foreground uppercase font-medium">{entry.qty} Qty</Label>
                                  <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="w-3 h-3 text-muted-foreground/50 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" sideOffset={4} className="z-50 bg-popover border shadow-lg">
                                      <p>Weight and dimensions when shipping {entry.qty} units bundled together</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <Tooltip delayDuration={0}>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 text-destructive/70 hover:text-destructive"
                                      onClick={() => {
                                        const newWeights = (variation.weightPerQty || []).filter((_, i) => i !== qtyIdx);
                                        const newDims = (variation.dimensionsPerQty || []).filter((_, i) => i !== qtyIdx);
                                        onUpdateVariation(index, { weightPerQty: newWeights, dimensionsPerQty: newDims });
                                      }}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="left">
                                    <p>Remove this quantity entry</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <div className="grid grid-cols-4 gap-3">
                                <div className="space-y-1">
                                  <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                      <Label className="text-xs text-muted-foreground uppercase font-medium cursor-help">Weight</Label>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p>Combined shipping weight for {entry.qty} units</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      value={entry.weight || ''}
                                      onChange={(e) => {
                                        const newWeights = [...(variation.weightPerQty || [])];
                                        newWeights[qtyIdx] = { ...newWeights[qtyIdx], weight: parseFloat(e.target.value) || 0 };
                                        onUpdateVariation(index, { weightPerQty: newWeights });
                                      }}
                                      placeholder="0.00"
                                      className="h-9 text-sm pr-8"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">lb</span>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                      <Label className="text-xs text-muted-foreground uppercase font-medium cursor-help">Height</Label>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p>Package height for {entry.qty} units</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      value={dimEntry.height || ''}
                                      onChange={(e) => {
                                        const newDims = [...(variation.dimensionsPerQty || [])];
                                        newDims[qtyIdx] = { ...newDims[qtyIdx], height: parseFloat(e.target.value) || 0 };
                                        onUpdateVariation(index, { dimensionsPerQty: newDims });
                                      }}
                                      placeholder="0.00"
                                      className="h-9 text-sm pr-8"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">in</span>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                      <Label className="text-xs text-muted-foreground uppercase font-medium cursor-help">Width</Label>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p>Package width for {entry.qty} units</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      value={dimEntry.width || ''}
                                      onChange={(e) => {
                                        const newDims = [...(variation.dimensionsPerQty || [])];
                                        newDims[qtyIdx] = { ...newDims[qtyIdx], width: parseFloat(e.target.value) || 0 };
                                        onUpdateVariation(index, { dimensionsPerQty: newDims });
                                      }}
                                      placeholder="0.00"
                                      className="h-9 text-sm pr-8"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">in</span>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                      <Label className="text-xs text-muted-foreground uppercase font-medium cursor-help">Length</Label>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p>Package length for {entry.qty} units</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      value={dimEntry.length || ''}
                                      onChange={(e) => {
                                        const newDims = [...(variation.dimensionsPerQty || [])];
                                        newDims[qtyIdx] = { ...newDims[qtyIdx], length: parseFloat(e.target.value) || 0 };
                                        onUpdateVariation(index, { dimensionsPerQty: newDims });
                                      }}
                                      placeholder="0.00"
                                      className="h-9 text-sm pr-8"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">in</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>

                    {/* Row 2: Inventory */}
                    <Card className="border-muted">
                      <div className="bg-slate-800 text-white px-4 py-2 text-sm font-semibold flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        INVENTORY
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-white/50 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="bottom" sideOffset={4} className="max-w-xs z-50 bg-popover border shadow-lg">
                            <p>Track stock levels across all channels. Includes adjustments, purchases, sales, returns, available stock, allocations, reserves, and damaged inventory.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <CardContent className="p-4 grid grid-cols-9 gap-3">
                        {[
                          { label: 'Inv Qty Adj', value: variation.invQtyAdjustment, key: 'invQtyAdjustment', tooltip: 'Manual inventory quantity adjustment to correct stock discrepancies' },
                          { label: 'Purchase Qty', value: variation.purchaseQty, key: 'purchaseQty', hasBtn: true, tooltip: 'Total quantity purchased from suppliers' },
                          { label: 'Sold Qty', value: variation.soldQty, key: 'soldQty', tooltip: 'Total quantity sold across all channels' },
                          { label: 'Return Rcv Qty', value: variation.returnReceiveQty, key: 'returnReceiveQty', tooltip: 'Quantity of items returned by customers and received back' },
                          { label: 'Available Stock', value: variation.availableStock, key: 'availableStock', highlight: true, hasBtn: true, tooltip: 'Stock currently available for sale (On Hand - Allocated - Reserved)' },
                          { label: 'Qty Allocated', value: variation.quantityAllocated, key: 'quantityAllocated', tooltip: 'Quantity allocated to pending orders awaiting shipment' },
                          { label: 'Reserve Qty', value: variation.reserveQty, key: 'reserveQty', hasBtn: true, tooltip: 'Quantity held in reserve for specific purposes (promotions, B2B orders)' },
                          { label: 'Damage Qty', value: variation.damageQty, key: 'damageQty', tooltip: 'Quantity of damaged items not available for sale' },
                          { label: 'On Hand Qty', value: variation.onHandQty, key: 'onHandQty', tooltip: 'Total physical inventory in warehouse (Available + Allocated + Reserved + Damaged)' },
                        ].map((field) => (
                          <div key={field.key} className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Label className="text-xs text-muted-foreground uppercase truncate block font-medium">{field.label}</Label>
                              <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="w-3 h-3 text-muted-foreground/50 cursor-help shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent side="bottom" sideOffset={4} className="max-w-xs z-50 bg-popover border shadow-lg">
                                  <p>{field.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={field.value || 0}
                                onChange={(e) => onUpdateVariation(index, { [field.key]: parseInt(e.target.value) })}
                                className={cn(
                                  "h-9 text-sm",
                                  field.highlight && "border-emerald-500/50 bg-emerald-500/10"
                                )}
                              />
                              {field.hasBtn && (
                                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Row 3: Price */}
                    <Card className="border-muted">
                      <div className="bg-slate-800 text-white px-4 py-2 text-sm font-semibold flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        PRICE
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-white/50 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="bottom" sideOffset={4} className="max-w-xs z-50 bg-popover border shadow-lg">
                            <p>Manage pricing including purchase costs, landed cost, fees (FVF, TAC), sale price, MSRP, competitor pricing, and profit margins with BuyBox min/max thresholds.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <div className="grid grid-cols-8 gap-3">
                          {[
                            { label: 'Purchase Price', value: variation.purchasePrice, key: 'purchasePrice', prefix: '$', tooltip: 'Cost paid to supplier per unit' },
                            { label: 'Inbound Freight', value: variation.inboundFreight, key: 'inboundFreight', tooltip: 'Shipping cost to receive inventory' },
                            { label: 'Extra Duty', value: variation.extraDuty, key: 'extraDuty', tooltip: 'Import duties and customs fees' },
                            { label: 'Landed Cost', value: variation.landedCost, key: 'landedCost', prefix: '$', highlight: 'green', hasBtn: true, tooltip: 'Total cost including purchase, freight, and duties' },
                            { label: 'FVF', value: variation.fvf, key: 'fvf', prefix: '$', hasBtn: true, tooltip: 'Final Value Fee - marketplace selling fee percentage' },
                            { label: 'TAC', value: variation.tac, key: 'tac', prefix: '$', tooltip: 'Transaction Advisory Cost - payment processing fee' },
                            { label: '', value: null, key: 'empty1' },
                            { label: '', value: null, key: 'empty2' },
                          ].filter(f => f.label).map((field) => (
                            <div key={field.key} className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Label className="text-xs text-muted-foreground uppercase truncate font-medium">{field.label}</Label>
                                {field.tooltip && (
                                  <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="w-3 h-3 text-muted-foreground/50 cursor-help shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" sideOffset={4} className="z-50 bg-popover border shadow-lg">
                                      <p>{field.tooltip}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="relative flex-1">
                                  {field.prefix && (
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                      {field.prefix}
                                    </span>
                                  )}
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={field.value || ''}
                                    onChange={(e) => onUpdateVariation(index, { [field.key]: parseFloat(e.target.value) })}
                                    placeholder="0.00"
                                    className={cn(
                                      "h-9 text-sm",
                                      field.prefix && "pl-6",
                                      field.highlight === 'green' && "border-emerald-500/50 bg-emerald-500/10"
                                    )}
                                  />
                                </div>
                                {field.hasBtn && (
                                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-8 gap-3">
                          {[
                            { label: 'Sale Price', value: variation.salePrice, key: 'salePrice', prefix: '$', tooltip: 'Current selling price on marketplace' },
                            { label: 'MSRP', value: variation.msrp, key: 'msrp', prefix: '$', tooltip: 'Manufacturer Suggested Retail Price' },
                            { label: 'Competitor Price', value: variation.competitorPrice, key: 'competitorPrice', span: 2, tooltip: 'Lowest competitor price for comparison' },
                            { label: 'Profit Margin(%)', value: variation.profitMargin, key: 'profitMargin', badge: true, tooltip: 'Calculated profit percentage after all costs and fees' },
                            { label: 'Min $ (BuyBox)', value: variation.minBuyBox, key: 'minBuyBox', tooltip: 'Minimum price threshold to win BuyBox' },
                            { label: 'Max $ (BuyBox)', value: variation.maxBuyBox, key: 'maxBuyBox', tooltip: 'Maximum price ceiling for BuyBox eligibility' },
                          ].map((field) => (
                            <div key={field.key} className={cn("space-y-1", field.span === 2 && "col-span-2")}>
                              <div className="flex items-center gap-1">
                                <Label className="text-xs text-muted-foreground uppercase truncate font-medium">{field.label}</Label>
                                {field.tooltip && (
                                  <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="w-3 h-3 text-muted-foreground/50 cursor-help shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" sideOffset={4} className="z-50 bg-popover border shadow-lg">
                                      <p>{field.tooltip}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                              {field.badge ? (
                                <Badge 
                                  variant="secondary" 
                                  className={cn(
                                    "w-full justify-center h-9 text-sm font-bold",
                                    (field.value || 0) > 0 ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" : "bg-red-500/20 text-red-600 border-red-500/30"
                                  )}
                                >
                                  {(field.value || 0).toFixed(2)}%
                                </Badge>
                              ) : (
                                <div className="relative">
                                  {field.prefix && (
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                      {field.prefix}
                                    </span>
                                  )}
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={field.value || ''}
                                    onChange={(e) => onUpdateVariation(index, { [field.key]: parseFloat(e.target.value) })}
                                    placeholder="0.00"
                                    className={cn("h-9 text-sm", field.prefix && "pl-6")}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Row 4: Extra Attributes */}
                    <Card className="border-muted">
                      <div className="bg-slate-800 text-white px-4 py-2 text-sm font-semibold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Settings2 className="w-4 h-4" />
                          EXTRA PRODUCT ATTRIBUTES
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs opacity-80">({variation.extraAttributes?.length || 0} ATTRIBUTES)</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs bg-white/10 hover:bg-white/20 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newAttrs: { name: string; value: string; type?: 'text' | 'number' }[] = [...(variation.extraAttributes || []), { name: '', value: '', type: 'text' as const }];
                              onUpdateVariation(index, { extraAttributes: newAttrs });
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        {(!variation.extraAttributes || variation.extraAttributes.length === 0) ? (
                          <div className="text-center py-6">
                            <Settings2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground mb-3">No extra attributes for this variation</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateVariation(index, { extraAttributes: [{ name: '', value: '', type: 'text' as const }] });
                              }}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add First Attribute
                            </Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-3">
                            {variation.extraAttributes.map((attr, attrIdx) => (
                              <div key={attrIdx} className="bg-muted/30 rounded-lg p-3 space-y-2 group relative">
                                {/* Remove button */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newAttrs = variation.extraAttributes?.filter((_, i) => i !== attrIdx) || [];
                                    onUpdateVariation(index, { extraAttributes: newAttrs });
                                  }}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                                
                                {/* Attribute name input */}
                                <Input
                                  value={attr.name}
                                  onChange={(e) => {
                                    const newAttrs = [...(variation.extraAttributes || [])];
                                    newAttrs[attrIdx] = { ...attr, name: e.target.value };
                                    onUpdateVariation(index, { extraAttributes: newAttrs });
                                  }}
                                  placeholder="Attribute name"
                                  className="h-8 text-sm font-medium"
                                />
                                
                                {/* Type selector and value */}
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={(attr as any).type || 'text'}
                                    onValueChange={(value: 'text' | 'number') => {
                                      const newAttrs = [...(variation.extraAttributes || [])];
                                      newAttrs[attrIdx] = { ...attr, type: value };
                                      onUpdateVariation(index, { extraAttributes: newAttrs });
                                    }}
                                  >
                                    <SelectTrigger className="w-20 h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="text">Text</SelectItem>
                                      <SelectItem value="number">Number</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    value={attr.value}
                                    onChange={(e) => {
                                      const newAttrs = [...(variation.extraAttributes || [])];
                                      newAttrs[attrIdx] = { ...attr, value: e.target.value };
                                      onUpdateVariation(index, { extraAttributes: newAttrs });
                                    }}
                                    placeholder="Value"
                                    type={(attr as any).type === 'number' ? 'number' : 'text'}
                                    className="h-8 text-sm flex-1"
                                  />
                                </div>
                              </div>
                            ))}
                            
                            {/* Add attribute card */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newAttrs: { name: string; value: string; type?: 'text' | 'number' }[] = [...(variation.extraAttributes || []), { name: '', value: '', type: 'text' as const }];
                                onUpdateVariation(index, { extraAttributes: newAttrs });
                              }}
                              className="bg-muted/20 rounded-lg p-3 border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/30 transition-colors min-h-[88px]"
                            >
                              <Plus className="w-5 h-5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Add Attribute</span>
                            </button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
