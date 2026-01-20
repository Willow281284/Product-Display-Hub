import { useState, useEffect, useRef } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarketplaceLogo } from '@/components/products/MarketplaceLogo';
import { AttributeValidationChecklist } from './AttributeValidationChecklist';
import { InventoryPricingSection } from './InventoryPricingSection';
import { IdentifiersSection } from './IdentifiersSection';
import { VariationsSection } from './VariationsSection';
import { ExtraAttributesSection } from './ExtraAttributesSection';
import { VariationPickerView } from './VariationPickerView';
import { APlusContentEditor } from './APlusContentEditor';
import { useProductAttributes } from '@/hooks/useProductAttributes';
import { useChildVariations } from '@/hooks/useChildVariations';
import { BatchItem } from '@/types/batch';
import { CategoryAttribute, SECTION_LABELS, AttributeSection } from '@/types/productAttribute';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertCircle,
  Save,
  RefreshCw,
  Loader2,
  HelpCircle,
  CheckCircle2,
  ImageIcon,
  X,
  Upload,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface ProductAttributeEditorProps {
  item: BatchItem | null;
  batchId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveAndRetry: (itemId: string, updates: {
    product_name: string;
    product_sku: string | null;
    stock_qty: number | null;
    sale_price: number | null;
    profit_margin: number | null;
  }) => Promise<void>;
  onNavigateToItem?: (itemId: string) => void;
}

export function ProductAttributeEditor({
  item,
  batchId,
  open,
  onOpenChange,
  onSaveAndRetry,
  onNavigateToItem,
}: ProductAttributeEditorProps) {
  const {
    categories,
    categoryAttributes,
    productAttributes,
    isLoading,
    fetchCategories,
    fetchCategoryAttributes,
    fetchProductAttributes,
    saveProductAttributes,
    updateBatchItemCategory,
    validateAttributes,
  } = useProductAttributes();

  const {
    childVariations,
    isLoading: isLoadingVariations,
    masterProductId,
    fetchChildVariations,
    clearVariations,
  } = useChildVariations();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<AttributeSection>('basic');
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Variation picker is optional; by default we open the editor directly.
  const [showVariationPicker, setShowVariationPicker] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open, fetchCategories]);

  // Track current item ID to prevent re-running effect on same item
  const [initializedItemId, setInitializedItemId] = useState<string | null>(null);
  const [isLoadingItem, setIsLoadingItem] = useState(false);

  // Load item data when entering editor mode (not picker mode)
  useEffect(() => {
    if (item && open && !showVariationPicker && initializedItemId !== item.id) {
      // Clear previous data immediately when switching items
      setAttributeValues({});
      setIsLoadingItem(true);
      setInitializedItemId(item.id);
      
      // Set category if exists
      if (item.category_id) {
        setSelectedCategoryId(item.category_id);
        fetchCategoryAttributes(item.category_id);
      } else if (categories.length > 0) {
        // Default to first category
        setSelectedCategoryId(categories[0].id);
        fetchCategoryAttributes(categories[0].id);
      }
      
      // Fetch existing attributes for THIS specific variation
      fetchProductAttributes(item.id).then(attrs => {
        const values: Record<string, string> = {};
        attrs.forEach(a => {
          if (a.attribute_value) {
            values[a.attribute_key] = a.attribute_value;
          }
        });
        // Pre-fill from batch item data (unique per variation)
        values['title'] = values['title'] || item.product_name;
        values['price'] = values['price'] || (item.sale_price?.toString() || '');
        values['quantity'] = values['quantity'] || (item.stock_qty?.toString() || '');
        setAttributeValues(values);
        setIsLoadingItem(false);
      }).catch(() => {
        setIsLoadingItem(false);
      });

      // Re-fetch sibling variations for the Variations tab
      if (batchId) {
        fetchChildVariations(item, batchId);
      }
    }
  }, [item, open, categories, fetchCategoryAttributes, fetchProductAttributes, initializedItemId, batchId, fetchChildVariations, showVariationPicker]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setInitializedItemId(null);
      setShowVariationPicker(false);
      clearVariations();
    }
  }, [open, clearVariations]);

  // Handle category change
  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    await fetchCategoryAttributes(categoryId);
    if (item) {
      await updateBatchItemCategory(item.id, categoryId);
    }
  };

  // AI-powered auto-fill for category and attributes
  const handleAIAutoFill = async () => {
    if (!item || categories.length === 0) return;
    
    setIsSuggestingCategory(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-category', {
        body: {
          productName: item.product_name,
          productDescription: attributeValues['description'] || '',
          categories: categories.map(c => ({ id: c.id, name: c.name })),
          categoryAttributes: categoryAttributes.map(attr => ({
            attribute_key: attr.attribute_key,
            attribute_name: attr.attribute_name,
            attribute_type: attr.attribute_type,
          })),
        },
      });

      if (error) throw error;

      // Apply suggested category first - this will fetch new category attributes
      if (data?.suggestedCategoryId) {
        setSelectedCategoryId(data.suggestedCategoryId);
        await fetchCategoryAttributes(data.suggestedCategoryId);
        if (item) {
          await updateBatchItemCategory(item.id, data.suggestedCategoryId);
        }
      }

      // Apply suggested attributes after category is set
      if (data?.suggestedAttributes) {
        // Use a small delay to ensure state has updated
        setTimeout(() => {
          setAttributeValues(prev => {
            const newValues = { ...prev };
            let fieldsUpdated = 0;
            
            Object.entries(data.suggestedAttributes).forEach(([key, value]) => {
              if (value && typeof value === 'string' && value.trim()) {
                // Only fill if the field is empty or has minimal content
                if (!newValues[key] || newValues[key].trim().length < 3) {
                  newValues[key] = value.trim();
                  fieldsUpdated++;
                }
              }
            });
            
            if (fieldsUpdated > 0) {
              toast.success(`AI filled ${fieldsUpdated} fields including category`);
            } else {
              toast.success('Category suggested by AI');
            }
            
            return newValues;
          });
        }, 100);
      } else {
        toast.success('Category suggested by AI');
      }
    } catch (error) {
      console.error('AI auto-fill error:', error);
      toast.error('Failed to auto-fill with AI');
    } finally {
      setIsSuggestingCategory(false);
    }
  };

  // Handle attribute value change
  const handleValueChange = (key: string, value: string) => {
    setAttributeValues(prev => ({ ...prev, [key]: value }));
  };

  // Handle image upload - supports adding multiple images
  const handleImageUpload = async (key: string, file: File) => {
    if (!item) return;
    
    setUploadingImages(prev => ({ ...prev, [key]: true }));
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${item.id}/${key}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);
      
      // Get existing images and append new one
      const existingValue = attributeValues[key] || '';
      const existingImages = existingValue ? existingValue.split(',').filter(Boolean) : [];
      const newImages = [...existingImages, urlData.publicUrl];
      handleValueChange(key, newImages.join(','));
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImages(prev => ({ ...prev, [key]: false }));
    }
  };

  // Handle adding image URL
  const handleAddImageUrl = (key: string, url: string) => {
    if (!url.trim()) return;
    const existingValue = attributeValues[key] || '';
    const existingImages = existingValue ? existingValue.split(',').filter(Boolean) : [];
    const newImages = [...existingImages, url.trim()];
    handleValueChange(key, newImages.join(','));
  };

  // Handle image removal - removes specific image by index
  const handleImageRemove = (key: string, indexToRemove?: number) => {
    if (indexToRemove === undefined) {
      handleValueChange(key, '');
    } else {
      const existingValue = attributeValues[key] || '';
      const existingImages = existingValue.split(',').filter(Boolean);
      const newImages = existingImages.filter((_, idx) => idx !== indexToRemove);
      handleValueChange(key, newImages.join(','));
    }
  };

  // Scroll to attribute
  const scrollToAttribute = (key: string) => {
    const attr = categoryAttributes.find(a => a.attribute_key === key);
    if (attr) {
      setActiveSection(attr.section as AttributeSection);
      setTimeout(() => {
        const element = document.getElementById(`attr-${key}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element?.focus();
      }, 100);
    }
  };

  // Save and retry
  const handleSaveAndRetry = async () => {
    if (!item) return;
    
    setIsSaving(true);
    try {
      // Save all attributes
      await saveProductAttributes(item.id, attributeValues);
      
      // Update batch item with core fields
      await onSaveAndRetry(item.id, {
        product_name: attributeValues['title'] || item.product_name,
        product_sku: attributeValues['upc'] || item.product_sku,
        stock_qty: attributeValues['quantity'] ? parseInt(attributeValues['quantity']) : item.stock_qty,
        sale_price: attributeValues['price'] ? parseFloat(attributeValues['price']) : item.sale_price,
        profit_margin: item.profit_margin,
      });
      
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Save only (for live products)
  const handleSaveOnly = async () => {
    if (!item) return;
    
    setIsSaving(true);
    try {
      await saveProductAttributes(item.id, attributeValues);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Get validations - pass current form values for real-time validation
  const validations = validateAttributes(categoryAttributes, productAttributes, attributeValues);
  const hasErrors = validations.some(v => v.isMissing);

  // Group attributes by section - map old pricing/inventory to combined inventory_pricing
  const attributesBySection = categoryAttributes.reduce((acc, attr) => {
    let section = attr.section as string;
    // Map old section names to new combined section
    if (section === 'pricing' || section === 'inventory') {
      section = 'inventory_pricing';
    }
    const typedSection = section as AttributeSection;
    if (!acc[typedSection]) acc[typedSection] = [];
    acc[typedSection].push(attr);
    return acc;
  }, {} as Record<AttributeSection, CategoryAttribute[]>);

  if (!item) return null;

  const isLive = item.status === 'success';

  // Determine if we should show the variation picker
  // Note: we only show the picker when the user explicitly clicks "← All Variations".
  const hasVariations = childVariations.length > 0;
  const showPicker = showVariationPicker && hasVariations;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[98vw] !w-[98vw] !h-[98vh] !max-h-[98vh] flex flex-col p-0">
        {/* Show Variation Picker if product has variations and not yet selected */}
        {showPicker ? (
          <>
            <VariationPickerView
              currentItem={item}
              variations={childVariations}
              masterProductId={masterProductId}
              isLoading={isLoadingVariations}
              onSelectVariation={(variationId) => {
                // Navigate to selected variation and show editor
                if (onNavigateToItem) {
                  onNavigateToItem(variationId);
                }
                setShowVariationPicker(false);
              }}
              onEditCurrent={() => {
                // Edit the current item
                setShowVariationPicker(false);
              }}
            />
          </>
        ) : (
          <>
            <DialogHeader className="px-6 py-4 border-b shrink-0 pr-14">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <DialogTitle className="flex items-center gap-2">
                    {hasVariations && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mr-2 gap-1"
                        onClick={() => setShowVariationPicker(true)}
                      >
                        ← All Variations
                      </Button>
                    )}
                    {item.status === 'failed' ? (
                      <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    )}
                    {isLive ? 'Edit Live Product' : 'Fix Error & Update Attributes'}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    {isLive 
                      ? 'Update product attributes and sync changes to marketplace'
                      : 'Fill in required attributes highlighted in red, then retry the listing'
                    }
                  </DialogDescription>
                </div>
                <div className="shrink-0">
                  <MarketplaceLogo platform={item.marketplace} size="lg" />
                </div>
              </div>
              
              {/* Error Message */}
              {item.error_message && (
                <div className="mt-3 bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-destructive">Error Message</p>
                      <p className="text-muted-foreground mt-1">{item.error_message}</p>
                    </div>
                  </div>
                </div>
              )}
            </DialogHeader>

        <div className="flex-1 flex overflow-hidden relative">
          {/* Loading overlay when switching between variations */}
          {isLoadingItem && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading variation data...</p>
              </div>
            </div>
          )}
          
          {/* Main Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Category Selector */}
            <div className="px-6 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-4 flex-wrap">
                <Label htmlFor="category" className="shrink-0">Product Category:</Label>
                <div className="flex items-center gap-2">
                  <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAIAutoFill}
                    disabled={isSuggestingCategory || categories.length === 0}
                    className="gap-1.5"
                  >
                    {isSuggestingCategory ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    AI Auto-Fill
                  </Button>
                </div>
                {hasErrors && (
                  <Badge 
                    variant={showOnlyMissing ? "default" : "destructive"} 
                    className="ml-auto cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setShowOnlyMissing(!showOnlyMissing)}
                  >
                    {showOnlyMissing ? "Show All Fields" : `${validations.filter(v => v.isMissing).length} required fields missing (click to filter)`}
                  </Badge>
                )}
              </div>
            </div>

            {/* Section Tabs */}
            <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as AttributeSection)} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="mx-6 mt-3 justify-start shrink-0">
                {(Object.keys(SECTION_LABELS) as AttributeSection[]).map(section => {
                  const sectionAttrs = attributesBySection[section] || [];
                  const sectionValidations = validations.filter(v => v.section === section);
                  const hasMissing = sectionValidations.some(v => v.isMissing);
                  
                  // Always show these hardcoded sections, others only if they have attributes
                  const alwaysShowSections: AttributeSection[] = ['inventory_pricing', 'identifiers', 'variations', 'extra_attributes'];
                  if (sectionAttrs.length === 0 && !alwaysShowSections.includes(section)) return null;
                  
                  return (
                    <TabsTrigger 
                      key={section} 
                      value={section}
                      className={cn(
                        "relative",
                        hasMissing && "text-destructive"
                      )}
                    >
                      {SECTION_LABELS[section]}
                      {hasMissing && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <ScrollArea className="flex-1 px-6 py-4">
                {(Object.keys(SECTION_LABELS) as AttributeSection[]).map(section => (
                  <TabsContent key={section} value={section} className="mt-0 space-y-4">
                    {/* Use specialized components for specific sections */}
                    {section === 'inventory_pricing' ? (
                      <div ref={el => sectionRefs.current[section] = el}>
                        <InventoryPricingSection
                          values={attributeValues}
                          onChange={handleValueChange}
                          errors={validations.reduce((acc, v) => {
                            if (v.isMissing) acc[v.key] = true;
                            return acc;
                          }, {} as Record<string, boolean>)}
                        />
                      </div>
                    ) : section === 'identifiers' ? (
                      <div ref={el => sectionRefs.current[section] = el}>
                        <IdentifiersSection
                          values={attributeValues}
                          onChange={handleValueChange}
                          errors={validations.reduce((acc, v) => {
                            if (v.isMissing) acc[v.key] = true;
                            return acc;
                          }, {} as Record<string, boolean>)}
                        />
                      </div>
                    ) : section === 'variations' ? (
                      <div ref={el => sectionRefs.current[section] = el}>
                        <VariationsSection
                          values={attributeValues}
                          onChange={handleValueChange}
                          errors={validations.reduce((acc, v) => {
                            if (v.isMissing) acc[v.key] = true;
                            return acc;
                          }, {} as Record<string, boolean>)}
                          childVariations={childVariations}
                          isLoadingVariations={isLoadingVariations}
                          masterProductId={masterProductId}
                          currentItemId={item?.id}
                          onVariationClick={(variationId) => {
                            // Navigate to the clicked variation item
                            if (onNavigateToItem) {
                              onNavigateToItem(variationId);
                            }
                          }}
                        />
                      </div>
                    ) : section === 'extra_attributes' ? (
                      <div ref={el => sectionRefs.current[section] = el}>
                        <ExtraAttributesSection
                          values={attributeValues}
                          onChange={handleValueChange}
                          errors={validations.reduce((acc, v) => {
                            if (v.isMissing) acc[v.key] = true;
                            return acc;
                          }, {} as Record<string, boolean>)}
                        />
                      </div>
                    ) : (
                    <div 
                      ref={el => sectionRefs.current[section] = el}
                      className="grid gap-4"
                    >
                      {(attributesBySection[section] || [])
                        .filter(attr => {
                          if (!showOnlyMissing) return true;
                          const validation = validations.find(v => v.key === attr.attribute_key);
                          return validation?.isMissing;
                        })
                        .map(attr => {
                        const validation = validations.find(v => v.key === attr.attribute_key);
                        const hasError = validation?.isMissing || !validation?.isValid;
                        
                        return (
                          <div 
                            key={attr.attribute_key}
                            id={`attr-${attr.attribute_key}`}
                            className={cn(
                              "space-y-2 p-3 rounded-lg border transition-colors",
                              hasError ? "border-destructive bg-destructive/5" : "border-transparent"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Label 
                                htmlFor={attr.attribute_key}
                                className={cn(hasError && "text-destructive")}
                              >
                                {attr.attribute_name}
                                {attr.is_required && <span className="text-destructive ml-1">*</span>}
                              </Label>
                              {attr.help_text && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs bg-popover border z-50">
                                      <p>{attr.help_text}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {validation?.isValid && !validation?.isMissing && (
                                <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />
                              )}
                            </div>
                            
                            {attr.attribute_type === 'aplus_content' ? (
                              <APlusContentEditor
                                value={attributeValues[attr.attribute_key] || ''}
                                onChange={(v) => handleValueChange(attr.attribute_key, v)}
                                batchItemId={item?.id || ''}
                              />
                            ) : attr.attribute_type === 'multiline' ? (
                              <Textarea
                                id={attr.attribute_key}
                                value={attributeValues[attr.attribute_key] || ''}
                                onChange={e => handleValueChange(attr.attribute_key, e.target.value)}
                                placeholder={attr.placeholder || ''}
                                rows={4}
                                className={cn(hasError && "border-destructive")}
                              />
                            ) : attr.attribute_type === 'image' ? (
                              <div className="space-y-3">
                                {/* Multiple Image Previews */}
                                {(() => {
                                  const imageUrls = (attributeValues[attr.attribute_key] || '').split(',').filter(Boolean);
                                  return imageUrls.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {imageUrls.map((url, idx) => (
                                        <div key={idx} className="relative w-24 h-24 rounded-lg border bg-muted overflow-hidden group">
                                          <img 
                                            src={url.trim()} 
                                            alt={`Preview ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                            }}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleImageRemove(attr.attribute_key, idx)}
                                            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
                                            {idx + 1}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })()}
                                
                                {/* Upload or URL input for adding more */}
                                <div className="flex items-center gap-2">
                                  <input
                                    ref={el => fileInputRefs.current[attr.attribute_key] = el}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                      const files = e.target.files;
                                      if (files) {
                                        Array.from(files).forEach(file => {
                                          handleImageUpload(attr.attribute_key, file);
                                        });
                                      }
                                      e.target.value = '';
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRefs.current[attr.attribute_key]?.click()}
                                    disabled={uploadingImages[attr.attribute_key]}
                                    className="shrink-0"
                                  >
                                    {uploadingImages[attr.attribute_key] ? (
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                      <Upload className="w-4 h-4 mr-2" />
                                    )}
                                    Add Images
                                  </Button>
                                  <span className="text-muted-foreground text-sm">or</span>
                                  <Input
                                    id={`${attr.attribute_key}-url`}
                                    placeholder={attr.placeholder || 'Paste image URL and press Enter'}
                                    className={cn("flex-1", hasError && "border-destructive")}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddImageUrl(attr.attribute_key, e.currentTarget.value);
                                        e.currentTarget.value = '';
                                      }
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={(e) => {
                                      const input = document.getElementById(`${attr.attribute_key}-url`) as HTMLInputElement;
                                      if (input?.value) {
                                        handleAddImageUrl(attr.attribute_key, input.value);
                                        input.value = '';
                                      }
                                    }}
                                  >
                                    Add URL
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Upload multiple images or add URLs. Images are numbered in order.
                                </p>
                              </div>
                            ) : attr.attribute_type === 'select' ? (
                              <Select 
                                value={attributeValues[attr.attribute_key] || ''} 
                                onValueChange={(v) => handleValueChange(attr.attribute_key, v)}
                              >
                                <SelectTrigger className={cn(hasError && "border-destructive")}>
                                  <SelectValue placeholder={attr.placeholder || 'Select...'} />
                                </SelectTrigger>
                                <SelectContent className="bg-background border z-50">
                                  <SelectItem value="new">New</SelectItem>
                                  <SelectItem value="used">Used</SelectItem>
                                  <SelectItem value="refurbished">Refurbished</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                id={attr.attribute_key}
                                type={attr.attribute_type === 'number' ? 'number' : 'text'}
                                value={attributeValues[attr.attribute_key] || ''}
                                onChange={e => handleValueChange(attr.attribute_key, e.target.value)}
                                placeholder={attr.placeholder || ''}
                                className={cn(hasError && "border-destructive")}
                              />
                            )}
                            
                            {hasError && validation?.message && (
                              <p className="text-xs text-destructive">{validation.message}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    )}
                  </TabsContent>
                ))}
              </ScrollArea>
            </Tabs>
          </div>

          {/* Validation Sidebar */}
          <div className="w-72 border-l bg-muted/20 shrink-0 overflow-hidden flex flex-col">
            <AttributeValidationChecklist 
              validations={validations}
              onAttributeClick={scrollToAttribute}
            />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {isLive ? (
            <Button onClick={handleSaveOnly} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save & Sync to Marketplace
            </Button>
          ) : (
            <Button onClick={handleSaveAndRetry} disabled={isSaving || hasErrors}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Save & Retry Listing
            </Button>
          )}
        </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
