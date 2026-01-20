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
import { ShoppingCart, Link2, AlertTriangle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AmazonImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (products: Record<string, string>[]) => void;
}

export function AmazonImportDialog({ open, onOpenChange, onImport }: AmazonImportDialogProps) {
  const { toast } = useToast();
  const [sellerId, setSellerId] = useState('');
  const [mwsToken, setMwsToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!sellerId.trim() || !mwsToken.trim()) {
      toast({
        title: "Missing credentials",
        description: "Please enter your Amazon Seller ID and MWS Auth Token",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    
    // Simulate API connection
    setTimeout(() => {
      toast({
        title: "Connection coming soon",
        description: "Amazon Seller Central integration is under development. Check back soon!",
        variant: "default",
      });
      setIsConnecting(false);
    }, 1500);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSellerId('');
      setMwsToken('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-500" />
            Import from Amazon
          </DialogTitle>
          <DialogDescription>
            Connect your Amazon Seller Central account to import products
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning">Coming Soon</p>
              <p className="text-muted-foreground mt-1">
                Amazon Seller Central integration is currently under development. 
                For now, you can export your products from Amazon and import via CSV.
              </p>
            </div>
          </div>

          <div className="space-y-4 opacity-60 pointer-events-none">
            <div className="grid gap-2">
              <Label htmlFor="sellerId">Amazon Seller ID</Label>
              <Input
                id="sellerId"
                placeholder="e.g., A1B2C3D4E5F6G7"
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
                disabled
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mwsToken">MWS Auth Token</Label>
              <Input
                id="mwsToken"
                type="password"
                placeholder="Your MWS authentication token"
                value={mwsToken}
                onChange={(e) => setMwsToken(e.target.value)}
                disabled
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Link2 className="w-4 h-4 text-muted-foreground" />
            <a 
              href="https://sellercentral.amazon.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Open Amazon Seller Central
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
                  Connect Account
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
