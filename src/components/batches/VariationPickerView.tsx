import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarketplaceLogo } from '@/components/products/MarketplaceLogo';
import { ChildVariation } from '@/hooks/useChildVariations';
import { BatchItem } from '@/types/batch';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  Package,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ImageIcon,
  DollarSign,
  Boxes,
  Loader2,
  Layers,
  Palette,
  Ruler,
  Shirt,
} from 'lucide-react';

interface VariationPickerViewProps {
  currentItem: BatchItem;
  variations: ChildVariation[];
  masterProductId: string | null;
  isLoading: boolean;
  onSelectVariation: (variationId: string) => void;
  onEditCurrent: () => void;
}

export function VariationPickerView({
  currentItem,
  variations,
  masterProductId,
  isLoading,
  onSelectVariation,
  onEditCurrent,
}: VariationPickerViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentItemAttrs, setCurrentItemAttrs] = useState<Record<string, string>>({});

  // Fetch attributes for the current item
  useEffect(() => {
    async function fetchCurrentItemAttributes() {
      const { data: attrs } = await supabase
        .from('product_attributes')
        .select('attribute_key, attribute_value')
        .eq('batch_item_id', currentItem.id);

      const attributes: Record<string, string> = {};
      (attrs || []).forEach(attr => {
        if (attr.attribute_value) {
          attributes[attr.attribute_key] = attr.attribute_value;
        }
      });
      setCurrentItemAttrs(attributes);
    }

    fetchCurrentItemAttributes();
  }, [currentItem.id]);

  // All variations including the current item
  const allVariations: ChildVariation[] = [
    {
      id: currentItem.id,
      name: currentItem.product_name,
      sku: currentItem.product_sku || '',
      productId: currentItem.product_id,
      variationId: currentItem.product_id,
      image: currentItem.product_image,
      marketplace: currentItem.marketplace,
      attributes: currentItemAttrs,
      status: currentItem.status as 'pending' | 'processing' | 'success' | 'failed',
      salePrice: currentItem.sale_price,
      stockQty: currentItem.stock_qty,
    },
    ...variations,
  ];

  // Count statuses
  const statusCounts = allVariations.reduce(
    (acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Product Variations
              {masterProductId && (
                <Badge variant="outline" className="font-mono text-xs">
                  Master: {masterProductId}
                </Badge>
              )}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              This product has {allVariations.length} variation{allVariations.length > 1 ? 's' : ''}. 
              Select one to view and edit its details.
            </p>
          </div>
          <MarketplaceLogo platform={currentItem.marketplace} size="lg" />
        </div>

        {/* Status Summary */}
        <div className="flex items-center gap-3 mt-4">
          {statusCounts.success > 0 && (
            <Badge variant="outline" className="border-green-500 text-green-600 gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {statusCounts.success} Live
            </Badge>
          )}
          {statusCounts.failed > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              {statusCounts.failed} Error{statusCounts.failed > 1 ? 's' : ''}
            </Badge>
          )}
          {statusCounts.pending > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Package className="w-3 h-3" />
              {statusCounts.pending} Pending
            </Badge>
          )}
          {statusCounts.processing > 0 && (
            <Badge variant="outline" className="border-blue-500 text-blue-600 gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {statusCounts.processing} Processing
            </Badge>
          )}
        </div>
      </div>

      {/* Variations List */}
      <ScrollArea className="flex-1 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading variations...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 max-w-4xl mx-auto">
            {allVariations.map((variation, index) => {
              const varAttrs = [
                variation.attributes?.color,
                variation.attributes?.size,
                variation.attributes?.material,
              ].filter(Boolean);
              
              const isSelected = selectedId === variation.id;

              return (
                <button
                  key={variation.id}
                  onClick={() => {
                    setSelectedId(variation.id);
                  }}
                  onDoubleClick={() => {
                    if (variation.id === currentItem.id) {
                      onEditCurrent();
                    } else {
                      onSelectVariation(variation.id);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:bg-muted/50 group",
                    // Selection state takes priority
                    isSelected && "ring-2 ring-primary border-primary bg-primary/5",
                    // Status-based styling when not selected
                    !isSelected && variation.status === 'failed' && "border-destructive/50 bg-destructive/5",
                    !isSelected && variation.status === 'success' && "border-green-500/30 bg-green-500/5",
                    !isSelected && variation.status === 'pending' && "border-muted"
                  )}
                >
                  {/* Product Image */}
                  <Avatar className="w-16 h-16 rounded-lg shrink-0">
                    {variation.image ? (
                      <AvatarImage src={variation.image} alt={variation.name} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="rounded-lg bg-muted">
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>

                  {/* Status Icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      variation.status === 'success' && "bg-green-500/10 text-green-600",
                      variation.status === 'failed' && "bg-destructive/10 text-destructive",
                      variation.status === 'pending' && "bg-muted text-muted-foreground",
                      variation.status === 'processing' && "bg-blue-500/10 text-blue-600"
                    )}
                  >
                    {variation.status === 'success' && <CheckCircle2 className="w-5 h-5" />}
                    {variation.status === 'failed' && <AlertCircle className="w-5 h-5" />}
                    {variation.status === 'pending' && <Package className="w-5 h-5" />}
                    {variation.status === 'processing' && (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    )}
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-base truncate">{variation.name}</p>
                      {index === 0 && (
                        <Badge variant="outline" className="text-xs shrink-0">Current</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span className="font-mono truncate max-w-[180px]">
                        {variation.sku || variation.productId}
                      </span>
                    </div>
                    {/* Variation Attributes - Always show required fields */}
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className={cn(
                        "flex items-center gap-1 text-xs",
                        variation.attributes?.color ? "text-muted-foreground" : "text-destructive/70"
                      )}>
                        <Palette className="w-3 h-3" />
                        <span>{variation.attributes?.color || 'Not set'}</span>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 text-xs",
                        variation.attributes?.size ? "text-muted-foreground" : "text-destructive/70"
                      )}>
                        <Ruler className="w-3 h-3" />
                        <span>{variation.attributes?.size || 'Not set'}</span>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 text-xs",
                        variation.attributes?.material ? "text-muted-foreground" : "text-destructive/70"
                      )}>
                        <Shirt className="w-3 h-3" />
                        <span>{variation.attributes?.material || 'Not set'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Marketplace */}
                  <div className="flex items-center gap-2 shrink-0">
                    <MarketplaceLogo platform={variation.marketplace} size="sm" />
                    <Badge 
                      variant={variation.status === 'success' ? 'outline' : variation.status === 'failed' ? 'destructive' : 'secondary'}
                      className={cn(
                        "text-xs",
                        variation.status === 'success' && "border-green-500 text-green-600"
                      )}
                    >
                      {variation.status === 'success' ? 'Live' : 
                       variation.status === 'failed' ? 'Error' : 
                       variation.status === 'processing' ? 'Processing' : 'Pending'}
                    </Badge>
                  </div>

                  {/* Price & Stock */}
                  <div className="flex items-center gap-4 shrink-0 text-sm">
                    {variation.salePrice != null && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">{variation.salePrice.toFixed(2)}</span>
                      </div>
                    )}
                    {variation.stockQty != null && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Boxes className="w-4 h-4" />
                        <span className="font-medium">{variation.stockQty}</span>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      variant={isSelected ? "default" : "ghost"} 
                      size="sm" 
                      className={cn(
                        "gap-1.5",
                        !isSelected && "group-hover:bg-primary group-hover:text-primary-foreground"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (variation.id === currentItem.id) {
                          onEditCurrent();
                        } else {
                          onSelectVariation(variation.id);
                        }
                      }}
                    >
                      Edit
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
