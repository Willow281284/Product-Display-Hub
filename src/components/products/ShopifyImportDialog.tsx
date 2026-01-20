import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Store, Link2, AlertTriangle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShopifyImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (products: Record<string, string>[]) => void;
}

export function ShopifyImportDialog({ open, onOpenChange, onImport }: ShopifyImportDialogProps) {
  const { toast } = useToast();
  const [storeName, setStoreName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!storeName.trim() || !apiKey.trim()) {
      toast({
        title: "Missing credentials",
        description: "Please enter your Shopify store name and API key",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    
    // Simulate API connection
    setTimeout(() => {
      toast({
        title: "Connection coming soon",
        description: "Shopify integration is under development. Check back soon!",
        variant: "default",
      });
      setIsConnecting(false);
    }, 1500);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStoreName('');
      setApiKey('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-green-500" />
            Import from Shopify
          </DialogTitle>
          <DialogDescription>
            Connect your Shopify store to import products
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning">Coming Soon</p>
              <p className="text-muted-foreground mt-1">
                Shopify integration is currently under development. 
                For now, you can export your products from Shopify and import via CSV.
              </p>
            </div>
          </div>

          <div className="space-y-4 opacity-60 pointer-events-none">
            <div className="grid gap-2">
              <Label htmlFor="storeName">Store Name</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="storeName"
                  placeholder="your-store-name"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  disabled
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">.myshopify.com</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="apiKey">Admin API Access Token</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="shpat_xxxxxxxxxxxxx"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Link2 className="w-4 h-4 text-muted-foreground" />
            <a 
              href="https://admin.shopify.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Open Shopify Admin
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Badge variant="outline" className="text-xs">
            API Integration
          </Badge>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnect} disabled={isConnecting} className="gap-2">
              {isConnecting ? (
                <>Connecting...</>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Connect Store
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
