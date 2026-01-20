import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockProducts } from '@/data/mockProducts';
import { FilterState, Product } from '@/types/product';
import { ProductTable, defaultColumns, ColumnConfig, SortConfig } from './ProductTable';
import { FilterBar } from './FilterBar';
import { BulkListingDialog } from './BulkListingDialog';
import { CreateOfferDialog } from './CreateOfferDialog';
import { BatchProgressDialog } from '@/components/batches/BatchProgressDialog';
import { Button } from '@/components/ui/button';
import { Package, History, Tag, BarChart3 } from 'lucide-react';
import { useCustomFilters, applyCustomFilter } from '@/hooks/useCustomFilters';
import { useTags } from '@/hooks/useTags';
import { useBatchOperations } from '@/hooks/useBatchOperations';
import { useOffers } from '@/hooks/useOffers';
import { useToast } from '@/hooks/use-toast';

// Map column IDs to product fields for sorting
const columnToField: Record<string, keyof Product> = {
  name: 'name',
  sku: 'vendorSku',
  brand: 'brand',
  productId: 'productId',
  variationId: 'variationId',
  vendor: 'vendorName',
  mpn: 'manufacturerPart',
  asin: 'asin',
  fnsku: 'fnsku',
  gtin: 'gtin',
  ean: 'ean',
  isbn: 'isbn',
  landedCost: 'landedCost',
  shippingCost: 'shippingCost',
  salePrice: 'salePrice',
  purchaseQty: 'purchaseQty',
  soldQty: 'soldQty',
  stockQty: 'stockQty',
  returnQty: 'returnQty',
  profitMargin: 'grossProfitPercent',
  profitAmount: 'grossProfitAmount',
  velocity: 'velocity',
  stockDays: 'stockDays',
  restockStatus: 'restockStatus',
  suggestedRestockQty: 'suggestedRestockQty',
};

export function ProductGrid() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterState>({
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
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    // Ensure tags column exists (for users with cached column configs)
    const hasTagsColumn = defaultColumns.some(col => col.id === 'tags');
    if (!hasTagsColumn) return defaultColumns;
    
    // Add tags column if it doesn't exist in the initial state
    return defaultColumns;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: null, direction: null });
  const [bulkListingOpen, setBulkListingOpen] = useState(false);
  const [selectedProductsForListing, setSelectedProductsForListing] = useState<Product[]>([]);
  const [createOfferOpen, setCreateOfferOpen] = useState(false);
  const [preselectedProductIds, setPreselectedProductIds] = useState<string[]>([]);
  const [hideProductSelection, setHideProductSelection] = useState(false);
  
  // Batch progress state
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [activeBatchName, setActiveBatchName] = useState('');
  const [activeBatchTotalItems, setActiveBatchTotalItems] = useState(0);

  const {
    customFilters,
    activeFilterId,
    activeFilter,
    addFilter,
    deleteFilter,
    toggleActiveFilter,
  } = useCustomFilters();

  const {
    tags,
    productTags,
    addTag,
    deleteTag,
    getProductTags,
    toggleProductTag,
    bulkAddTag,
    bulkRemoveTag,
  } = useTags();

  const {
    batches,
    fetchBatchItems,
    createBatch,
    processBatch,
    retryFailedItems,
    deleteBatch,
  } = useBatchOperations();

  const {
    offers,
    addOffer,
    getOffersForProduct,
    getActiveOffers,
    productHasOffer,
  } = useOffers();

  const handleOpenBulkListing = useCallback((products: Product[]) => {
    setSelectedProductsForListing(products);
    setBulkListingOpen(true);
  }, []);

  const handleOpenCreateOffer = useCallback((productId?: string) => {
    setPreselectedProductIds(productId ? [productId] : []);
    setHideProductSelection(!!productId); // Hide selection when opened from grid
    setCreateOfferOpen(true);
  }, []);

  const handleOpenBulkOffer = useCallback((productIds: string[]) => {
    setPreselectedProductIds(productIds);
    setHideProductSelection(true); // Hide selection for bulk offers
    setCreateOfferOpen(true);
  }, []);

  const handleCreateOffer = useCallback((offer: Parameters<typeof addOffer>[0]) => {
    addOffer(offer);
    toast({
      title: "Offer created",
      description: `"${offer.name}" has been created for ${offer.productIds.length} product(s).`,
    });
  }, [addOffer, toast]);

  const handleCreateBatch = useCallback(async (
    name: string,
    products: { id: string; name: string; sku?: string; stockQty?: number; salePrice?: number; profitMargin?: number }[],
    marketplaces: string[]
  ) => {
    // For demo, use a valid UUID format since auth isn't fully set up
    // This is a fixed demo UUID - in production, use auth.uid()
    const demoUserId = '00000000-0000-0000-0000-000000000001';
    const batch = await createBatch(name, products, marketplaces, demoUserId);
    
    if (batch) {
      // Show progress dialog
      setActiveBatchId(batch.id);
      setActiveBatchName(batch.name);
      setActiveBatchTotalItems(batch.total_items);
      setProgressDialogOpen(true);
      
      // Start processing the batch
      processBatch(batch.id);
      
      return {
        batchId: batch.id,
        batchName: batch.name,
        totalItems: batch.total_items,
      };
    }
    return null;
  }, [createBatch, processBatch]);

  const handleViewBatchDetails = useCallback(() => {
    setProgressDialogOpen(false);
    navigate('/batches');
  }, [navigate]);

  // Filter products (without pagination)
  const filteredProducts = useMemo(() => {
    let result = [...mockProducts];

    // Apply custom filter first
    result = applyCustomFilter(result, activeFilter);

    // Search filter - expanded to search more fields
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.vendorSku.toLowerCase().includes(searchLower) ||
          p.brand.toLowerCase().includes(searchLower) ||
          p.productId.toLowerCase().includes(searchLower) ||
          p.manufacturerPart?.toLowerCase().includes(searchLower) ||
          p.asin?.toLowerCase().includes(searchLower) ||
          p.fnsku?.toLowerCase().includes(searchLower) ||
          p.gtin?.toLowerCase().includes(searchLower) ||
          p.ean?.toLowerCase().includes(searchLower) ||
          p.isbn?.toLowerCase().includes(searchLower) ||
          p.vendorName?.toLowerCase().includes(searchLower)
      );
    }

    // Brand filter
    if (filters.brand.length > 0) {
      result = result.filter((p) => filters.brand.includes(p.brand));
    }

    // Marketplace filter
    if (filters.marketplace.length > 0) {
      result = result.filter((p) =>
        p.marketplaces.some((m) => filters.marketplace.includes(m.platform))
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      result = result.filter((p) => {
        const hasNotListed = filters.status.includes('not_listed');
        const otherStatuses = filters.status.filter(s => s !== 'not_listed');
        
        // Check if product matches "not_listed" (no marketplaces)
        if (hasNotListed && p.marketplaces.length === 0) {
          return true;
        }
        
        // Check if product matches any of the other statuses
        if (otherStatuses.length > 0) {
          return p.marketplaces.some((m) => otherStatuses.includes(m.status));
        }
        
        return false;
      });
    }

    // Price range filter
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) {
      result = result.filter(
        (p) =>
          p.salePrice >= filters.priceRange[0] &&
          p.salePrice <= filters.priceRange[1]
      );
    }

    // Stock range filter
    if (filters.stockRange[0] > 0 || filters.stockRange[1] < 10000) {
      result = result.filter(
        (p) =>
          p.stockQty >= filters.stockRange[0] &&
          p.stockQty <= filters.stockRange[1]
      );
    }

    // Sold range filter
    if (filters.soldRange[0] > 0 || filters.soldRange[1] < 10000 || filters.soldPeriod !== 'all') {
      result = result.filter((p) => {
        let soldQty: number;
        switch (filters.soldPeriod) {
          case 'lastMonth':
            soldQty = p.soldQtyLastMonth;
            break;
          case 'lastQuarter':
            soldQty = p.soldQtyLastQuarter;
            break;
          case 'lastYear':
            soldQty = p.soldQtyLastYear;
            break;
          default:
            soldQty = p.soldQty;
        }
        return soldQty >= filters.soldRange[0] && soldQty <= filters.soldRange[1];
      });
    }

    // Kit product filter
    if (filters.kitProduct !== null) {
      result = result.filter((p) => p.kitProduct === filters.kitProduct);
    }

    // Variation filter
    if (filters.hasVariation !== null) {
      result = result.filter((p) => 
        filters.hasVariation ? p.variationId !== null : p.variationId === null
      );
    }

    // Tags filter
    if (filters.tags.length > 0) {
      result = result.filter((p) => {
        const pTags = productTags[p.id] || [];
        return filters.tags.some((tagId) => pTags.includes(tagId));
      });
    }

    // Apply sorting
    if (sortConfig.column && sortConfig.direction) {
      const field = columnToField[sortConfig.column];
      if (field) {
        result.sort((a, b) => {
          const aVal = a[field];
          const bVal = b[field];
          
          // Handle null/undefined values
          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return sortConfig.direction === 'asc' ? 1 : -1;
          if (bVal == null) return sortConfig.direction === 'asc' ? -1 : 1;
          
          // Compare based on type
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            const comparison = aVal.localeCompare(bVal);
            return sortConfig.direction === 'asc' ? comparison : -comparison;
          }
          
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
          }
          
          return 0;
        });
      }
    }

    return result;
  }, [filters, activeFilter, sortConfig, productTags]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Reset to page 1 when filters change
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleSortChange = (newSort: SortConfig) => {
    setSortConfig(newSort);
    setCurrentPage(1);
  };

  const handleCreateProducts = useCallback((newProducts: Record<string, string>[]) => {
    // In a real app, this would add products to the database
    console.log('Created products:', newProducts);
    toast({
      title: "Products created",
      description: `${newProducts.length} product${newProducts.length > 1 ? 's' : ''} have been created. (Note: This is a demo - data is not persisted)`,
    });
  }, [toast]);

  const handleUpdateProducts = useCallback((updatedProducts: Record<string, string>[]) => {
    // In a real app, this would update products in the database
    console.log('Updated products:', updatedProducts);
    toast({
      title: "Products updated",
      description: `${updatedProducts.length} product${updatedProducts.length > 1 ? 's' : ''} have been updated. (Note: This is a demo - data is not persisted)`,
    });
  }, [toast]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Products</h1>
              <p className="text-sm text-muted-foreground">
                {filteredProducts.length.toLocaleString()} of {mockProducts.length.toLocaleString()} products
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => handleOpenCreateOffer()}
            >
              <Tag className="w-4 h-4" />
              Create Offer
              {getActiveOffers.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                  {getActiveOffers.length}
                </span>
              )}
            </Button>
            <Link to="/offer-analytics">
              <Button 
                variant="outline" 
                className="gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Offer Analytics
              </Button>
            </Link>
            <Link to="/batches">
              <Button variant="outline" className="gap-2">
                <History className="w-4 h-4" />
                Batch Management
                {batches.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                    {batches.length}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Bar - Top */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        customFilters={customFilters}
        activeFilterId={activeFilterId}
        onSaveCustomFilter={addFilter}
        onDeleteCustomFilter={deleteFilter}
        onToggleCustomFilter={toggleActiveFilter}
        columns={columns}
        onColumnsChange={setColumns}
        products={mockProducts}
        tags={tags}
        productTags={productTags}
        onAddTag={addTag}
        onDeleteTag={deleteTag}
        onCreateProducts={handleCreateProducts}
        onUpdateProducts={handleUpdateProducts}
      />

      {/* Products Table */}
      <div className="flex-1 overflow-auto p-4">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground">
              No products found
            </h3>
            <p className="text-muted-foreground mt-1">
              Try adjusting your filters or search terms
            </p>
          </div>
        ) : (
          <ProductTable
            products={paginatedProducts}
            allFilteredProducts={filteredProducts}
            allFilteredProductIds={filteredProducts.map(p => p.id)}
            columns={columns}
            onColumnsChange={setColumns}
            currentPage={currentPage}
            pageSize={pageSize}
            totalProducts={filteredProducts.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
            sortConfig={sortConfig}
            onSortChange={handleSortChange}
            tags={tags}
            getProductTags={getProductTags}
            onToggleProductTag={toggleProductTag}
            onBulkAddTag={bulkAddTag}
            onBulkRemoveTag={bulkRemoveTag}
            onOpenBulkListing={handleOpenBulkListing}
            onOpenBulkOffer={handleOpenBulkOffer}
            getProductOffers={getOffersForProduct}
            onCreateOffer={handleOpenCreateOffer}
          />
        )}
      </div>

      {/* Bulk Listing Dialog */}
      <BulkListingDialog
        open={bulkListingOpen}
        onOpenChange={setBulkListingOpen}
        selectedProducts={selectedProductsForListing}
        onCreateBatch={handleCreateBatch}
      />

      {/* Batch Progress Dialog */}
      <BatchProgressDialog
        open={progressDialogOpen}
        onOpenChange={setProgressDialogOpen}
        batchId={activeBatchId}
        batchName={activeBatchName}
        totalItems={activeBatchTotalItems}
        onViewBatch={handleViewBatchDetails}
      />

      {/* Create Offer Dialog */}
      <CreateOfferDialog
        open={createOfferOpen}
        onOpenChange={setCreateOfferOpen}
        onCreateOffer={handleCreateOffer}
        products={mockProducts}
        preselectedProductIds={preselectedProductIds}
        hideProductSelection={hideProductSelection}
      />
    </div>
  );
}
