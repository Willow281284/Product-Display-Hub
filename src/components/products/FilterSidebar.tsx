import { FilterState } from '@/types/product';
import { brands, marketplacePlatforms } from '@/data/mockProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  X,
  Filter,
  RotateCcw,
} from 'lucide-react';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export function FilterSidebar({
  filters,
  onFilterChange,
  onClose,
  isMobile,
}: FilterSidebarProps) {
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

  const handleReset = () => {
    onFilterChange({
      search: '',
      brand: [],
      marketplace: [],
      status: [],
      priceRange: [0, 100],
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
    (filters.kitProduct !== null ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 100 ? 1 : 0);

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Filters</h2>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
          {isMobile && onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) =>
                  onFilterChange({ ...filters, search: e.target.value })
                }
                className="pl-9"
              />
            </div>
          </div>

          {/* Brands */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Brands
            </Label>
            <div className="space-y-2">
              {brands.map((brand) => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand}`}
                    checked={filters.brand.includes(brand)}
                    onCheckedChange={() => handleBrandToggle(brand)}
                  />
                  <label
                    htmlFor={`brand-${brand}`}
                    className="text-sm text-foreground cursor-pointer flex-1"
                  >
                    {brand}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Marketplace */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Marketplace
            </Label>
            <div className="space-y-2">
              {marketplacePlatforms.map((platform) => (
                <div key={platform} className="flex items-center space-x-2">
                  <Checkbox
                    id={`platform-${platform}`}
                    checked={filters.marketplace.includes(platform)}
                    onCheckedChange={() => handleMarketplaceToggle(platform)}
                  />
                  <label
                    htmlFor={`platform-${platform}`}
                    className="text-sm text-foreground cursor-pointer flex-1 capitalize"
                  >
                    {platform}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Status
            </Label>
            <div className="space-y-2">
              {['live', 'inactive'].map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filters.status.includes(status)}
                    onCheckedChange={() => handleStatusToggle(status)}
                  />
                  <label
                    htmlFor={`status-${status}`}
                    className="text-sm text-foreground cursor-pointer flex-1 capitalize flex items-center gap-2"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        status === 'live' ? 'bg-live' : 'bg-inactive'
                      }`}
                    />
                    {status}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Price Range
            </Label>
            <div className="px-1">
              <Slider
                value={filters.priceRange}
                min={0}
                max={100}
                step={5}
                onValueChange={(value) =>
                  onFilterChange({
                    ...filters,
                    priceRange: value as [number, number],
                  })
                }
              />
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>${filters.priceRange[0]}</span>
                <span>${filters.priceRange[1]}+</span>
              </div>
            </div>
          </div>

          {/* Kit Product */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Product Type
            </Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="kit-all"
                  checked={filters.kitProduct === null}
                  onCheckedChange={() =>
                    onFilterChange({ ...filters, kitProduct: null })
                  }
                />
                <label
                  htmlFor="kit-all"
                  className="text-sm text-foreground cursor-pointer"
                >
                  All Products
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="kit-yes"
                  checked={filters.kitProduct === true}
                  onCheckedChange={() =>
                    onFilterChange({ ...filters, kitProduct: true })
                  }
                />
                <label
                  htmlFor="kit-yes"
                  className="text-sm text-foreground cursor-pointer"
                >
                  Kit Products Only
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="kit-no"
                  checked={filters.kitProduct === false}
                  onCheckedChange={() =>
                    onFilterChange({ ...filters, kitProduct: false })
                  }
                />
                <label
                  htmlFor="kit-no"
                  className="text-sm text-foreground cursor-pointer"
                >
                  Single Products Only
                </label>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Apply Button (Mobile) */}
      {isMobile && onClose && (
        <div className="p-4 border-t border-border">
          <Button className="w-full" onClick={onClose}>
            Apply Filters
          </Button>
        </div>
      )}
    </div>
  );
}
