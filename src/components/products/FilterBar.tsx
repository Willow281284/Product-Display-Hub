import { useState } from 'react';
import { FilterState, Product, SoldPeriod } from '@/types/product';
import { brands, marketplacePlatforms } from '@/data/mockProducts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  RotateCcw,
  ChevronDown,
  Building2,
  Store,
  Activity,
  DollarSign,
  Box,
  Filter,
  Plus,
  Pencil,
  Trash2,
  Check,
  Info,
  Search,
  Columns,
  HelpCircle,
  Tags,
  TrendingUp,
  CalendarIcon,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomFilter } from '@/types/customFilter';
import { CustomFilterDialog } from './CustomFilterDialog';
import { fieldLabels, operatorLabels } from '@/types/customFilter';
import { ColumnConfig } from './ProductTable';
import { Tag } from '@/types/tag';
import { TagDialog } from './TagDialog';
import { CreateProductMenu } from './CreateProductMenu';
import { CSVExcelImportDialog } from './CSVExcelImportDialog';
import { SavedFiltersDropdown } from './SavedFiltersDropdown';
import { useToast } from '@/hooks/use-toast';

// Column tooltips
const columnTooltips: Record<string, string> = {
  image: 'Product image thumbnail',
  name: 'Full product name or title',
  sku: 'Vendor Stock Keeping Unit - unique identifier from your vendor',
  brand: 'Product brand or manufacturer name',
  productId: 'Internal product identifier in your system',
  variationId: 'Variation ID - ProductID-VariationNumber for products with color/size variations',
  vendor: 'Name of the vendor or supplier',
  mpn: 'Manufacturer Part Number - unique identifier from the manufacturer',
  asin: 'Amazon Standard Identification Number - unique product ID on Amazon',
  fnsku: 'Fulfillment Network Stock Keeping Unit - Amazon FBA inventory tracking ID',
  gtin: 'Global Trade Item Number - international product identifier (includes UPC, EAN)',
  ean: 'European Article Number - 13-digit barcode used internationally',
  isbn: 'International Standard Book Number - unique identifier for books',
  landedCost: 'Total cost including product, shipping, and handling',
  shippingCost: 'Cost to ship the product to customer',
  salePrice: 'Current selling price of the product',
  purchaseQty: 'Total quantity purchased from vendor',
  soldQty: 'Total quantity sold to customers',
  stockQty: 'Current inventory quantity in stock',
  returnQty: 'Number of units returned by customers',
  profitMargin: 'Gross profit as a percentage of sale price',
  profitAmount: 'Gross profit amount in dollars',
  marketplaces: 'Sales channels where the product is listed',
  actions: 'Available actions for this product',
};

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  customFilters: CustomFilter[];
  activeFilterId: string | null;
  onSaveCustomFilter: (filter: CustomFilter) => void;
  onDeleteCustomFilter: (filterId: string) => void;
  onToggleCustomFilter: (filterId: string) => void;
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  products: Product[];
  tags: Tag[];
  productTags: Record<string, string[]>;
  onAddTag: (tag: Tag) => void;
  onDeleteTag: (tagId: string) => void;
  onCreateProducts?: (products: Record<string, string>[]) => void;
  onUpdateProducts?: (products: Record<string, string>[]) => void;
}

export function FilterBar({
  filters,
  onFilterChange,
  customFilters,
  activeFilterId,
  onSaveCustomFilter,
  onDeleteCustomFilter,
  onToggleCustomFilter,
  columns,
  onColumnsChange,
  products,
  tags,
  productTags,
  onAddTag,
  onDeleteTag,
  onCreateProducts,
  onUpdateProducts,
}: FilterBarProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<CustomFilter | null>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  const toggleColumn = (columnId: string) => {
    onColumnsChange(
      columns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleCreateFilter = () => {
    setEditingFilter(null);
    setDialogOpen(true);
  };

  const handleEditFilter = (filter: CustomFilter, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFilter(filter);
    setDialogOpen(true);
  };

  const handleSaveFilter = (filter: CustomFilter) => {
    onSaveCustomFilter(filter);
    setDialogOpen(false);
    setEditingFilter(null);
  };

  const formatCriteriaSummary = (filter: CustomFilter): string => {
    return filter.criteria
      .map((c) => {
        const field = fieldLabels[c.field];
        const operator = operatorLabels[c.operator];
        const value = c.value ? `: "${c.value}"` : '';
        return `${field} ${operator}${value}`;
      })
      .join(' AND ');
  };

  const handleBrandToggle = (brand: string) => {
    const newBrands = filters.brand.includes(brand)
      ? filters.brand.filter((b) => b !== brand)
      : [...filters.brand, brand];
    onFilterChange({ ...filters, brand: newBrands });
  };

  const handleMarketplaceToggle = (platform: string) => {
    const newMarketplaces = filters.marketplace.includes(platform)
      ? filters.marketplace.filter((m) => m !== platform)
      : [...filters.marketplace, platform];
    onFilterChange({ ...filters, marketplace: newMarketplaces });
  };

  const handleStatusToggle = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onFilterChange({ ...filters, status: newStatus });
  };

  const handleTagToggle = (tagId: string) => {
    const newTags = filters.tags.includes(tagId)
      ? filters.tags.filter((t) => t !== tagId)
      : [...filters.tags, tagId];
    onFilterChange({ ...filters, tags: newTags });
  };

  const handleReset = () => {
    onFilterChange({
      search: '',
      brand: [],
      marketplace: [],
      status: [],
      priceRange: [0, 10000],
      stockRange: [0, 10000],
      soldRange: [0, 10000],
      soldPeriod: 'all',
      soldDateRange: [null, null],
      kitProduct: null,
      hasVariation: null,
      tags: [],
    });
  };

  const activeFilterCount =
    filters.brand.length +
    filters.marketplace.length +
    filters.status.length +
    filters.tags.length +
    (filters.kitProduct !== null ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000 ? 1 : 0) +
    (filters.stockRange[0] > 0 || filters.stockRange[1] < 10000 ? 1 : 0) +
    (filters.soldRange[0] > 0 || filters.soldRange[1] < 10000 || filters.soldPeriod !== 'all' ? 1 : 0);

  const soldPeriodLabels: Record<SoldPeriod, string> = {
    all: 'All Time',
    lastMonth: 'Last Month',
    lastQuarter: 'Last Quarter',
    lastYear: 'Last Year',
    custom: 'Custom',
  };

  return (
    <div className="bg-card border-b border-border px-2 sm:px-4 py-2 sm:py-3">
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Brand Filter */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 sm:gap-2 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
                    <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Brand</span>
                    {filters.brand.length > 0 && (
                      <Badge variant="secondary" className="ml-0.5 sm:ml-1 h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs">
                        {filters.brand.length}
                      </Badge>
                    )}
                    <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="start">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {brands.map((brand) => (
                      <div key={brand} className="flex items-center space-x-2">
                        <Checkbox
                          id={`bar-brand-${brand}`}
                          checked={filters.brand.includes(brand)}
                          onCheckedChange={() => handleBrandToggle(brand)}
                        />
                        <label
                          htmlFor={`bar-brand-${brand}`}
                          className="text-sm text-foreground cursor-pointer flex-1"
                        >
                          {brand}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </TooltipTrigger>
          <TooltipContent>Filter products by brand</TooltipContent>
        </Tooltip>

        {/* Marketplace Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 sm:gap-2 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
              <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Marketplace</span>
              <span className="sm:hidden">Mkt</span>
              {filters.marketplace.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 sm:ml-1 h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs">
                  {filters.marketplace.length}
                </Badge>
              )}
              <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3" align="start">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {marketplacePlatforms.map((platform) => (
                <div key={platform} className="flex items-center space-x-2">
                  <Checkbox
                    id={`bar-platform-${platform}`}
                    checked={filters.marketplace.includes(platform)}
                    onCheckedChange={() => handleMarketplaceToggle(platform)}
                  />
                  <label
                    htmlFor={`bar-platform-${platform}`}
                    className="text-sm text-foreground cursor-pointer flex-1 capitalize"
                  >
                    {platform}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Status Filter */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 sm:gap-2 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
                    <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Status</span>
                    {filters.status.length > 0 && (
                      <Badge variant="secondary" className="ml-0.5 sm:ml-1 h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs">
                        {filters.status.length}
                      </Badge>
                    )}
                    <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3" align="start">
                  <div className="space-y-2">
                    {['live', 'inactive', 'error', 'not_listed'].map((status) => {
                      const count = status === 'not_listed'
                        ? products.filter(p => p.marketplaces.length === 0).length
                        : products.filter(p => p.marketplaces.some(m => m.status === status)).length;
                      
                      const statusLabel = status === 'not_listed' ? 'Not Listed' : status;
                      const dotColor = status === 'live' 
                        ? 'bg-live' 
                        : status === 'error' 
                          ? 'bg-destructive' 
                          : status === 'not_listed'
                            ? 'bg-muted-foreground'
                            : 'bg-inactive';
                      
                      return (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={`bar-status-${status}`}
                            checked={filters.status.includes(status)}
                            onCheckedChange={() => handleStatusToggle(status)}
                          />
                          <label
                            htmlFor={`bar-status-${status}`}
                            className="text-sm text-foreground cursor-pointer flex-1 capitalize flex items-center justify-between"
                          >
                            <span className="flex items-center gap-2">
                              <span className={cn('w-2 h-2 rounded-full', dotColor)} />
                              {statusLabel}
                            </span>
                            <span className="text-xs text-muted-foreground">{count}</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </TooltipTrigger>
          <TooltipContent>Filter by listing status</TooltipContent>
        </Tooltip>

        {/* Price Range Filter */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 sm:gap-2 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
                    <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Price</span>
                    {(filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) && (
                      <Badge variant="secondary" className="ml-0.5 sm:ml-1 h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs">
                        <span className="hidden sm:inline">${filters.priceRange[0]} - ${filters.priceRange[1]}</span>
                        <span className="sm:hidden">✓</span>
                      </Badge>
                    )}
                    <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-4" align="start">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">From</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <Input
                            type="number"
                            min={0}
                            value={filters.priceRange[0]}
                            onChange={(e) =>
                              onFilterChange({
                                ...filters,
                                priceRange: [Number(e.target.value) || 0, filters.priceRange[1]],
                              })
                            }
                            className="pl-6 h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <span className="text-muted-foreground mt-5">–</span>
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">To</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <Input
                            type="number"
                            min={0}
                            value={filters.priceRange[1]}
                            onChange={(e) =>
                              onFilterChange({
                                ...filters,
                                priceRange: [filters.priceRange[0], Number(e.target.value) || 0],
                              })
                            }
                            className="pl-6 h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="10000"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </TooltipTrigger>
          <TooltipContent>Filter by price range</TooltipContent>
        </Tooltip>

        {/* Stock Range Filter */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 sm:gap-2 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
                    <Box className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Stock</span>
                    {(filters.stockRange[0] > 0 || filters.stockRange[1] < 10000) && (
                      <Badge variant="secondary" className="ml-0.5 sm:ml-1 h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs">
                        <span className="hidden sm:inline">{filters.stockRange[0]} - {filters.stockRange[1]}</span>
                        <span className="sm:hidden">✓</span>
                      </Badge>
                    )}
                    <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-4" align="start">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">From</label>
                        <Input
                          type="number"
                          min={0}
                          value={filters.stockRange[0]}
                          onChange={(e) =>
                            onFilterChange({
                              ...filters,
                              stockRange: [Number(e.target.value) || 0, filters.stockRange[1]],
                            })
                          }
                          className="h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                        />
                      </div>
                      <span className="text-muted-foreground mt-5">–</span>
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">To</label>
                        <Input
                          type="number"
                          min={0}
                          value={filters.stockRange[1]}
                          onChange={(e) =>
                            onFilterChange({
                              ...filters,
                              stockRange: [filters.stockRange[0], Number(e.target.value) || 0],
                            })
                          }
                          className="h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="10000"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </TooltipTrigger>
          <TooltipContent>Filter by stock quantity</TooltipContent>
        </Tooltip>

        {/* Sold Qty Filter */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 sm:gap-2 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Sold</span>
                    {(filters.soldRange[0] > 0 || filters.soldRange[1] < 10000 || filters.soldPeriod !== 'all') && (
                      <Badge variant="secondary" className="ml-0.5 sm:ml-1 h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs">
                        <span className="hidden sm:inline">
                          {filters.soldPeriod === 'custom' && filters.soldDateRange[0] && filters.soldDateRange[1]
                            ? `${format(filters.soldDateRange[0], 'MMM d')} - ${format(filters.soldDateRange[1], 'MMM d')}`
                            : soldPeriodLabels[filters.soldPeriod]}
                        </span>
                        <span className="sm:hidden">✓</span>
                      </Badge>
                    )}
                    <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4" align="start">
                  <div className="space-y-4">
                    {/* Time Period Selection */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block font-medium">Time Period</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['all', 'lastMonth', 'lastQuarter', 'lastYear', 'custom'] as SoldPeriod[]).map((period) => (
                          <Button
                            key={period}
                            variant={filters.soldPeriod === period ? 'default' : 'outline'}
                            size="sm"
                            className={cn("h-8 text-xs", period === 'custom' && 'col-span-2')}
                            onClick={() => onFilterChange({ ...filters, soldPeriod: period })}
                          >
                            {soldPeriodLabels[period]}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Date Range */}
                    {filters.soldPeriod === 'custom' && (
                      <div className="space-y-3 border-t border-border pt-3">
                        <label className="text-xs text-muted-foreground block font-medium">Date Range</label>
                        <div className="flex items-center gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "flex-1 justify-start text-left font-normal h-9",
                                  !filters.soldDateRange[0] && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {filters.soldDateRange[0] ? format(filters.soldDateRange[0], "MMM d, yyyy") : "Start date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={filters.soldDateRange[0] || undefined}
                                onSelect={(date) => onFilterChange({
                                  ...filters,
                                  soldDateRange: [date || null, filters.soldDateRange[1]]
                                })}
                                disabled={(date) => date > new Date()}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          <span className="text-muted-foreground">–</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "flex-1 justify-start text-left font-normal h-9",
                                  !filters.soldDateRange[1] && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {filters.soldDateRange[1] ? format(filters.soldDateRange[1], "MMM d, yyyy") : "End date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={filters.soldDateRange[1] || undefined}
                                onSelect={(date) => onFilterChange({
                                  ...filters,
                                  soldDateRange: [filters.soldDateRange[0], date || null]
                                })}
                                disabled={(date) => 
                                  date > new Date() || 
                                  (filters.soldDateRange[0] ? date < filters.soldDateRange[0] : false)
                                }
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                          Note: Custom date filtering requires sales date data
                        </p>
                      </div>
                    )}
                    
                    {/* Quantity Range */}
                    <div className={filters.soldPeriod === 'custom' ? 'border-t border-border pt-3' : ''}>
                      <label className="text-xs text-muted-foreground mb-2 block font-medium">Quantity Range</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground mb-1 block">From</label>
                          <Input
                            type="number"
                            min={0}
                            value={filters.soldRange[0]}
                            onChange={(e) =>
                              onFilterChange({
                                ...filters,
                                soldRange: [Number(e.target.value) || 0, filters.soldRange[1]],
                              })
                            }
                            className="h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                          />
                        </div>
                        <span className="text-muted-foreground mt-5">–</span>
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground mb-1 block">To</label>
                          <Input
                            type="number"
                            min={0}
                            value={filters.soldRange[1]}
                            onChange={(e) =>
                              onFilterChange({
                                ...filters,
                                soldRange: [filters.soldRange[0], Number(e.target.value) || 0],
                              })
                            }
                            className="h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="10000"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </TooltipTrigger>
          <TooltipContent>Filter by sold quantity over time</TooltipContent>
        </Tooltip>

        {/* Product Type Filter */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Box className="w-4 h-4" />
                    Type
                    {(filters.kitProduct !== null || filters.hasVariation !== null) && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {[
                          filters.kitProduct === true ? 'Kit' : filters.kitProduct === false ? 'Single' : null,
                          filters.hasVariation === true ? 'Variation' : filters.hasVariation === false ? 'No Var' : null,
                        ].filter(Boolean).join(', ') || '1'}
                      </Badge>
                    )}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="start">
                  <div className="space-y-4">
                    {/* Kit/Single Filter */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Product Type</p>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="bar-kit-all"
                            checked={filters.kitProduct === null}
                            onCheckedChange={() =>
                              onFilterChange({ ...filters, kitProduct: null })
                            }
                          />
                          <label
                            htmlFor="bar-kit-all"
                            className="text-sm text-foreground cursor-pointer"
                          >
                            All Products
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="bar-kit-yes"
                            checked={filters.kitProduct === true}
                            onCheckedChange={() =>
                              onFilterChange({ ...filters, kitProduct: true })
                            }
                          />
                          <label
                            htmlFor="bar-kit-yes"
                            className="text-sm text-foreground cursor-pointer"
                          >
                            Kit Products
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="bar-kit-no"
                            checked={filters.kitProduct === false}
                            onCheckedChange={() =>
                              onFilterChange({ ...filters, kitProduct: false })
                            }
                          />
                          <label
                            htmlFor="bar-kit-no"
                            className="text-sm text-foreground cursor-pointer"
                          >
                            Single Products
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Variation Filter */}
                    <div className="border-t border-border pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Variations</p>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="bar-var-all"
                            checked={filters.hasVariation === null}
                            onCheckedChange={() =>
                              onFilterChange({ ...filters, hasVariation: null })
                            }
                          />
                          <label
                            htmlFor="bar-var-all"
                            className="text-sm text-foreground cursor-pointer"
                          >
                            All Products
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="bar-var-yes"
                            checked={filters.hasVariation === true}
                            onCheckedChange={() =>
                              onFilterChange({ ...filters, hasVariation: true })
                            }
                          />
                          <label
                            htmlFor="bar-var-yes"
                            className="text-sm text-foreground cursor-pointer"
                          >
                            With Variations
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="bar-var-no"
                            checked={filters.hasVariation === false}
                            onCheckedChange={() =>
                              onFilterChange({ ...filters, hasVariation: false })
                            }
                          />
                          <label
                            htmlFor="bar-var-no"
                            className="text-sm text-foreground cursor-pointer"
                          >
                            No Variations
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </TooltipTrigger>
          <TooltipContent>Filter by product type and variations</TooltipContent>
        </Tooltip>

        {/* Tags Filter */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Tags className="w-4 h-4" />
                    Tags
                    {filters.tags.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {filters.tags.length}
                      </Badge>
                    )}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Filter by Tags</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          setEditingTag(null);
                          setTagDialogOpen(true);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        New Tag
                      </Button>
                    </div>
                    {tags.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No tags created yet
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {tags.map((tag) => {
                          const count = Object.values(productTags).filter(
                            (tagIds) => tagIds.includes(tag.id)
                          ).length;
                          return (
                            <div key={tag.id} className="flex items-center justify-between group">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`bar-tag-${tag.id}`}
                                  checked={filters.tags.includes(tag.id)}
                                  onCheckedChange={() => handleTagToggle(tag.id)}
                                />
                                <label
                                  htmlFor={`bar-tag-${tag.id}`}
                                  className="text-sm cursor-pointer flex items-center gap-2"
                                >
                                  <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: tag.color }}
                                  />
                                  {tag.name}
                                  <span className="text-xs text-muted-foreground">({count})</span>
                                </label>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTag(tag);
                                    setTagDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTag(tag.id);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </TooltipTrigger>
          <TooltipContent>Filter and manage tags</TooltipContent>
        </Tooltip>

        {/* Search Input - After Type */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="relative w-full sm:w-64 md:w-80 lg:w-96">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) =>
                  onFilterChange({ ...filters, search: e.target.value })
                }
                className="pl-8 h-8 text-sm"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>Search by product name, SKU, or brand</TooltipContent>
        </Tooltip>

        {/* Reset Button */}
        {activeFilterCount > 0 && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-muted-foreground hover:text-foreground gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear all quick filters</TooltipContent>
          </Tooltip>
        )}

        {/* Spacer to push custom filters to the right */}
        <div className="flex-1" />

        {/* Custom Filters - Right Side */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={activeFilterId ? 'default' : 'outline'}
                    size="sm"
                    className="gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Custom Filters
                    {customFilters.length > 0 && (
                      <Badge
                        variant={activeFilterId ? 'outline' : 'secondary'}
                        className="ml-1 h-5 px-1.5"
                      >
                        {customFilters.length}
                      </Badge>
                    )}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuItem onClick={handleCreateFilter} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create New Filter
                  </DropdownMenuItem>

                  {customFilters.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        Saved Filters
                      </div>
                      {customFilters.map((filter) => {
                        const isActive = activeFilterId === filter.id;
                        return (
                          <DropdownMenuItem
                            key={filter.id}
                            className={cn(
                              'flex items-center justify-between group cursor-pointer',
                              isActive && 'bg-primary/10'
                            )}
                            onClick={() => onToggleCustomFilter(filter.id)}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {isActive && (
                                <Check className="w-4 h-4 text-primary shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className={cn(
                                  'text-sm font-medium truncate',
                                  isActive && 'text-primary'
                                )}>
                                  {filter.name}
                                </div>
                                <Tooltip delayDuration={0}>
                                  <TooltipTrigger asChild>
                                    <div className="text-xs text-muted-foreground truncate">
                                      {filter.criteria.length} criteria
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="max-w-[280px]">
                                    <p className="text-xs">{formatCriteriaSummary(filter)}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => handleEditFilter(filter, e)}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteCustomFilter(filter.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </DropdownMenuItem>
                        );
                      })}
                    </>
                  )}

                  {customFilters.length === 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-3 py-4 text-center">
                        <Filter className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-muted-foreground">
                          No custom filters yet
                        </p>
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Create reusable filter rules to quickly find products matching specific criteria
          </TooltipContent>
        </Tooltip>

        {/* Clear Active Custom Filter Button */}
        {activeFilterId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleCustomFilter(activeFilterId)}
            className="text-primary hover:text-primary gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Custom
          </Button>
        )}

        {/* Columns Button - Next to Custom Filters */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Columns className="w-4 h-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto bg-popover">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((column) => (
                  <Tooltip key={column.id} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <DropdownMenuCheckboxItem
                        checked={column.visible}
                        onCheckedChange={() => toggleColumn(column.id)}
                        className="flex items-center justify-between"
                      >
                        <span>{column.label}</span>
                        {columnTooltips[column.id] && (
                          <HelpCircle className="w-3 h-3 text-muted-foreground ml-2" />
                        )}
                      </DropdownMenuCheckboxItem>
                    </TooltipTrigger>
                    {columnTooltips[column.id] && (
                      <TooltipContent side="left" className="max-w-[200px]">
                        <p className="text-xs">{columnTooltips[column.id]}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent>Show or hide table columns</TooltipContent>
        </Tooltip>

        {/* Saved Filters Dropdown */}
        <SavedFiltersDropdown
          filters={customFilters}
          activeFilterId={activeFilterId}
          onToggleFilter={onToggleCustomFilter}
          onDeleteFilter={(id) => {
            onDeleteCustomFilter(id);
            toast({
              title: "Filter deleted",
              description: "Saved filter has been removed",
            });
          }}
        />

        {/* Update Products via CSV */}
        {onUpdateProducts && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setUpdateDialogOpen(true)}
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Update via</span> CSV
            </Button>
            <CSVExcelImportDialog
              open={updateDialogOpen}
              onOpenChange={setUpdateDialogOpen}
              mode="update"
              onImport={(products) => {
                onUpdateProducts(products);
                setUpdateDialogOpen(false);
              }}
            />
          </>
        )}

        {/* Create Product Menu */}
        {onCreateProducts && (
          <CreateProductMenu onCreateProducts={onCreateProducts} />
        )}
      </div>

      <CustomFilterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        filter={editingFilter}
        onSave={handleSaveFilter}
      />

      <TagDialog
        open={tagDialogOpen}
        onOpenChange={setTagDialogOpen}
        tag={editingTag}
        onSave={onAddTag}
      />
    </div>
  );
}
