import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Package,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  AlertTriangle,
  Lock,
  ShoppingCart,
  Warehouse,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface InventorySectionProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  errors: Record<string, boolean>;
}

// Inventory field configurations
const INVENTORY_FIELDS = [
  {
    key: 'inventory_adjustment_qty',
    label: 'Inventory Adjustment Qty',
    icon: TrendingUp,
    description: 'Manual adjustments to inventory count',
    highlight: false,
  },
  {
    key: 'purchase_qty',
    label: 'Purchase Qty',
    icon: ShoppingCart,
    description: 'Total quantity purchased from suppliers',
    highlight: false,
  },
  {
    key: 'sold_qty',
    label: 'Sold Qty',
    icon: TrendingDown,
    description: 'Total quantity sold',
    highlight: false,
  },
  {
    key: 'return_resellable_qty',
    label: 'Return Resellable Qty',
    icon: RotateCcw,
    description: 'Returned items that can be resold',
    highlight: false,
  },
  {
    key: 'allocated_qty',
    label: 'Allocated Qty',
    icon: Lock,
    description: 'Quantity allocated to pending orders',
    highlight: false,
  },
  {
    key: 'reserve_qty',
    label: 'Reserve Qty',
    icon: Lock,
    description: 'Quantity held in reserve (safety stock)',
    highlight: false,
  },
  {
    key: 'damage_qty',
    label: 'Damage Qty',
    icon: AlertTriangle,
    description: 'Quantity damaged and unsellable',
    highlight: false,
  },
  {
    key: 'available_stock',
    label: 'Available Stock',
    icon: CheckCircle2,
    description: 'Stock available for immediate sale',
    highlight: true,
    required: true,
  },
  {
    key: 'on_hand_qty',
    label: 'On Hand Qty',
    icon: Warehouse,
    description: 'Total physical inventory in warehouse',
    highlight: true,
  },
];

export function InventorySection({ values, onChange, errors }: InventorySectionProps) {
  // Calculate summary values
  const available = parseInt(values['available_stock'] || '0') || 0;
  const onHand = parseInt(values['on_hand_qty'] || '0') || 0;
  const allocated = parseInt(values['allocated_qty'] || '0') || 0;
  const reserved = parseInt(values['reserve_qty'] || '0') || 0;
  const damaged = parseInt(values['damage_qty'] || '0') || 0;

  const renderField = (field: typeof INVENTORY_FIELDS[0], isWide: boolean = false) => {
    const hasError = errors[field.key];
    const value = values[field.key] || '';
    const Icon = field.icon;
    
    return (
      <div
        key={field.key}
        id={`attr-${field.key}`}
        className={cn(
          "relative p-4 rounded-lg border transition-all",
          isWide && "col-span-2",
          field.highlight
            ? "bg-muted/50 border-border"
            : "border-border/50 bg-background",
          hasError && "border-destructive bg-destructive/5"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn(
              "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
              hasError 
                ? "bg-destructive/10 text-destructive" 
                : field.highlight
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Label 
                  htmlFor={field.key}
                  className={cn(
                    "text-sm font-medium truncate",
                    hasError && "text-destructive"
                  )}
                >
                  {field.label}
                </Label>
                {field.required && <span className="text-destructive">*</span>}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs bg-popover border z-50">
                      <p className="text-xs">{field.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <Input
                id={field.key}
                type="number"
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder="0"
                className={cn(
                  "mt-1.5 h-9 text-lg font-semibold font-mono",
                  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                  hasError && "border-destructive focus-visible:ring-destructive",
                  field.highlight && "bg-background"
                )}
              />
            </div>
          </div>
          
          {/* Alert indicator for fields that affect calculations */}
          {!field.highlight && (
            <div className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">!</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Inventory Status Header */}
      <Card className="border-border/50 bg-gradient-to-r from-slate-900 to-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Package className="w-5 h-5" />
            INVENTORY STATUS
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-xs text-white/70">On Hand</p>
              <p className="text-2xl font-bold text-white">{onHand}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-xs text-white/70">Available</p>
              <p className="text-2xl font-bold text-green-400">{available}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-xs text-white/70">Allocated</p>
              <p className="text-2xl font-bold text-yellow-400">{allocated}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-xs text-white/70">Reserved</p>
              <p className="text-2xl font-bold text-blue-400">{reserved}</p>
            </div>
          </div>
          
          {damaged > 0 && (
            <div className="flex items-center gap-2 text-destructive bg-destructive/20 rounded-lg p-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">{damaged} damaged items</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Adjustments */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Stock Movement
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {renderField(INVENTORY_FIELDS[0], true)} {/* Inventory Adjustment */}
            {renderField(INVENTORY_FIELDS[1], true)} {/* Purchase Qty */}
            {renderField(INVENTORY_FIELDS[2], true)} {/* Sold Qty */}
          </div>
        </CardContent>
      </Card>

      {/* Returns & Allocations */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-primary" />
            Returns & Allocations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-3 sm:grid-cols-2">
            {renderField(INVENTORY_FIELDS[3])} {/* Return Resellable */}
            {renderField(INVENTORY_FIELDS[4])} {/* Allocated */}
            {renderField(INVENTORY_FIELDS[5])} {/* Reserve */}
            {renderField(INVENTORY_FIELDS[6])} {/* Damage */}
          </div>
        </CardContent>
      </Card>

      {/* Stock Summary */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-primary" />
            Stock Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-3 sm:grid-cols-2">
            {renderField(INVENTORY_FIELDS[7])} {/* Available Stock */}
            {renderField(INVENTORY_FIELDS[8])} {/* On Hand */}
          </div>
        </CardContent>
      </Card>

      {/* Quick tip */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/30">
        <HelpCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Tip:</span> Available Stock = On Hand - Allocated - Reserved - Damaged. Keep your inventory accurate to avoid overselling on marketplaces.
        </div>
      </div>
    </div>
  );
}
