import { useState, useRef } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CSVImportDialogProps {
  onImport: (products: Record<string, string>[]) => void;
}

const productFields = [
  { id: 'name', label: 'Product Name', required: true },
  { id: 'vendorSku', label: 'SKU', required: true },
  { id: 'brand', label: 'Brand', required: false },
  { id: 'productId', label: 'Product ID', required: false },
  { id: 'vendorName', label: 'Vendor', required: false },
  { id: 'manufacturerPart', label: 'MPN', required: false },
  { id: 'asin', label: 'ASIN', required: false },
  { id: 'fnsku', label: 'FNSKU', required: false },
  { id: 'gtin', label: 'GTIN', required: false },
  { id: 'ean', label: 'EAN', required: false },
  { id: 'isbn', label: 'ISBN', required: false },
  { id: 'landedCost', label: 'Landed Cost', required: false },
  { id: 'shippingCost', label: 'Shipping Cost', required: false },
  { id: 'salePrice', label: 'Sale Price', required: false },
  { id: 'purchaseQty', label: 'Purchased Qty', required: false },
  { id: 'soldQty', label: 'Sold Qty', required: false },
  { id: 'stockQty', label: 'Stock Qty', required: false },
  { id: 'returnQty', label: 'Return Qty', required: false },
];

export function CSVImportDialog({ onImport }: CSVImportDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    const rows = lines.slice(1).map(line => {
      // Simple CSV parsing (handles quoted values)
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
    
    return { headers, rows };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    
    const text = await selectedFile.text();
    const { headers, rows } = parseCSV(text);
    
    setCsvHeaders(headers);
    setCsvData(rows);
    
    // Auto-map matching headers
    const autoMapping: Record<string, string> = {};
    productFields.forEach(field => {
      const matchingHeader = headers.find(
        h => h.toLowerCase().replace(/[_\s]/g, '') === field.label.toLowerCase().replace(/[_\s]/g, '') ||
             h.toLowerCase().replace(/[_\s]/g, '') === field.id.toLowerCase()
      );
      if (matchingHeader) {
        autoMapping[field.id] = matchingHeader;
      }
    });
    setFieldMapping(autoMapping);
    setStep('mapping');
  };

  const handleImport = () => {
    const mappedProducts = csvData.map(row => {
      const product: Record<string, string> = {};
      Object.entries(fieldMapping).forEach(([fieldId, csvHeader]) => {
        if (csvHeader && csvHeader !== '_skip') {
          const headerIndex = csvHeaders.indexOf(csvHeader);
          if (headerIndex !== -1) {
            product[fieldId] = row[headerIndex] || '';
          }
        }
      });
      return product;
    }).filter(p => p.name || p.vendorSku); // Filter out empty rows

    if (mappedProducts.length === 0) {
      toast({
        title: "No valid products",
        description: "No products could be imported. Please check your field mapping.",
        variant: "destructive",
      });
      return;
    }

    onImport(mappedProducts);
    toast({
      title: "Import successful",
      description: `Imported ${mappedProducts.length} product${mappedProducts.length > 1 ? 's' : ''}`,
    });
    
    // Reset and close
    setOpen(false);
    setFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setFieldMapping({});
    setStep('upload');
  };

  const requiredFieldsMapped = productFields
    .filter(f => f.required)
    .every(f => fieldMapping[f.id] && fieldMapping[f.id] !== '_skip');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Import</span> CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Import Products from CSV
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload a CSV file to import products'}
            {step === 'mapping' && 'Map CSV columns to product fields'}
            {step === 'preview' && 'Review and confirm import'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-border rounded-lg">
            <FileSpreadsheet className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Drag and drop a CSV file or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              Select CSV File
            </Button>
          </div>
        )}

        {step === 'mapping' && (
          <ScrollArea className="flex-1 max-h-[50vh] pr-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{file?.name}</span>
                <Badge variant="secondary">{csvData.length} rows</Badge>
              </div>
              
              <div className="grid gap-3">
                {productFields.map(field => (
                  <div key={field.id} className="flex items-center gap-3">
                    <div className="w-40 flex items-center gap-1">
                      <span className="text-sm font-medium">{field.label}</span>
                      {field.required && (
                        <span className="text-destructive">*</span>
                      )}
                    </div>
                    <Select
                      value={fieldMapping[field.id] || '_skip'}
                      onValueChange={(value) => 
                        setFieldMapping(prev => ({ ...prev, [field.id]: value }))
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Skip this field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_skip">— Skip this field —</SelectItem>
                        {csvHeaders.map(header => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldMapping[field.id] && fieldMapping[field.id] !== '_skip' ? (
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                    ) : field.required ? (
                      <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="flex-shrink-0">
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={!requiredFieldsMapped}
              >
                Import {csvData.length} Products
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
