import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Copy,
  Check,
  Barcode,
  Tag,
  Box,
  BookOpen,
  ShoppingCart,
  Factory,
  Package,
  Globe,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface IdentifiersSectionProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  errors: Record<string, boolean>;
}

// Identifier metadata with icons and descriptions
const IDENTIFIER_CONFIG = [
  {
    key: 'sku',
    label: 'SKU',
    icon: Tag,
    placeholder: 'ABC-12345-XYZ',
    description: 'Your internal Stock Keeping Unit',
    group: 'internal',
  },
  {
    key: 'manufacturer_number',
    label: 'Manufacturer Part Number',
    icon: Factory,
    placeholder: 'MPN-XXXXX',
    description: 'Part number assigned by manufacturer',
    group: 'internal',
  },
  {
    key: 'barcode',
    label: 'Barcode',
    icon: Barcode,
    placeholder: '012345678901',
    description: 'Physical barcode on product packaging',
    group: 'standard',
  },
  {
    key: 'gtin',
    label: 'GTIN',
    icon: Globe,
    placeholder: '00012345678905',
    description: 'Global Trade Item Number (8, 12, 13, or 14 digits)',
    group: 'standard',
  },
  {
    key: 'ean',
    label: 'EAN',
    icon: Package,
    placeholder: '5901234123457',
    description: 'European Article Number (13 digits)',
    group: 'standard',
  },
  {
    key: 'isbn',
    label: 'ISBN',
    icon: BookOpen,
    placeholder: '978-3-16-148410-0',
    description: 'International Standard Book Number (books only)',
    group: 'standard',
  },
  {
    key: 'asin',
    label: 'ASIN',
    icon: ShoppingCart,
    placeholder: 'B08N5WRWNW',
    description: 'Amazon Standard Identification Number',
    group: 'marketplace',
  },
  {
    key: 'fnsku',
    label: 'FNSKU',
    icon: Box,
    placeholder: 'X001234567',
    description: 'Fulfillment Network SKU for Amazon FBA',
    group: 'marketplace',
  },
];

const GROUP_LABELS: Record<string, { title: string; description: string }> = {
  internal: {
    title: 'Internal Identifiers',
    description: 'Your company\'s product tracking codes',
  },
  standard: {
    title: 'Universal Product Codes',
    description: 'Industry-standard product identifiers',
  },
  marketplace: {
    title: 'Marketplace Identifiers',
    description: 'Platform-specific product codes',
  },
};

export function IdentifiersSection({ values, onChange, errors }: IdentifiersSectionProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    toast.success(`${IDENTIFIER_CONFIG.find(c => c.key === key)?.label || key} copied`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Group identifiers
  const groupedIdentifiers = IDENTIFIER_CONFIG.reduce((acc, config) => {
    if (!acc[config.group]) acc[config.group] = [];
    acc[config.group].push(config);
    return acc;
  }, {} as Record<string, typeof IDENTIFIER_CONFIG>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedIdentifiers).map(([group, identifiers]) => (
        <Card key={group} className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {group === 'internal' && <Tag className="w-4 h-4 text-primary" />}
              {group === 'standard' && <Globe className="w-4 h-4 text-primary" />}
              {group === 'marketplace' && <ShoppingCart className="w-4 h-4 text-primary" />}
              {GROUP_LABELS[group].title}
            </CardTitle>
            <CardDescription className="text-sm">
              {GROUP_LABELS[group].description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-4 sm:grid-cols-2">
              {identifiers.map((config) => {
                const hasError = errors[config.key];
                const value = values[config.key] || '';
                const Icon = config.icon;
                
                return (
                  <div
                    key={config.key}
                    id={`attr-${config.key}`}
                    className={cn(
                      "relative p-3 rounded-lg border transition-all",
                      hasError 
                        ? "border-destructive bg-destructive/5" 
                        : value 
                          ? "border-primary/30 bg-primary/5" 
                          : "border-border/50 bg-muted/20 hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
                        hasError 
                          ? "bg-destructive/10 text-destructive" 
                          : value 
                            ? "bg-primary/10 text-primary" 
                            : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Label 
                            htmlFor={config.key}
                            className={cn(
                              "text-sm font-medium",
                              hasError && "text-destructive"
                            )}
                          >
                            {config.label}
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs bg-popover border z-50">
                                <p className="text-xs">{config.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <Input
                            id={config.key}
                            value={value}
                            onChange={(e) => onChange(config.key, e.target.value)}
                            placeholder={config.placeholder}
                            className={cn(
                              "h-8 text-sm font-mono",
                              hasError && "border-destructive focus-visible:ring-destructive"
                            )}
                          />
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  disabled={!value}
                                  onClick={() => handleCopy(config.key, value)}
                                >
                                  {copiedKey === config.key ? (
                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-popover border z-50">
                                <p className="text-xs">Copy to clipboard</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Quick tip */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/30">
        <HelpCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Tip:</span> Most marketplaces require at least one universal product code (GTIN, EAN, or ISBN) for product listing. Amazon FBA products need an FNSKU for warehouse identification.
        </div>
      </div>
    </div>
  );
}
