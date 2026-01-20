import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Package,
  Ruler,
  Scale,
  Plus,
  Trash2,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ExtraAttribute {
  id: string;
  name: string;
  value: string;
  type: 'text' | 'number';
  required: boolean;
}

interface ExtraAttributesSectionProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  errors?: Record<string, boolean>;
}

// Required attributes - Weight and Dimensions
const REQUIRED_ATTRIBUTES = [
  {
    key: 'product_weight',
    label: 'Product Weight',
    unit: 'lbs',
    icon: Scale,
    description: 'Weight of the product for shipping calculations',
    placeholder: '0.00',
  },
  {
    key: 'product_length',
    label: 'Length',
    unit: 'in',
    icon: Ruler,
    description: 'Product length in inches',
    placeholder: '0.00',
  },
  {
    key: 'product_width',
    label: 'Width',
    unit: 'in',
    icon: Ruler,
    description: 'Product width in inches',
    placeholder: '0.00',
  },
  {
    key: 'product_height',
    label: 'Height',
    unit: 'in',
    icon: Ruler,
    description: 'Product height in inches',
    placeholder: '0.00',
  },
];

// Optional predefined attributes
const OPTIONAL_PREDEFINED = [
  { key: 'package_weight', label: 'Package Weight', unit: 'lbs', type: 'number' as const },
  { key: 'package_length', label: 'Package Length', unit: 'in', type: 'number' as const },
  { key: 'package_width', label: 'Package Width', unit: 'in', type: 'number' as const },
  { key: 'package_height', label: 'Package Height', unit: 'in', type: 'number' as const },
  { key: 'country_of_origin', label: 'Country of Origin', unit: '', type: 'text' as const },
  { key: 'warranty_info', label: 'Warranty Information', unit: '', type: 'text' as const },
  { key: 'material', label: 'Material', unit: '', type: 'text' as const },
  { key: 'color', label: 'Color', unit: '', type: 'text' as const },
  { key: 'size', label: 'Size', unit: '', type: 'text' as const },
];

export function ExtraAttributesSection({ values, onChange, errors = {} }: ExtraAttributesSectionProps) {
  // Parse custom attributes from stored JSON
  const parseCustomAttributes = (): ExtraAttribute[] => {
    try {
      const stored = values['custom_extra_attributes'];
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error parsing custom attributes:', e);
    }
    return [];
  };

  const customAttributes = parseCustomAttributes();

  const updateCustomAttributes = (newAttributes: ExtraAttribute[]) => {
    onChange('custom_extra_attributes', JSON.stringify(newAttributes));
  };

  const addCustomAttribute = () => {
    const newAttr: ExtraAttribute = {
      id: `custom_${Date.now()}`,
      name: '',
      value: '',
      type: 'text',
      required: false,
    };
    updateCustomAttributes([...customAttributes, newAttr]);
  };

  const removeCustomAttribute = (id: string) => {
    updateCustomAttributes(customAttributes.filter(attr => attr.id !== id));
  };

  const updateCustomAttribute = (id: string, field: keyof ExtraAttribute, value: string | boolean) => {
    updateCustomAttributes(
      customAttributes.map(attr =>
        attr.id === id ? { ...attr, [field]: value } : attr
      )
    );
  };

  // Check if required fields are filled
  const isRequiredFilled = (key: string) => {
    const value = values[key];
    return value && value.trim() !== '' && parseFloat(value) > 0;
  };

  return (
    <div className="space-y-6">
      {/* Required Attributes - Weight & Dimensions */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            Required Attributes
            <span className="text-xs text-muted-foreground font-normal ml-2">
              (Weight & Dimensions)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Weight */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-40 shrink-0">
              <Scale className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm text-muted-foreground">
                Weight
              </Label>
              <span className="text-destructive">*</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs bg-popover border z-50">
                    <p className="text-xs">Product weight for shipping calculations</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={values['product_weight'] || ''}
                onChange={(e) => onChange('product_weight', e.target.value)}
                className={cn(
                  "w-32 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                  errors['product_weight'] && "border-destructive"
                )}
                placeholder="0.00"
              />
              <span className="text-sm text-muted-foreground">lbs</span>
              {isRequiredFilled('product_weight') && (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              )}
            </div>
          </div>

          {/* Dimensions Row */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm text-muted-foreground">
                Dimensions (L × W × H)
              </Label>
              <span className="text-destructive">*</span>
            </div>
            <div className="flex items-center gap-2 ml-6">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={values['product_length'] || ''}
                onChange={(e) => onChange('product_length', e.target.value)}
                className={cn(
                  "w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                  errors['product_length'] && "border-destructive"
                )}
                placeholder="L"
              />
              <span className="text-muted-foreground">×</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={values['product_width'] || ''}
                onChange={(e) => onChange('product_width', e.target.value)}
                className={cn(
                  "w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                  errors['product_width'] && "border-destructive"
                )}
                placeholder="W"
              />
              <span className="text-muted-foreground">×</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={values['product_height'] || ''}
                onChange={(e) => onChange('product_height', e.target.value)}
                className={cn(
                  "w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                  errors['product_height'] && "border-destructive"
                )}
                placeholder="H"
              />
              <span className="text-sm text-muted-foreground">in</span>
              {isRequiredFilled('product_length') && 
               isRequiredFilled('product_width') && 
               isRequiredFilled('product_height') && (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optional Predefined Attributes */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Optional Attributes
            <span className="text-xs text-muted-foreground font-normal ml-2">
              (Package Info & Specifications)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-4 sm:grid-cols-2">
            {OPTIONAL_PREDEFINED.map((attr) => (
              <div key={attr.key} className="flex items-center gap-3">
                <Label className="w-32 text-sm text-muted-foreground shrink-0 truncate">
                  {attr.label}
                </Label>
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type={attr.type}
                    step={attr.type === 'number' ? '0.01' : undefined}
                    min={attr.type === 'number' ? '0' : undefined}
                    value={values[attr.key] || ''}
                    onChange={(e) => onChange(attr.key, e.target.value)}
                    className={cn(
                      "flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                      errors[attr.key] && "border-destructive"
                    )}
                    placeholder={attr.type === 'number' ? '0.00' : `Enter ${attr.label.toLowerCase()}`}
                  />
                  {attr.unit && (
                    <span className="text-sm text-muted-foreground w-8">{attr.unit}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Attributes */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Custom Attributes
              <span className="text-xs text-muted-foreground font-normal ml-2">
                (Add your own)
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomAttribute}
              className="gap-1.5 text-primary border-primary hover:bg-primary/10"
            >
              <Plus className="w-4 h-4" />
              Add Attribute
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {customAttributes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No custom attributes added yet</p>
              <p className="text-xs mt-1">Click "Add Attribute" to create custom fields</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-[1fr_1fr_100px_auto] gap-2 text-sm font-medium text-muted-foreground px-1">
                <span>Attribute Name</span>
                <span>Value</span>
                <span>Type</span>
                <span className="w-9" />
              </div>
              
              {customAttributes.map((attr) => (
                <div key={attr.id} className="grid grid-cols-[1fr_1fr_100px_auto] gap-2 items-center">
                  <Input
                    value={attr.name}
                    onChange={(e) => updateCustomAttribute(attr.id, 'name', e.target.value)}
                    placeholder="Attribute name"
                    className="text-sm"
                  />
                  <Input
                    type={attr.type}
                    value={attr.value}
                    onChange={(e) => updateCustomAttribute(attr.id, 'value', e.target.value)}
                    placeholder={attr.type === 'number' ? '0' : 'Value'}
                    className={cn(
                      "text-sm",
                      attr.type === 'number' && "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    )}
                  />
                  <Select
                    value={attr.type}
                    onValueChange={(value) => updateCustomAttribute(attr.id, 'type', value)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCustomAttribute(attr.id)}
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick tip */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/30">
        <HelpCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Tip:</span> Accurate weight and dimensions are crucial for shipping cost calculations. Package dimensions should include all packaging materials.
        </div>
      </div>
    </div>
  );
}
