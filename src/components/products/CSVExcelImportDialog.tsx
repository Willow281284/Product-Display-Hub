import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, RefreshCw, Plus, ArrowLeft, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Identifier field options for both create and update modes
const identifierFieldOptions = [
  { id: 'vendorSku', label: 'SKU', description: 'Vendor Stock Keeping Unit' },
  { id: 'productId', label: 'Product ID', description: 'Internal product identifier' },
  { id: 'gtin', label: 'UPC/GTIN', description: 'Universal Product Code' },
  { id: 'asin', label: 'ASIN', description: 'Amazon Standard ID' },
  { id: 'fnsku', label: 'FNSKU', description: 'Fulfillment Network SKU' },
  { id: 'ean', label: 'EAN', description: 'European Article Number' },
  { id: 'isbn', label: 'ISBN', description: 'International Standard Book Number' },
  { id: 'manufacturerPart', label: 'MPN', description: 'Manufacturer Part Number' },
];

// Sample data for template
const sampleProducts = [
  {
    name: 'Wireless Bluetooth Headphones',
    vendorSku: 'WBH-001',
    brand: 'TechSound',
    productId: 'PROD-001',
    vendorName: 'Tech Distributors Inc',
    manufacturerPart: 'TS-WBH-2024',
    asin: 'B0EXAMPLE01',
    fnsku: 'X0EXAMPLE01',
    gtin: '0123456789012',
    ean: '1234567890123',
    isbn: '',
    landedCost: '45.99',
    shippingCost: '5.99',
    salePrice: '89.99',
    purchaseQty: '500',
    soldQty: '125',
    stockQty: '375',
    returnQty: '8',
  },
  {
    name: 'USB-C Fast Charging Cable 6ft',
    vendorSku: 'USB-C-6FT',
    brand: 'PowerLink',
    productId: 'PROD-002',
    vendorName: 'Cable World LLC',
    manufacturerPart: 'PL-USBC-6',
    asin: 'B0EXAMPLE02',
    fnsku: 'X0EXAMPLE02',
    gtin: '0123456789013',
    ean: '1234567890124',
    isbn: '',
    landedCost: '3.50',
    shippingCost: '1.00',
    salePrice: '12.99',
    purchaseQty: '1000',
    soldQty: '450',
    stockQty: '550',
    returnQty: '12',
  },
  {
    name: 'Ergonomic Office Chair - Black',
    vendorSku: 'EOC-BLK-001',
    brand: 'ComfortSeat',
    productId: 'PROD-003',
    vendorName: 'Office Furniture Direct',
    manufacturerPart: 'CS-ERG-BLK',
    asin: 'B0EXAMPLE03',
    fnsku: 'X0EXAMPLE03',
    gtin: '0123456789014',
    ean: '1234567890125',
    isbn: '',
    landedCost: '125.00',
    shippingCost: '25.00',
    salePrice: '249.99',
    purchaseQty: '100',
    soldQty: '35',
    stockQty: '65',
    returnQty: '2',
  },
];

interface CSVExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'update';
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

export function CSVExcelImportDialog({ open, onOpenChange, mode, onImport }: CSVExcelImportDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [selectedMatchFields, setSelectedMatchFields] = useState<string[]>(['vendorSku']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleMatchField = (fieldId: string) => {
    setSelectedMatchFields(prev => {
      if (prev.includes(fieldId)) {
        // Don't allow deselecting if it's the only one selected
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== fieldId);
      }
      return [...prev, fieldId];
    });
  };

  const downloadTemplate = () => {
    // Create CSV headers from productFields
    const headers = productFields.map(f => f.label);
    
    // Create sample data rows
    const rows = sampleProducts.map(product => 
      productFields.map(field => {
        const value = product[field.id as keyof typeof product] || '';
        // Escape values that contain commas or quotes
        if (value.includes(',') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
    );

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `product_import_template_${mode}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Template downloaded",
      description: "Open the CSV file in Excel or Google Sheets to add your products.",
    });
  };

  const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    const rows = lines.slice(1).map(line => {
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

    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const hasValidExtension = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
    
    if (!hasValidExtension) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    
    // For now, only handle CSV - Excel would require a library like xlsx
    if (selectedFile.name.endsWith('.csv')) {
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
    } else {
      toast({
        title: "Excel support coming soon",
        description: "For now, please export your Excel file as CSV and upload that.",
        variant: "default",
      });
    }
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
    }).filter(p => p.name || p.vendorSku);

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
      title: mode === 'create' ? "Products created" : "Products updated",
      description: `${mappedProducts.length} product${mappedProducts.length > 1 ? 's' : ''} have been ${mode === 'create' ? 'created' : 'updated'}.`,
    });
    
    handleReset();
  };

  const handleReset = () => {
    setFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setFieldMapping({});
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      handleReset();
    }
    onOpenChange(isOpen);
  };

  const requiredFieldsMapped = mode === 'create' 
    ? productFields.filter(f => f.required).every(f => fieldMapping[f.id] && fieldMapping[f.id] !== '_skip')
    : selectedMatchFields.some(fieldId => fieldMapping[fieldId] && fieldMapping[fieldId] !== '_skip');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            {mode === 'create' ? 'Import Products from CSV/Excel' : 'Update Products from CSV/Excel'}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && (mode === 'create' 
              ? 'Upload a CSV or Excel file to create new products'
              : 'Upload a CSV or Excel file to update existing products'
            )}
            {step === 'mapping' && 'Map CSV columns to product fields'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            {/* Download Template Section */}
            <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Need a template?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Download a sample CSV file with the correct column headers and example data
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
                  <Download className="w-4 h-4" />
                  Download Template
                </Button>
              </div>
            </div>

            {/* Identifier Selection Panel - shown for both modes */}
            <div className="p-4 border rounded-lg bg-muted/30">
              <Label className="text-sm font-medium mb-1 block">
                {mode === 'create' 
                  ? 'Select identifiers to import:' 
                  : 'Match products by (select one or more):'}
              </Label>
              <p className="text-xs text-muted-foreground mb-3">
                {mode === 'create'
                  ? 'Choose which product identifiers your CSV contains'
                  : 'Products will be matched using any of the selected identifiers'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {identifierFieldOptions.map(option => (
                  <div key={option.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={`match-${option.id}`}
                      checked={selectedMatchFields.includes(option.id)}
                      onCheckedChange={() => toggleMatchField(option.id)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label htmlFor={`match-${option.id}`} className="cursor-pointer text-sm font-medium">
                        {option.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-border rounded-lg">
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4 text-center">
                Drag and drop a CSV or Excel file, or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Select File
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Supported formats: CSV, XLSX, XLS
              </p>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <ScrollArea className="flex-1 max-h-[50vh] pr-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{file?.name}</span>
                <Badge variant="secondary">{csvData.length} rows</Badge>
                {mode === 'update' && (
                  <Badge variant="outline" className="ml-auto">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Update Mode
                  </Badge>
                )}
                {mode === 'create' && (
                  <Badge variant="outline" className="ml-auto">
                    <Plus className="w-3 h-3 mr-1" />
                    Create Mode
                  </Badge>
                )}
              </div>
              
              <div className="grid gap-3">
                {productFields.map(field => {
                  const isRequired = mode === 'create' 
                    ? field.required 
                    : selectedMatchFields.includes(field.id);
                  
                  return (
                    <div key={field.id} className="flex items-center gap-3">
                      <div className="w-40 flex items-center gap-1">
                        <span className="text-sm font-medium">{field.label}</span>
                        {isRequired && (
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
                      ) : isRequired ? (
                        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="flex-shrink-0">
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={!requiredFieldsMapped}
              >
                {mode === 'create' ? (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create {csvData.length} Products
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Update {csvData.length} Products
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
