import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarketplaceLogo } from '@/components/products/MarketplaceLogo';
import { supabase } from '@/integrations/supabase/client';
import { BatchItem, BatchItemStatus } from '@/types/batch';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Package,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BatchProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string | null;
  batchName: string;
  totalItems: number;
  onViewBatch?: () => void;
}

interface ItemProgress {
  id: string;
  product_name: string;
  product_sku: string | null;
  marketplace: string;
  status: BatchItemStatus;
  error_message: string | null;
}

export function BatchProgressDialog({
  open,
  onOpenChange,
  batchId,
  batchName,
  totalItems,
  onViewBatch,
}: BatchProgressDialogProps) {
  const [items, setItems] = useState<ItemProgress[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!batchId) return;
    
    const { data } = await supabase
      .from('batch_items')
      .select('id, product_name, product_sku, marketplace, status, error_message')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true });

    if (data) {
      setItems(data as ItemProgress[]);
      
      // Check if all items are complete
      const allComplete = data.every(
        (item) => item.status === 'success' || item.status === 'failed'
      );
      setIsComplete(allComplete);
    }
  }, [batchId]);

  // Subscribe to realtime updates for batch items
  useEffect(() => {
    if (!batchId || !open) return;

    fetchItems();

    const channel = supabase
      .channel(`batch_items_${batchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'batch_items',
          filter: `batch_id=eq.${batchId}`,
        },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [batchId, open, fetchItems]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setItems([]);
      setIsComplete(false);
    }
  }, [open]);

  const successCount = items.filter((i) => i.status === 'success').length;
  const failedCount = items.filter((i) => i.status === 'failed').length;
  const processingCount = items.filter((i) => i.status === 'processing').length;
  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const completedCount = successCount + failedCount;
  const progressPercent = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

  const getStatusIcon = (status: BatchItemStatus) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-primary" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: BatchItemStatus) => {
    switch (status) {
      case 'success':
        return <Badge variant="secondary" className="text-xs">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      case 'processing':
        return <Badge className="text-xs bg-primary">Processing</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-xs">Pending</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <>
                {failedCount > 0 ? (
                  <XCircle className="w-5 h-5 text-destructive" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
                Batch Complete
              </>
            ) : (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Publishing to Marketplaces
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {batchName} • {totalItems} items
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isComplete ? 'Completed' : 'Processing...'}
              </span>
              <span className="font-medium">
                {completedCount} / {totalItems}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Status Summary */}
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{successCount} Success</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium">{failedCount} Failed</span>
            </div>
            {processingCount > 0 && (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm font-medium">{processingCount} Processing</span>
              </div>
            )}
            {pendingCount > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{pendingCount} Pending</span>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-hidden border rounded-lg">
            <ScrollArea className="h-full max-h-[300px]">
              <div className="divide-y">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 p-3 transition-colors",
                      item.status === 'processing' && "bg-primary/5",
                      item.status === 'failed' && "bg-destructive/5"
                    )}
                  >
                    {getStatusIcon(item.status)}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <MarketplaceLogo platform={item.marketplace} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {item.product_name}
                        </span>
                        {item.product_sku && (
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                            {item.product_sku}
                          </code>
                        )}
                      </div>
                      {item.error_message && (
                        <p className="text-xs text-destructive mt-0.5 truncate">
                          {item.error_message}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {isComplete ? (
              failedCount > 0 ? (
                <span className="text-destructive">
                  {failedCount} item{failedCount > 1 ? 's' : ''} failed. You can retry from the Batch Management page.
                </span>
              ) : (
                <span className="text-primary">All items published successfully!</span>
              )
            ) : (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Updates in real-time
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {isComplete && onViewBatch && (
              <Button variant="outline" onClick={onViewBatch}>
                <Package className="w-4 h-4 mr-2" />
                View Batch Details
              </Button>
            )}
            <Button 
              onClick={() => onOpenChange(false)}
              variant={isComplete ? 'default' : 'outline'}
            >
              {isComplete ? 'Done' : 'Run in Background'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}