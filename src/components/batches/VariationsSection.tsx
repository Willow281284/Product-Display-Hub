import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Ruler,
  Palette,
  Layers,
  ShirtIcon,
  Grid3X3,
  Scale,
  Maximize2,
  Droplets,
  Cherry,
  Beaker,
  ChevronRight,
  Package,
  Plus,
  Info,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  ImageIcon,
  DollarSign,
  Boxes,
} from 'lucide-react';
import { ChildVariation } from '@/hooks/useChildVariations';

// Validation rules for each field
interface ValidationRule {
  pattern?: RegExp;
  maxLength?: number;
  minLength?: number;
  message: string;
  type: 'error' | 'warning';
}

interface VariationField {
  key: string;
  label: string;
  icon: React.ElementType;
  placeholder: string;
  description: string;
  group: 'primary' | 'physical' | 'other';
  validationRules?: ValidationRule[];
}

// Common validation patterns
const PATTERNS = {
  alphanumericWithSpaces: /^[a-zA-Z0-9\s\-\/.,]+$/,
  dimensions: /^\d+(\.\d+)?\s*[x×]\s*\d+(\.\d+)?(\s*[x×]\s*\d+(\.\d+)?)?\s*(in|inches|cm|mm|m)?$/i,
  weight: /^\d+(\.\d+)?\s*(lbs?|kg|g|oz|pounds?|kilograms?|grams?|ounces?)?$/i,
  volume: /^\d+(\.\d+)?\s*(ml|l|oz|fl\s*oz|liters?|milliliters?|gallons?)?$/i,
};

const VARIATION_FIELDS: VariationField[] = [
  // Primary variations (most common)
  { 
    key: 'size', 
    label: 'Size', 
    icon: Ruler, 
    placeholder: 'S, M, L, XL, 32, 10.5', 
    description: 'Product size or dimensions', 
    group: 'primary',
    validationRules: [
      { maxLength: 50, message: 'Size should be less than 50 characters', type: 'error' },
      { pattern: PATTERNS.alphanumericWithSpaces, message: 'Size contains invalid characters', type: 'warning' },
    ]
  },
  { 
    key: 'color', 
    label: 'Color', 
    icon: Palette, 
    placeholder: 'Red, Blue, Navy', 
    description: 'Primary product color', 
    group: 'primary',
    validationRules: [
      { maxLength: 50, message: 'Color should be less than 50 characters', type: 'error' },
      { pattern: /^[a-zA-Z\s\-\/,]+$/, message: 'Color should only contain letters', type: 'warning' },
    ]
  },
  { 
    key: 'material', 
    label: 'Material', 
    icon: Layers, 
    placeholder: 'Cotton, Polyester, Leather', 
    description: 'Primary material composition', 
    group: 'primary',
    validationRules: [
      { maxLength: 100, message: 'Material should be less than 100 characters', type: 'error' },
    ]
  },
  { 
    key: 'style', 
    label: 'Style', 
    icon: ShirtIcon, 
    placeholder: 'Casual, Formal, Sport', 
    description: 'Product style or design type', 
    group: 'primary',
    validationRules: [
      { maxLength: 50, message: 'Style should be less than 50 characters', type: 'error' },
    ]
  },
  { 
    key: 'pattern', 
    label: 'Pattern', 
    icon: Grid3X3, 
    placeholder: 'Solid, Striped, Floral', 
    description: 'Pattern or print type', 
    group: 'primary',
    validationRules: [
      { maxLength: 50, message: 'Pattern should be less than 50 characters', type: 'error' },
    ]
  },
  
  // Physical attributes
  { 
    key: 'weight', 
    label: 'Weight', 
    icon: Scale, 
    placeholder: '2.5 lbs, 500g', 
    description: 'Product weight', 
    group: 'physical',
    validationRules: [
      { pattern: PATTERNS.weight, message: 'Use format: "2.5 lbs" or "500g"', type: 'warning' },
      { maxLength: 30, message: 'Weight should be less than 30 characters', type: 'error' },
    ]
  },
  { 
    key: 'dimensions', 
    label: 'Dimensions', 
    icon: Maximize2, 
    placeholder: '10x5x3 inches', 
    description: 'Length x Width x Height', 
    group: 'physical',
    validationRules: [
      { pattern: PATTERNS.dimensions, message: 'Use format: "10x5x3 inches" or "25x15 cm"', type: 'warning' },
      { maxLength: 50, message: 'Dimensions should be less than 50 characters', type: 'error' },
    ]
  },
  
  // Other variations
  { 
    key: 'scent', 
    label: 'Scent/Fragrance', 
    icon: Droplets, 
    placeholder: 'Lavender, Unscented', 
    description: 'Scent or fragrance type', 
    group: 'other',
    validationRules: [
      { maxLength: 50, message: 'Scent should be less than 50 characters', type: 'error' },
    ]
  },
  { 
    key: 'flavor', 
    label: 'Flavor', 
    icon: Cherry, 
    placeholder: 'Vanilla, Chocolate', 
    description: 'Flavor variant if applicable', 
    group: 'other',
    validationRules: [
      { maxLength: 50, message: 'Flavor should be less than 50 characters', type: 'error' },
    ]
  },
  { 
    key: 'capacity', 
    label: 'Capacity/Volume', 
    icon: Beaker, 
    placeholder: '500ml, 16oz', 
    description: 'Capacity or volume', 
    group: 'other',
    validationRules: [
      { pattern: PATTERNS.volume, message: 'Use format: "500ml" or "16oz"', type: 'warning' },
      { maxLength: 30, message: 'Capacity should be less than 30 characters', type: 'error' },
    ]
  },
];

const GROUP_CONFIG = {
  primary: { title: 'Primary Variations', description: 'Common product variations for sizing and appearance', icon: Package },
  physical: { title: 'Physical Attributes', description: 'Weight and dimension specifications', icon: Scale },
  other: { title: 'Other Variations', description: 'Additional variant types', icon: Layers },
};

// Re-export the ChildVariation type from the hook
export type { ChildVariation };

interface VariationsSectionProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  errors?: Record<string, boolean>;
  childVariations?: ChildVariation[];
  onVariationClick?: (variationId: string) => void;
  masterProductId?: string | null;
  isLoadingVariations?: boolean;
  currentItemId?: string;
}

export function VariationsSection({ 
  values, 
  onChange, 
  errors = {},
  childVariations = [],
  onVariationClick,
  masterProductId,
  isLoadingVariations = false,
  currentItemId,
}: VariationsSectionProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['primary']));

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  // Validate a single field against its rules
  const validateField = (field: VariationField, value: string): { type: 'error' | 'warning' | 'valid' | 'empty'; message?: string } => {
    if (!value?.trim()) return { type: 'empty' };
    
    const rules = field.validationRules || [];
    
    for (const rule of rules) {
      // Check max length
      if (rule.maxLength && value.length > rule.maxLength) {
        return { type: rule.type, message: rule.message };
      }
      
      // Check min length
      if (rule.minLength && value.length < rule.minLength) {
        return { type: rule.type, message: rule.message };
      }
      
      // Check pattern
      if (rule.pattern && !rule.pattern.test(value)) {
        return { type: rule.type, message: rule.message };
      }
    }
    
    return { type: 'valid' };
  };

  // Compute all validations
  const fieldValidations = useMemo(() => {
    const result: Record<string, { type: 'error' | 'warning' | 'valid' | 'empty'; message?: string }> = {};
    
    VARIATION_FIELDS.forEach(field => {
      const externalError = errors[field.key];
      if (externalError) {
        result[field.key] = { type: 'error', message: 'Required field' };
      } else {
        result[field.key] = validateField(field, values[field.key] || '');
      }
    });
    
    return result;
  }, [values, errors]);

  // Check consistency across child variations
  const consistencyWarnings = useMemo(() => {
    if (childVariations.length === 0) return [];
    
    const warnings: { field: string; message: string }[] = [];
    
    // Check if parent has values that children should inherit
    VARIATION_FIELDS.forEach(field => {
      const parentValue = values[field.key]?.trim();
      if (!parentValue) return;
      
      const childrenWithDifferentValue = childVariations.filter(child => {
        const childValue = child.attributes[field.key]?.trim();
        return childValue && childValue !== parentValue;
      });
      
      if (childrenWithDifferentValue.length > 0) {
        warnings.push({
          field: field.key,
          message: `${childrenWithDifferentValue.length} variation(s) have different ${field.label.toLowerCase()} values`,
        });
      }
    });
    
    return warnings;
  }, [values, childVariations]);

  // Summary stats
  const stats = useMemo(() => {
    let filled = 0, valid = 0, warnings = 0, errorCount = 0;
    
    Object.values(fieldValidations).forEach(v => {
      if (v.type === 'valid') { filled++; valid++; }
      else if (v.type === 'warning') { filled++; warnings++; }
      else if (v.type === 'error') { filled++; errorCount++; }
    });
    
    return { filled, valid, warnings, errors: errorCount, total: VARIATION_FIELDS.length };
  }, [fieldValidations]);

  const renderField = (field: VariationField) => {
    const Icon = field.icon;
    const validation = fieldValidations[field.key];
    const status = validation.type;
    
    return (
      <div
        key={field.key}
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg border transition-all",
          status === 'error' && "border-destructive bg-destructive/5",
          status === 'warning' && "border-yellow-500/50 bg-yellow-500/5",
          status === 'valid' && "border-green-500/30 bg-green-500/5",
          status === 'empty' && "border-border hover:border-muted-foreground/30"
        )}
      >
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          status === 'error' && "bg-destructive/10 text-destructive",
          status === 'warning' && "bg-yellow-500/10 text-yellow-600",
          status === 'valid' && "bg-green-500/10 text-green-600",
          status === 'empty' && "bg-muted text-muted-foreground"
        )}>
          <Icon className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor={field.key} className={cn(
              "text-sm font-medium",
              status === 'error' && "text-destructive",
              status === 'warning' && "text-yellow-600"
            )}>
              {field.label}
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">{field.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {status === 'valid' && (
              <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />
            )}
            {status === 'warning' && (
              <AlertTriangle className="w-4 h-4 text-yellow-600 ml-auto" />
            )}
            {status === 'error' && (
              <AlertCircle className="w-4 h-4 text-destructive ml-auto" />
            )}
          </div>
          <Input
            id={field.key}
            value={values[field.key] || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={cn(
              "h-9",
              status === 'error' && "border-destructive",
              status === 'warning' && "border-yellow-500"
            )}
          />
          {validation.message && (status === 'error' || status === 'warning') && (
            <p className={cn(
              "text-xs",
              status === 'error' && "text-destructive",
              status === 'warning' && "text-yellow-600"
            )}>
              {validation.message}
            </p>
          )}
        </div>
      </div>
    );
  };

  const groupedFields = VARIATION_FIELDS.reduce((acc, field) => {
    if (!acc[field.group]) acc[field.group] = [];
    acc[field.group].push(field);
    return acc;
  }, {} as Record<string, VariationField[]>);

  return (
    <div className="space-y-4">
      {/* Validation Status Summary */}
      <Card className={cn(
        "border-2 transition-colors",
        stats.errors > 0 && "bg-destructive/5 border-destructive/30",
        stats.errors === 0 && stats.warnings > 0 && "bg-yellow-500/5 border-yellow-500/30",
        stats.errors === 0 && stats.warnings === 0 && stats.filled > 0 && "bg-green-500/5 border-green-500/30",
        stats.filled === 0 && "bg-muted/50 border-muted"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                stats.errors > 0 && "bg-destructive/10 text-destructive",
                stats.errors === 0 && stats.warnings > 0 && "bg-yellow-500/10 text-yellow-600",
                stats.errors === 0 && stats.warnings === 0 && stats.filled > 0 && "bg-green-500/10 text-green-600",
                stats.filled === 0 && "bg-muted text-muted-foreground"
              )}>
                {stats.errors > 0 ? (
                  <AlertCircle className="w-5 h-5" />
                ) : stats.warnings > 0 ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : stats.filled > 0 ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <Package className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {stats.errors > 0 
                    ? 'Validation Errors Found' 
                    : stats.warnings > 0 
                      ? 'Format Suggestions' 
                      : stats.filled > 0 
                        ? 'All Valid' 
                        : 'Variation Attributes'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stats.filled} of {stats.total} attributes defined
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stats.errors > 0 && (
                <Badge variant="destructive">{stats.errors} Error{stats.errors > 1 ? 's' : ''}</Badge>
              )}
              {stats.warnings > 0 && (
                <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                  {stats.warnings} Warning{stats.warnings > 1 ? 's' : ''}
                </Badge>
              )}
              {stats.valid > 0 && (
                <Badge variant="outline" className="border-green-500 text-green-600">
                  {stats.valid} Valid
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consistency Warnings */}
      {consistencyWarnings.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <CardTitle className="text-sm text-yellow-600">Consistency Warnings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1">
              {consistencyWarnings.map((warning, idx) => (
                <li key={idx} className="text-xs text-yellow-600 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-yellow-600" />
                  {warning.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Child Variations List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Product Variations
                {masterProductId && (
                  <Badge variant="outline" className="font-mono text-xs">
                    Master ID: {masterProductId}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {childVariations.length > 0 
                  ? `${childVariations.length} related variation${childVariations.length > 1 ? 's' : ''} found. Click to view or edit.`
                  : 'No other variations found for this product'
                }
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" disabled>
              <Plus className="w-4 h-4" />
              Add Variation
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoadingVariations ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading variations...</span>
              </div>
            </div>
          ) : childVariations.length > 0 ? (
            <ScrollArea className="max-h-[320px]">
              <div className="space-y-2">
                {childVariations.map((variation) => {
                  const varAttrs = [
                    variation.attributes.color,
                    variation.attributes.size,
                    variation.attributes.material
                  ].filter(Boolean);
                  
                  const isCurrentItem = variation.id === currentItemId;
                  
                  return (
                    <button
                      key={variation.id}
                      onClick={() => !isCurrentItem && onVariationClick?.(variation.id)}
                      disabled={isCurrentItem}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all group",
                        !isCurrentItem && "hover:bg-muted/50 cursor-pointer",
                        isCurrentItem && "ring-2 ring-primary bg-primary/5 cursor-default",
                        !isCurrentItem && variation.status === 'failed' && "border-destructive/50 bg-destructive/5",
                        !isCurrentItem && variation.status === 'success' && "border-green-500/30"
                      )}
                    >
                      {/* Product Image */}
                      <Avatar className="w-12 h-12 rounded-md shrink-0">
                        {variation.image ? (
                          <AvatarImage src={variation.image} alt={variation.name} className="object-cover" />
                        ) : null}
                        <AvatarFallback className="rounded-md bg-muted">
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Status Icon */}
                      <div className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                        variation.status === 'success' && "bg-green-500/10 text-green-600",
                        variation.status === 'failed' && "bg-destructive/10 text-destructive",
                        variation.status === 'pending' && "bg-muted text-muted-foreground",
                        variation.status === 'processing' && "bg-blue-500/10 text-blue-600"
                      )}>
                        {variation.status === 'success' && <CheckCircle2 className="w-4 h-4" />}
                        {variation.status === 'failed' && <AlertCircle className="w-4 h-4" />}
                        {variation.status === 'pending' && <Package className="w-4 h-4" />}
                        {variation.status === 'processing' && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                      </div>
                      
                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{variation.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="font-mono truncate max-w-[120px]">
                            {variation.sku || variation.productId}
                          </span>
                          {varAttrs.length > 0 && (
                            <>
                              <span className="text-muted-foreground/50">•</span>
                              <span className="truncate">{varAttrs.join(' / ')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Price & Stock */}
                      <div className="flex items-center gap-3 shrink-0 text-xs">
                        {isCurrentItem && (
                          <Badge variant="outline" className="text-xs border-primary text-primary">
                            Editing
                          </Badge>
                        )}
                        {variation.salePrice != null && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <DollarSign className="w-3 h-3" />
                            <span>{variation.salePrice.toFixed(2)}</span>
                          </div>
                        )}
                        {variation.stockQty != null && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Boxes className="w-3 h-3" />
                            <span>{variation.stockQty}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Arrow - only show for non-current items */}
                      {!isCurrentItem && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="w-10 h-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No other variations in this batch</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Products with the same Master ID will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attribute Groups */}
      {(Object.keys(groupedFields) as Array<keyof typeof GROUP_CONFIG>).map(groupKey => {
        const group = GROUP_CONFIG[groupKey];
        const fields = groupedFields[groupKey];
        const isExpanded = expandedGroups.has(groupKey);
        const GroupIcon = group.icon;
        
        // Calculate group stats
        const groupStats = fields.reduce((acc, f) => {
          const v = fieldValidations[f.key];
          if (v.type === 'valid') acc.valid++;
          else if (v.type === 'warning') acc.warnings++;
          else if (v.type === 'error') acc.errors++;
          if (v.type !== 'empty') acc.filled++;
          return acc;
        }, { filled: 0, valid: 0, warnings: 0, errors: 0 });

        return (
          <Card key={groupKey}>
            <CardHeader 
              className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleGroup(groupKey)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    groupStats.errors > 0 && "bg-destructive/10 text-destructive",
                    groupStats.errors === 0 && groupStats.warnings > 0 && "bg-yellow-500/10 text-yellow-600",
                    groupStats.errors === 0 && groupStats.warnings === 0 && groupStats.filled > 0 && "bg-green-500/10 text-green-600",
                    groupStats.filled === 0 && "bg-muted text-muted-foreground"
                  )}>
                    <GroupIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">{group.title}</CardTitle>
                    <CardDescription className="text-xs">{group.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {groupStats.errors > 0 && (
                    <Badge variant="destructive" className="text-xs">{groupStats.errors}</Badge>
                  )}
                  {groupStats.warnings > 0 && (
                    <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">{groupStats.warnings}</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {groupStats.filled}/{fields.length}
                  </Badge>
                  <ChevronRight className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    isExpanded && "rotate-90"
                  )} />
                </div>
              </div>
            </CardHeader>
            
            {isExpanded && (
              <CardContent className="pt-0">
                <div className="grid gap-3 sm:grid-cols-2">
                  {fields.map(renderField)}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Help Text */}
      <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Validation Guide:</strong>
          </p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li><span className="text-green-600">Green</span> — Valid format and value</li>
            <li><span className="text-yellow-600">Yellow</span> — Suggestions for better formatting</li>
            <li><span className="text-destructive">Red</span> — Required field or format error</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
