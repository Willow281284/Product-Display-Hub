import { useState } from 'react';
import { Product } from '@/types/product';
import { MarketplaceBadge } from './MarketplaceBadge';
import { MarketplaceDialog } from './MarketplaceDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  ChevronUp,
  Package,
  Edit,
  MoreHorizontal,
  Copy,
  Trash2,
  ExternalLink,
  Box,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMarketplaceDialogOpen, setIsMarketplaceDialogOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="p-4">
          {/* Main Row */}
          <div className="flex items-start gap-4">
            {/* Product Image - Clickable to expand */}
            <div 
              className="relative flex-shrink-0 cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-16 h-16 rounded-lg object-cover bg-muted"
              />
              {product.kitProduct && (
                <div className="absolute -top-1 -right-1">
                  <Badge variant="secondary" className="h-5 px-1 text-[10px]">
                    <Box className="w-3 h-3" />
                  </Badge>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {/* Product Name - Clickable to expand, wraps naturally */}
                  <h3 
                    className="font-semibold text-foreground pr-2 cursor-pointer hover:text-primary transition-colors break-words"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {product.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded break-all">
                      {product.vendorSku}
                    </span>
                    <span>•</span>
                    <span className="break-words">{product.brand}</span>
                  </div>
                </div>

                {/* Price & Profit - Clickable to expand */}
                <div 
                  className="text-right flex-shrink-0 cursor-pointer"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <div className="text-lg font-bold text-foreground">
                    {formatCurrency(product.salePrice)}
                  </div>
                  {product.grossProfitPercent > 0 && (
                    <div className="text-sm text-success font-medium">
                      +{product.grossProfitPercent}% profit
                    </div>
                  )}
                </div>
              </div>

              {/* Marketplace Badges or Not Listed */}
              <div className="flex flex-wrap gap-2 mt-3">
                {product.marketplaces.length > 0 ? (
                  product.marketplaces.map((mp) => (
                    <MarketplaceBadge
                      key={mp.platform}
                      marketplace={mp}
                      onClick={() => setIsMarketplaceDialogOpen(true)}
                    />
                  ))
                ) : (
                  <Badge variant="secondary" className="text-muted-foreground">
                    Not Listed
                  </Badge>
                )}
              </div>

              {/* Quick Stats Row */}
              <div className="flex items-center gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Stock:</span>
                  <span className={cn(
                    'font-medium',
                    product.stockQty === 0 ? 'text-destructive' : 'text-foreground'
                  )}>
                    {product.stockQty}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  Sold: <span className="font-medium text-foreground">{product.soldQty}</span>
                </div>
                {product.returnQty > 0 && (
                  <div className="text-warning">
                    Returns: <span className="font-medium">{product.returnQty}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions - Stop propagation to prevent expand/collapse when clicking buttons */}
            <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="default"
                size="sm"
                className="gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                Update
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Box className="w-4 h-4 mr-2" />
                    Sub Products
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="sm"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Expanded Details with Animation */}
          <div 
            className={cn(
              "overflow-hidden transition-all duration-200 ease-out",
              isExpanded ? "max-h-96 opacity-100 mt-4 pt-4 border-t border-border" : "max-h-0 opacity-0"
            )}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Vendor Info */}
                  <div className="space-y-2 min-w-0">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Vendor Info
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="break-words">
                        <span className="text-muted-foreground">Product ID:</span>{' '}
                        <span className="font-mono break-all">{product.productId}</span>
                      </div>
                      <div className="break-words">
                        <span className="text-muted-foreground">Vendor:</span>{' '}
                        <span className="break-words">{product.vendorName || '—'}</span>
                      </div>
                      <div className="break-words">
                        <span className="text-muted-foreground">MPN:</span>{' '}
                        <span className="font-mono break-all">{product.manufacturerPart || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-2 min-w-0">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Pricing
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="break-words">
                        <span className="text-muted-foreground">Landed Cost:</span>{' '}
                        <span className="break-all">{formatCurrency(product.landedCost)}</span>
                      </div>
                      <div className="break-words">
                        <span className="text-muted-foreground">Shipping:</span>{' '}
                        <span className="break-all">{formatCurrency(product.shippingCost)}</span>
                      </div>
                      <div className="break-words">
                        <span className="text-muted-foreground">Sale Price:</span>{' '}
                        <span className="font-semibold break-all">{formatCurrency(product.salePrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Inventory */}
                  <div className="space-y-2 min-w-0">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Inventory
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="break-words">
                        <span className="text-muted-foreground">Purchased:</span>{' '}
                        {product.purchaseQty}
                      </div>
                      <div className="break-words">
                        <span className="text-muted-foreground">Sold:</span>{' '}
                        {product.soldQty}
                      </div>
                      <div className="break-words">
                        <span className="text-muted-foreground">In Stock:</span>{' '}
                        <span className={cn(
                          'font-semibold',
                          product.stockQty === 0 ? 'text-destructive' : 'text-success'
                        )}>
                          {product.stockQty}
                        </span>
                      </div>
                      <div className="break-words">
                        <span className="text-muted-foreground">Returns:</span>{' '}
                        {product.returnQty}
                      </div>
                    </div>
                  </div>

                  {/* Profit */}
                  <div className="space-y-2 min-w-0">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Profit
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="break-words">
                        <span className="text-muted-foreground">Margin:</span>{' '}
                        <span className={cn(
                          'font-semibold',
                          product.grossProfitPercent > 0 ? 'text-success' : 'text-muted-foreground'
                        )}>
                          {product.grossProfitPercent}%
                        </span>
                      </div>
                      <div className="break-words">
                        <span className="text-muted-foreground">Amount:</span>{' '}
                        <span className="font-semibold break-all">
                          {formatCurrency(product.grossProfitAmount)}
                        </span>
                      </div>
                      {product.inventoryDifference !== 0 && (
                        <div className="break-words">
                          <span className="text-muted-foreground">Inv. Diff:</span>{' '}
                          <span className={cn(
                            'font-semibold',
                            product.inventoryDifference > 0 ? 'text-warning' : 'text-destructive'
                          )}>
                            {product.inventoryDifference}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Marketplace Dialog */}
      <MarketplaceDialog
        product={product}
        open={isMarketplaceDialogOpen}
        onOpenChange={setIsMarketplaceDialogOpen}
      />
    </>
  );
}
