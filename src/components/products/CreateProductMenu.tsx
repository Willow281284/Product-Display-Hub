import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Plus, ChevronDown, FileSpreadsheet, ShoppingCart, Store, Package } from 'lucide-react';
import { CSVExcelImportDialog } from './CSVExcelImportDialog';
import { AmazonImportDialog } from './AmazonImportDialog';
import { ShopifyImportDialog } from './ShopifyImportDialog';

interface CreateProductMenuProps {
  onCreateProducts: (products: Record<string, string>[]) => void;
}

export function CreateProductMenu({ onCreateProducts }: CreateProductMenuProps) {
  const navigate = useNavigate();
  const [csvExcelDialogOpen, setCsvExcelDialogOpen] = useState(false);
  const [amazonDialogOpen, setAmazonDialogOpen] = useState(false);
  const [shopifyDialogOpen, setShopifyDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Create Product
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Add New Products</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/product/new')} className="gap-2 cursor-pointer">
            <Plus className="w-4 h-4" />
            Manual Entry
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/product/new?type=kit')} className="gap-2 cursor-pointer">
            <Package className="w-4 h-4" />
            Create Kit Product
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCsvExcelDialogOpen(true)} className="gap-2 cursor-pointer">
            <FileSpreadsheet className="w-4 h-4" />
            CSV or Excel
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">Import from Marketplace</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setAmazonDialogOpen(true)} className="gap-2 cursor-pointer">
            <ShoppingCart className="w-4 h-4 text-orange-500" />
            Import from Amazon
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShopifyDialogOpen(true)} className="gap-2 cursor-pointer">
            <Store className="w-4 h-4 text-green-500" />
            Import from Shopify
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CSVExcelImportDialog
        open={csvExcelDialogOpen}
        onOpenChange={setCsvExcelDialogOpen}
        mode="create"
        onImport={(products) => {
          onCreateProducts(products);
          setCsvExcelDialogOpen(false);
        }}
      />

      <AmazonImportDialog
        open={amazonDialogOpen}
        onOpenChange={setAmazonDialogOpen}
        onImport={(products) => {
          onCreateProducts(products);
          setAmazonDialogOpen(false);
        }}
      />

      <ShopifyImportDialog
        open={shopifyDialogOpen}
        onOpenChange={setShopifyDialogOpen}
        onImport={(products) => {
          onCreateProducts(products);
          setShopifyDialogOpen(false);
        }}
      />
    </>
  );
}
