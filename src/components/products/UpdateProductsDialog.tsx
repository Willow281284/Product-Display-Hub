import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RefreshCw, FileSpreadsheet } from 'lucide-react';
import { CSVExcelImportDialog } from './CSVExcelImportDialog';

interface UpdateProductsDialogProps {
  onUpdate: (products: Record<string, string>[]) => void;
}

export function UpdateProductsDialog({ onUpdate }: UpdateProductsDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <CSVExcelImportDialog
      open={open}
      onOpenChange={setOpen}
      mode="update"
      onImport={(products) => {
        onUpdate(products);
        setOpen(false);
      }}
    />
  );
}

// Trigger button component
export function UpdateProductsButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={onClick}>
      <RefreshCw className="w-4 h-4" />
      <span className="hidden sm:inline">Update via</span> CSV
    </Button>
  );
}
