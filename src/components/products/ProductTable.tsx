import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/types/product';
import { MarketplaceCompact } from './MarketplaceCompact';
import { MarketplaceDialog } from './MarketplaceDialog';
import { ProductDetailsDialog } from './ProductDetailsDialog';
import { TagBadge } from './TagBadge';
import { OffersBadgeGroup } from './OfferBadge';
import { toast } from 'sonner';
import { BulkActionsBar } from './BulkActionsBar';
import { CopyButton } from './CopyButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Native HTML table elements used for sticky header support
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
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
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverAnchor,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Edit,
  MoreHorizontal,
  Copy,
  Trash2,
  ExternalLink,
  Box,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Check,
  Tag,
  Keyboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tag as TagType } from '@/types/tag';
import { Offer } from '@/types/offer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  sortable?: boolean;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  column: string | null;
  direction: SortDirection;
}

// Columns that can be sorted
const sortableColumns = [
  'name', 'sku', 'brand', 'productId', 'variationId', 'vendor', 'mpn', 
  'asin', 'fnsku', 'gtin', 'ean', 'isbn',
  'landedCost', 'shippingCost', 'salePrice', 
  'purchaseQty', 'soldQty', 'stockQty', 'returnQty',
  'profitMargin', 'profitAmount',
  'velocity', 'stockDays', 'restockStatus', 'suggestedRestockQty',
  'productType'
];

// Column tooltips for all columns
const columnTooltips: Record<string, string> = {
  image: 'Product image thumbnail',
  name: 'Full product name or title',
  tags: 'Product tags for categorization',
  offers: 'Active promotions and discounts for this product',
  productType: 'Product type: Single (standalone), Kit (bundle of products), or Variation (part of a variant group)',
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
  velocity: 'Average units sold per day based on last 30 days',
  stockDays: 'Estimated days of stock remaining at current velocity',
  restockStatus: 'Current restock status: In Stock, Low Stock, Out of Stock, or Reorder Now',
  suggestedRestockQty: 'Recommended quantity to reorder to maintain 60 days of stock',
  marketplaces: 'Sales channels where the product is listed - click to manage',
  actions: 'Available actions for this product',
};

export const defaultColumns: ColumnConfig[] = [
  { id: 'image', label: 'Image', visible: true },
  { id: 'name', label: 'Product Name', visible: true, sortable: true },
  { id: 'productType', label: 'Type', visible: true, sortable: true },
  { id: 'tags', label: 'Tags', visible: true },
  { id: 'offers', label: 'Offers', visible: true },
  { id: 'sku', label: 'SKU', visible: true, sortable: true },
  { id: 'brand', label: 'Brand', visible: true, sortable: true },
  { id: 'productId', label: 'Product ID', visible: true, sortable: true },
  { id: 'variationId', label: 'Variation ID', visible: true, sortable: true },
  { id: 'vendor', label: 'Vendor', visible: true, sortable: true },
  { id: 'mpn', label: 'MPN', visible: true, sortable: true },
  { id: 'asin', label: 'ASIN', visible: false, sortable: true },
  { id: 'fnsku', label: 'FNSKU', visible: false, sortable: true },
  { id: 'gtin', label: 'GTIN', visible: false, sortable: true },
  { id: 'ean', label: 'EAN', visible: false, sortable: true },
  { id: 'isbn', label: 'ISBN', visible: false, sortable: true },
  { id: 'landedCost', label: 'Landed Cost', visible: true, sortable: true },
  { id: 'shippingCost', label: 'Shipping', visible: true, sortable: true },
  { id: 'salePrice', label: 'Sale Price', visible: true, sortable: true },
  { id: 'purchaseQty', label: 'Purchased', visible: true, sortable: true },
  { id: 'soldQty', label: 'Sold', visible: true, sortable: true },
  { id: 'stockQty', label: 'In Stock', visible: true, sortable: true },
  { id: 'returnQty', label: 'Returns', visible: true, sortable: true },
  { id: 'profitMargin', label: 'Margin %', visible: true, sortable: true },
  { id: 'profitAmount', label: 'Profit $', visible: true, sortable: true },
  { id: 'velocity', label: 'Velocity', visible: true, sortable: true },
  { id: 'stockDays', label: 'Stock Days', visible: true, sortable: true },
  { id: 'restockStatus', label: 'Restock Status', visible: true, sortable: true },
  { id: 'suggestedRestockQty', label: 'Restock Qty', visible: true, sortable: true },
  { id: 'marketplaces', label: 'Marketplaces', visible: true },
  { id: 'actions', label: 'Actions', visible: true },
];

interface ProductTableProps {
  products: Product[];
  allFilteredProducts: Product[];
  allFilteredProductIds: string[];
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  currentPage: number;
  pageSize: number;
  totalProducts: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
  tags?: TagType[];
  getProductTags?: (productId: string) => TagType[];
  onToggleProductTag?: (productId: string, tagId: string) => void;
  onBulkAddTag?: (productIds: string[], tagId: string) => void;
  onBulkRemoveTag?: (productIds: string[], tagId: string) => void;
  onBulkDelete?: (productIds: string[]) => void;
  onBulkUpdatePricing?: (productIds: string[], updates: Partial<{
    salePrice: number;
    stockQty: number;
    landedCost: number;
    purchaseQty: number;
  }>) => void;
  onOpenBulkListing?: (products: Product[]) => void;
  onOpenBulkOffer?: (productIds: string[]) => void;
  getProductOffers?: (productId: string) => Offer[];
  onCreateOffer?: (productId: string) => void;
}

export function ProductTable({ 
  products, 
  allFilteredProducts,
  allFilteredProductIds,
  columns, 
  onColumnsChange,
  currentPage,
  pageSize,
  totalProducts,
  onPageChange,
  onPageSizeChange,
  sortConfig,
  onSortChange,
  tags = [],
  getProductTags,
  onToggleProductTag,
  onBulkAddTag,
  onBulkRemoveTag,
  onBulkDelete,
  onBulkUpdatePricing,
  onOpenBulkListing,
  onOpenBulkOffer,
  getProductOffers,
  onCreateOffer,
}: ProductTableProps) {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  
  const tableRef = useRef<HTMLTableElement | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const resizingColumn = useRef<string | null>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);

  // Check selection states
  const allVisibleSelected = products.length > 0 && products.every(p => selectedProductIds.has(p.id));
  const someVisibleSelected = products.some(p => selectedProductIds.has(p.id));
  const allFilteredSelected = allFilteredProductIds.length > 0 && 
    allFilteredProductIds.every(id => selectedProductIds.has(id));

  const handleSelectVisible = () => {
    if (allVisibleSelected) {
      // Deselect all visible
      const newSelected = new Set(selectedProductIds);
      products.forEach(p => newSelected.delete(p.id));
      setSelectedProductIds(newSelected);
    } else {
      // Select all visible
      const newSelected = new Set(selectedProductIds);
      products.forEach(p => newSelected.add(p.id));
      setSelectedProductIds(newSelected);
    }
  };

  const handleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(allFilteredProductIds));
    }
  };

  const handleSelectProduct = useCallback((productId: string, rowIndex?: number) => {
    const newSelected = new Set(selectedProductIds);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProductIds(newSelected);
    if (rowIndex !== undefined) {
      setLastSelectedIndex(rowIndex);
    }
  }, [selectedProductIds]);

  // Shift+Click range selection
  const handleRowClick = useCallback((e: React.MouseEvent, rowIndex: number, productId: string) => {
    setFocusedRowIndex(rowIndex);
    
    if (e.shiftKey && lastSelectedIndex !== null) {
      // Range selection
      const start = Math.min(lastSelectedIndex, rowIndex);
      const end = Math.max(lastSelectedIndex, rowIndex);
      const newSelected = new Set(selectedProductIds);
      
      for (let i = start; i <= end; i++) {
        if (products[i]) {
          newSelected.add(products[i].id);
        }
      }
      
      setSelectedProductIds(newSelected);
    } else if (e.ctrlKey || e.metaKey) {
      // Toggle single selection with Ctrl/Cmd
      handleSelectProduct(productId, rowIndex);
    } else {
      // Just focus, don't change selection (let checkbox handle selection)
      setLastSelectedIndex(rowIndex);
    }
  }, [lastSelectedIndex, selectedProductIds, products, handleSelectProduct]);

  const clearSelection = useCallback(() => {
    setSelectedProductIds(new Set());
  }, []);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSelectAll: handleSelectAllFiltered,
    onClearSelection: clearSelection,
    onDelete: () => {
      if (selectedProductIds.size > 0) {
        setShowDeleteConfirm(true);
      }
    },
    enabled: true,
  });

  const handleResizeStart = useCallback((e: React.MouseEvent, columnId: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    resizingColumn.current = columnId;
    startX.current = e.clientX;
    startWidth.current = currentWidth;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingColumn.current) return;
      const diff = moveEvent.clientX - startX.current;
      const newWidth = Math.max(60, startWidth.current + diff);
      setColumnWidths(prev => ({
        ...prev,
        [resizingColumn.current!]: newWidth
      }));
    };

    const handleMouseUp = () => {
      resizingColumn.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleDoubleClickResize = useCallback((columnId: string, colIndex: number) => {
    const table = tableRef.current;
    if (!table) return;

    const MIN_WIDTH = 60;
    const MAX_WIDTH = 900;
    const RESIZE_HANDLE_WIDTH = 8; // matches w-2

    const getPaddingX = (el: HTMLElement) => {
      const cs = window.getComputedStyle(el);
      const pl = Number.parseFloat(cs.paddingLeft || '0') || 0;
      const pr = Number.parseFloat(cs.paddingRight || '0') || 0;
      return pl + pr;
    };

    let maxWidth = MIN_WIDTH;

    // Measure header label (must include header text + icons + gaps + padding)
    const headerCell = table.querySelector(
      `thead th:nth-child(${colIndex + 1})`
    ) as HTMLElement | null;

    if (headerCell) {
      const paddingX = getPaddingX(headerCell);
      const headerContent = headerCell.querySelector(':scope > div') as HTMLElement | null;
      const labelEl = headerContent?.querySelector('span') as HTMLElement | null;

      const labelWidth = labelEl?.scrollWidth ?? 0;
      const iconsWidth = headerContent
        ? Array.from(headerContent.querySelectorAll('svg')).reduce(
            (sum, svg) => sum + (svg as SVGElement).getBoundingClientRect().width,
            0
          )
        : 0;

      const contentStyle = headerContent ? window.getComputedStyle(headerContent) : null;
      const gapPx = contentStyle
        ? (Number.parseFloat(contentStyle.columnGap || contentStyle.gap || '0') || 0)
        : 0;
      const childCount = headerContent?.children.length ?? 0;
      const gapsWidth = childCount > 1 ? gapPx * (childCount - 1) : 0;
      const contentPaddingRight = contentStyle
        ? (Number.parseFloat(contentStyle.paddingRight || '0') || 0)
        : 0;

      maxWidth = Math.max(
        maxWidth,
        Math.ceil(
          labelWidth +
            iconsWidth +
            gapsWidth +
            contentPaddingRight +
            paddingX +
            RESIZE_HANDLE_WIDTH +
            4
        )
      );
    }

    // Measure body cells (use DOM scrollWidth so pills/badges/padding are counted)
    const bodyCells = table.querySelectorAll(`tbody td:nth-child(${colIndex + 1})`);
    bodyCells.forEach((cell) => {
      const td = cell as HTMLElement;
      const paddingX = getPaddingX(td);
      const contentEl = td.firstElementChild as HTMLElement | null;
      const contentWidth = contentEl?.scrollWidth ?? 0;
      maxWidth = Math.max(maxWidth, Math.ceil(contentWidth + paddingX));
    });

    maxWidth = Math.min(maxWidth, MAX_WIDTH);

    setColumnWidths((prev) => ({
      ...prev,
      [columnId]: maxWidth,
    }));
  }, []);

  const totalPages = Math.ceil(totalProducts / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalProducts);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleSort = (columnId: string) => {
    if (!sortableColumns.includes(columnId)) return;
    
    if (sortConfig.column === columnId) {
      // Cycle: asc -> desc -> null
      if (sortConfig.direction === 'asc') {
        onSortChange({ column: columnId, direction: 'desc' });
      } else if (sortConfig.direction === 'desc') {
        onSortChange({ column: null, direction: null });
      } else {
        onSortChange({ column: columnId, direction: 'asc' });
      }
    } else {
      onSortChange({ column: columnId, direction: 'asc' });
    }
  };

  const getSortIcon = (columnId: string) => {
    if (!sortableColumns.includes(columnId)) return null;
    
    if (sortConfig.column === columnId) {
      if (sortConfig.direction === 'asc') {
        return <ArrowUp className="w-3 h-3 text-primary" />;
      } else if (sortConfig.direction === 'desc') {
        return <ArrowDown className="w-3 h-3 text-primary" />;
      }
    }
    return <ArrowUpDown className="w-3 h-3 text-muted-foreground opacity-50" />;
  };

  const handleDragStart = (columnId: string) => {
    setDraggedColumn(columnId);
  };

  const handleDragOver = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetColumnId) return;

    const draggedIndex = columns.findIndex((c) => c.id === draggedColumn);
    const targetIndex = columns.findIndex((c) => c.id === targetColumnId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newColumns = [...columns];
    const [removed] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, removed);
    onColumnsChange(newColumns);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
  };

  // Keyboard navigation for table rows
  const handleTableKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (products.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedRowIndex(prev => {
          if (prev === null) return 0;
          return Math.min(prev + 1, products.length - 1);
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedRowIndex(prev => {
          if (prev === null) return products.length - 1;
          return Math.max(prev - 1, 0);
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedRowIndex !== null && products[focusedRowIndex]) {
          navigate(`/product/${products[focusedRowIndex].id}`);
        }
        break;
      case ' ':
        e.preventDefault();
        if (focusedRowIndex !== null && products[focusedRowIndex]) {
          handleSelectProduct(products[focusedRowIndex].id);
        }
        break;
      case 'Escape':
        setFocusedRowIndex(null);
        break;
      case 'Home':
        e.preventDefault();
        setFocusedRowIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedRowIndex(products.length - 1);
        break;
    }
  }, [products, focusedRowIndex, navigate, handleSelectProduct]);

  // Scroll focused row into view
  useEffect(() => {
    if (focusedRowIndex !== null && tableContainerRef.current) {
      const rows = tableContainerRef.current.querySelectorAll('tbody tr');
      if (rows[focusedRowIndex]) {
        rows[focusedRowIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [focusedRowIndex]);

  // Reset focus when products change (e.g., page change)
  useEffect(() => {
    setFocusedRowIndex(null);
  }, [currentPage, products]);

  const visibleColumns = columns.filter((c) => c.visible);

  const getColumnWidth = (columnId: string) => {
    if (columnWidths[columnId]) return columnWidths[columnId];
    // Default widths optimized for each column type
    switch (columnId) {
      case 'image': return 56;
      case 'name': return 280;
      case 'productType': return 100;
      case 'tags': return 150;
      case 'offers': return 140;
      case 'sku': return 130;
      case 'brand': return 120;
      case 'productId': return 90;
      case 'variationId': return 140;
      case 'vendor': return 130;
      case 'mpn': return 110;
      case 'asin': return 120;
      case 'fnsku': return 120;
      case 'gtin': return 130;
      case 'ean': return 130;
      case 'isbn': return 130;
      case 'landedCost': return 100;
      case 'shippingCost': return 90;
      case 'salePrice': return 95;
      case 'purchaseQty': return 90;
      case 'soldQty': return 70;
      case 'stockQty': return 80;
      case 'returnQty': return 80;
      case 'profitMargin': return 85;
      case 'profitAmount': return 85;
      case 'velocity': return 80;
      case 'stockDays': return 90;
      case 'restockStatus': return 120;
      case 'suggestedRestockQty': return 100;
      case 'marketplaces': return 200;
      case 'actions': return 130;
      default: return 100;
    }
  };

  const renderCell = (product: Product, columnId: string) => {
    switch (columnId) {
      case 'image':
        return (
          <div className="relative">
            <img
              src={product.image}
              alt={product.name}
              className="w-10 h-10 rounded object-cover bg-muted"
            />
            {product.kitProduct && (
              <div className="absolute -top-1 -right-1">
                <Badge variant="secondary" className="h-4 w-4 p-0 flex items-center justify-center">
                  <Box className="w-2.5 h-2.5" />
                </Badge>
              </div>
            )}
          </div>
        );
      case 'name': {
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${product.id}`);
            }}
            className="w-full text-left cursor-pointer"
            aria-label={`Edit product: ${product.name}`}
          >
            <p className={cn("font-medium text-foreground transition-colors truncate hover:text-primary hover:underline")}>
              {product.name}
              {product.variation && (
                <span className="text-muted-foreground font-normal"> - {product.variation.value}</span>
              )}
            </p>
          </button>
        );
      }
      case 'productType': {
        const typeConfig = {
          single: { label: 'Single', variant: 'outline' as const, className: 'text-muted-foreground' },
          kit: { label: 'Kit', variant: 'default' as const, className: 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/30' },
          variation: { label: 'Variation', variant: 'secondary' as const, className: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/30' },
        };
        const config = typeConfig[product.productType] || typeConfig.single;
        return (
          <Badge variant={config.variant} className={cn("text-xs", config.className)}>
            {config.label}
            {product.productType === 'kit' && product.kitComponents.length > 0 && (
              <span className="ml-1 opacity-75">({product.kitComponents.length})</span>
            )}
          </Badge>
        );
      }

      case 'tags':
        const productTagsList = getProductTags ? getProductTags(product.id) : [];
        return (
          <div className="flex flex-wrap gap-1 max-w-[140px]">
            {productTagsList.length > 0 ? (
              productTagsList.slice(0, 2).map((tag) => (
                <TagBadge key={tag.id} tag={tag} size="sm" />
              ))
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
            {productTagsList.length > 2 && (
              <span className="text-sm text-muted-foreground">+{productTagsList.length - 2}</span>
            )}
            {tags.length > 0 && onToggleProductTag && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                    <Plus className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {tags.map((tag) => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`prod-tag-${product.id}-${tag.id}`}
                          checked={productTagsList.some((t) => t.id === tag.id)}
                          onCheckedChange={() => onToggleProductTag(product.id, tag.id)}
                        />
                        <label
                          htmlFor={`prod-tag-${product.id}-${tag.id}`}
                          className="text-sm cursor-pointer flex items-center gap-2"
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                          {tag.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        );
      case 'offers':
        const productOffers = getProductOffers ? getProductOffers(product.id) : [];
        return (
          <div className="flex items-center gap-1">
            {productOffers.length > 0 ? (
              <OffersBadgeGroup 
                offers={productOffers} 
                maxDisplay={1} 
                onViewAll={() => onCreateOffer?.(product.id)} 
              />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-primary gap-1"
                onClick={() => onCreateOffer?.(product.id)}
              >
                <Tag className="w-3 h-3" />
                Add Offer
              </Button>
            )}
          </div>
        );
      case 'sku':
        return (
          <div className="flex items-center gap-1 group">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/product/${product.id}`);
              }}
              className="cursor-pointer"
              aria-label={`Edit product with SKU: ${product.vendorSku}`}
            >
              <code className="text-sm bg-muted px-1.5 py-0.5 rounded hover:text-primary hover:underline transition-colors">{product.vendorSku}</code>
            </button>
            <CopyButton value={product.vendorSku} />
          </div>
        );
      case 'brand':
        return <span className="text-base">{product.brand}</span>;
      case 'productId':
        return (
          <div className="flex items-center gap-1 group">
            <code className="text-sm">{product.productId}</code>
            <CopyButton value={product.productId} />
          </div>
        );
      case 'variationId':
        return product.variationId ? (
          <div className="flex items-center gap-1.5">
            <code className="text-sm bg-primary/10 text-primary px-1.5 py-0.5 rounded">{product.variationId}</code>
            {product.variation && (
              <Badge variant="outline" className="text-xs h-5">
                {product.variation.value}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      case 'vendor':
        return <span className="text-base text-muted-foreground">{product.vendorName || '—'}</span>;
      case 'mpn':
        return <code className="text-sm">{product.manufacturerPart || '—'}</code>;
      case 'asin':
        return product.asin ? (
          <div className="flex items-center gap-1 group">
            <code className="text-sm">{product.asin}</code>
            <CopyButton value={product.asin} />
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      case 'fnsku':
        return product.fnsku ? (
          <div className="flex items-center gap-1 group">
            <code className="text-sm">{product.fnsku}</code>
            <CopyButton value={product.fnsku} />
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      case 'gtin':
        return product.gtin ? (
          <div className="flex items-center gap-1 group">
            <code className="text-sm">{product.gtin}</code>
            <CopyButton value={product.gtin} />
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      case 'ean':
        return product.ean ? (
          <div className="flex items-center gap-1 group">
            <code className="text-sm">{product.ean}</code>
            <CopyButton value={product.ean} />
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      case 'isbn':
        return product.isbn ? (
          <div className="flex items-center gap-1 group">
            <code className="text-sm">{product.isbn}</code>
            <CopyButton value={product.isbn} />
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      case 'landedCost':
        return <span className="text-base">{formatCurrency(product.landedCost)}</span>;
      case 'shippingCost':
        return <span className="text-base">{formatCurrency(product.shippingCost)}</span>;
      case 'salePrice':
        return <span className="text-base font-semibold">{formatCurrency(product.salePrice)}</span>;
      case 'purchaseQty':
        return <span className="text-base">{product.purchaseQty}</span>;
      case 'soldQty':
        return <span className="text-base">{product.soldQty}</span>;
      case 'stockQty':
        return (
          <span className={cn(
            'text-base font-medium',
            product.stockQty === 0 ? 'text-destructive' : 'text-success'
          )}>
            {product.stockQty}
          </span>
        );
      case 'returnQty':
        return (
          <span className={cn('text-base', product.returnQty > 0 && 'text-warning')}>
            {product.returnQty}
          </span>
        );
      case 'profitMargin':
        return (
          <span className={cn(
            'text-base font-medium',
            product.grossProfitPercent > 0 ? 'text-success' : 'text-muted-foreground'
          )}>
            {product.grossProfitPercent}%
          </span>
        );
      case 'profitAmount':
        return (
          <span className="text-base font-medium">
            {formatCurrency(product.grossProfitAmount)}
          </span>
        );
      case 'velocity':
        return (
          <span className={cn(
            'text-base font-medium',
            product.velocity > 1 ? 'text-success' : product.velocity > 0 ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {product.velocity.toFixed(2)}
          </span>
        );
      case 'stockDays':
        return (
          <span className={cn(
            'text-base font-medium',
            product.stockDays <= 7 ? 'text-destructive' : 
            product.stockDays <= 30 ? 'text-warning' : 'text-foreground'
          )}>
            {product.stockDays === 999 ? '∞' : product.stockDays}
          </span>
        );
      case 'restockStatus':
        const statusConfig: Record<string, { label: string; className: string }> = {
          'in_stock': { label: 'In Stock', className: 'bg-success/10 text-success border-success/30' },
          'low_stock': { label: 'Low Stock', className: 'bg-warning/10 text-warning border-warning/30' },
          'out_of_stock': { label: 'Out of Stock', className: 'bg-destructive/10 text-destructive border-destructive/30' },
          'reorder_now': { label: 'Reorder Now', className: 'bg-primary/10 text-primary border-primary/30' },
        };
        const config = statusConfig[product.restockStatus] || statusConfig['in_stock'];
        return (
          <Badge variant="outline" className={cn('text-xs font-medium whitespace-nowrap', config.className)}>
            {config.label}
          </Badge>
        );
      case 'suggestedRestockQty':
        return (
          <span className={cn(
            'text-base font-medium',
            product.suggestedRestockQty > 0 ? 'text-primary' : 'text-muted-foreground'
          )}>
            {product.suggestedRestockQty}
          </span>
        );
      case 'marketplaces':
        return (
          <MarketplaceCompact
            marketplaces={product.marketplaces}
            onClick={() => setSelectedProduct(product)}
            maxVisible={6}
          />
        );
      case 'actions':
        return (
          <div className="flex items-center gap-1">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="gap-1 h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/product/${product.id}`);
                  }}
                >
                  <Edit className="w-3 h-3" />
                  Update
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit product details</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0 border-border hover:bg-muted hover:border-primary/50" 
                  title="More actions"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 z-[100] bg-popover border shadow-lg">
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => {
                    toast.success(`Duplicated: ${product.name}`, {
                      description: 'Product duplication coming soon'
                    });
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive cursor-pointer focus:text-destructive"
                  onClick={() => {
                    toast.error(`Delete: ${product.name}`, {
                      description: 'Product deletion coming soon'
                    });
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedProductIds.size}
        selectedProductIds={selectedProductIds}
        products={products}
        allFilteredProducts={allFilteredProducts}
        tags={tags}
        onClearSelection={clearSelection}
        onBulkAddTag={onBulkAddTag}
        onBulkRemoveTag={onBulkRemoveTag}
        onBulkDelete={onBulkDelete}
        onBulkUpdatePricing={onBulkUpdatePricing}
        onOpenBulkListing={onOpenBulkListing ? () => {
          const selectedProducts = allFilteredProducts.filter(p => selectedProductIds.has(p.id));
          onOpenBulkListing(selectedProducts);
        } : undefined}
        onOpenBulkOffer={onOpenBulkOffer}
      />

      {/* Table */}
      <div 
        ref={tableContainerRef}
        className="rounded-lg border border-border max-h-[calc(100vh-280px)] overflow-auto focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        tabIndex={0}
        onKeyDown={handleTableKeyDown}
        role="grid"
        aria-label="Products table"
      >
        <table ref={tableRef} className="w-full caption-bottom text-sm table-fixed min-w-max">
          <thead className="sticky top-0 z-20 bg-muted [&_tr]:border-b">
            <tr className="border-b transition-colors bg-muted">
              {/* Checkbox column with dropdown and keyboard help */}
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-12 min-w-12">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Checkbox
                        checked={allVisibleSelected}
                        className="pointer-events-none"
                        aria-label="Select options"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={handleSelectVisible}>
                      <Check className={cn("w-4 h-4 mr-2", !allVisibleSelected && "opacity-0")} />
                      Select visible ({products.length})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSelectAllFiltered}>
                      <Check className={cn("w-4 h-4 mr-2", !allFilteredSelected && "opacity-0")} />
                      Select all {totalProducts.toLocaleString()} products
                    </DropdownMenuItem>
                    {selectedProductIds.size > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={clearSelection}>
                          Clear selection
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </th>
              {visibleColumns.map((column, colIndex) => {
                const width = getColumnWidth(column.id);
                const tooltip = columnTooltips[column.id] || column.label;
                return (
                  <Tooltip key={column.id} delayDuration={300}>
                    <TooltipTrigger asChild>
                      <th
                        draggable
                        onDragStart={() => handleDragStart(column.id)}
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleSort(column.id)}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleDoubleClickResize(column.id, colIndex);
                        }}
                        style={{ width: `${width}px`, minWidth: `${width}px` }}
                        className={cn(
                          'h-12 px-4 text-left align-middle font-medium text-muted-foreground select-none relative group',
                          draggedColumn === column.id && 'opacity-50',
                          sortableColumns.includes(column.id) && 'cursor-pointer hover:bg-muted/80'
                        )}
                      >
                        <div className="flex items-center gap-1 pr-2">
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0" />
                          <span className="truncate text-sm font-semibold">{column.label}</span>
                          {getSortIcon(column.id)}
                        </div>
                        {/* Resize handle */}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/50 group-hover:bg-border"
                          onMouseDown={(e) => handleResizeStart(e, column.id, width)}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleDoubleClickResize(column.id, colIndex);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </th>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[250px]">
                      <p>{tooltip}</p>
                      {sortableColumns.includes(column.id) && (
                        <p className="text-xs text-muted-foreground mt-1">Click to sort • Double-click to auto-fit</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {products.map((product, rowIndex) => (
              <tr
                key={product.id}
                className={cn(
                  "border-b transition-colors hover:bg-muted/30 cursor-pointer",
                  selectedProductIds.has(product.id) && "bg-primary/5",
                  focusedRowIndex === rowIndex && "border-l-2 border-l-primary/50 bg-muted/20"
                )}
                onClick={(e) => handleRowClick(e, rowIndex, product.id)}
                onDoubleClick={() => navigate(`/product/${product.id}`)}
                role="row"
                aria-selected={selectedProductIds.has(product.id)}
              >
                {/* Checkbox cell */}
                <td className="p-4 align-middle w-10 min-w-10" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedProductIds.has(product.id)}
                    onCheckedChange={() => handleSelectProduct(product.id, rowIndex)}
                    aria-label={`Select ${product.name}`}
                  />
                </td>
                {visibleColumns.map((column) => {
                  const width = getColumnWidth(column.id);
                  return (
                    <td
                      key={column.id}
                      style={{ width: `${width}px`, minWidth: `${width}px` }}
                      className="p-4 align-middle overflow-hidden"
                    >
                      <div className="truncate">
                        {renderCell(product, column.id)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {startItem.toLocaleString()} - {endItem.toLocaleString()} of {totalProducts.toLocaleString()} products
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            {/* Keyboard shortcuts help */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground hover:text-foreground">
                  <Keyboard className="h-4 w-4" />
                  <span className="text-xs hidden sm:inline">Shortcuts</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" side="top" className="w-72 p-3">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Keyboard Shortcuts</h4>
                  <div className="grid gap-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Select all products</span>
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Ctrl+A</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Deselect all</span>
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Ctrl+Shift+A</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Clear selection</span>
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Esc</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Delete selected</span>
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Delete</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Navigate rows</span>
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑ ↓</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Open product</span>
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Toggle selection</span>
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Space</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Range select</span>
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Shift+Click</kbd>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select value={pageSize.toString()} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="250">250</SelectItem>
                <SelectItem value="500">500</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center gap-1">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onPageChange(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>First page</TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous page</TooltipContent>
            </Tooltip>
            
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 mx-2">
                  <span className="text-sm">Page</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        onPageChange(page);
                      }
                    }}
                    className="w-16 h-8 text-center text-sm border border-border rounded-md bg-background"
                  />
                  <span className="text-sm">of {totalPages.toLocaleString()}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Type a page number to jump directly</TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next page</TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onPageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Last page</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Marketplace Dialog */}
      {selectedProduct && (
        <MarketplaceDialog
          product={selectedProduct}
          open={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
        />
      )}

      {/* Product Details Dialog */}
      <ProductDetailsDialog
        product={detailsProduct}
        open={!!detailsProduct}
        onOpenChange={(open) => !open && setDetailsProduct(null)}
        tags={tags}
        getProductTags={getProductTags}
        onToggleProductTag={onToggleProductTag}
      />
    </>
  );
}
