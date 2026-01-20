import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MarketplaceLogo } from './MarketplaceLogo';
import { MarketplaceBatch, BatchItem, BatchStatus, BatchItemStatus } from '@/types/batch';
import {
  History,
  ChevronDown,
  ChevronRight,
  Play,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BatchHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batches: MarketplaceBatch[];
  onFetchBatchItems: (batchId: string) => Promise<BatchItem[]>;
  onProcessBatch: (batchId: string) => Promise<void>;
  onRetryFailed: (batchId: string, itemIds?: string[]) => Promise<void>;
  onDeleteBatch: (batchId: string) => Promise<void>;
}

const statusConfig: Record<BatchStatus, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  processing: { label: 'Processing', icon: Loader2, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  completed: { label: 'Completed', icon: CheckCircle2, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  failed: { label: 'Has Errors', icon: XCircle, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

const itemStatusConfig: Record<BatchItemStatus, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'text-yellow-600' },
  processing: { label: 'Processing', icon: Loader2, className: 'text-blue-600' },
  success: { label: 'Success', icon: CheckCircle2, className: 'text-green-600' },
  failed: { label: 'Failed', icon: XCircle, className: 'text-red-600' },
};

export function BatchHistoryDialog({
  open,
  onOpenChange,
  batches,
  onFetchBatchItems,
  onProcessBatch,
  onRetryFailed,
  onDeleteBatch,
}: BatchHistoryDialogProps) {
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [batchItems, setBatchItems] = useState<Record<string, BatchItem[]>>({});
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [processingBatch, setProcessingBatch] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const toggleBatchExpanded = async (batchId: string) => {
    const newExpanded = new Set(expandedBatches);
    if (newExpanded.has(batchId)) {
      newExpanded.delete(batchId);
    } else {
      newExpanded.add(batchId);
      // Fetch items if not already loaded
      if (!batchItems[batchId]) {
        setLoadingItems((prev) => new Set(prev).add(batchId));
        const items = await onFetchBatchItems(batchId);
        setBatchItems((prev) => ({ ...prev, [batchId]: items }));
        setLoadingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(batchId);
          return newSet;
        });
      }
    }
    setExpandedBatches(newExpanded);
  };

  const handleProcess = async (batchId: string) => {
    setProcessingBatch(batchId);
    await onProcessBatch(batchId);
    // Refresh items
    const items = await onFetchBatchItems(batchId);
    setBatchItems((prev) => ({ ...prev, [batchId]: items }));
    setProcessingBatch(null);
  };

  const handleRetryAll = async (batchId: string) => {
    await onRetryFailed(batchId);
    const items = await onFetchBatchItems(batchId);
    setBatchItems((prev) => ({ ...prev, [batchId]: items }));
  };

  const handleRetrySelected = async (batchId: string) => {
    const itemIds = Array.from(selectedItems);
    await onRetryFailed(batchId, itemIds);
    const items = await onFetchBatchItems(batchId);
    setBatchItems((prev) => ({ ...prev, [batchId]: items }));
    setSelectedItems(new Set());
  };

  const toggleItemSelection = (itemId: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setSelectedItems(newSet);
  };

  const selectAllFailed = (batchId: string) => {
    const items = batchItems[batchId] || [];
    const failedIds = items.filter((i) => i.status === 'failed').map((i) => i.id);
    setSelectedItems(new Set(failedIds));
  };

  // Clear selections when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedItems(new Set());
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Batch History
          </DialogTitle>
          <DialogDescription>
            View and manage your marketplace listing batches.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {batches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No batches yet</p>
              <p className="text-sm">Create a batch by selecting products and clicking "List to Marketplaces"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {batches.map((batch) => {
                const status = statusConfig[batch.status];
                const StatusIcon = status.icon;
                const isExpanded = expandedBatches.has(batch.id);
                const items = batchItems[batch.id] || [];
                const isLoadingItems = loadingItems.has(batch.id);
                const failedItems = items.filter((i) => i.status === 'failed');
                const hasSelectedItems = selectedItems.size > 0;

                return (
                  <Collapsible
                    key={batch.id}
                    open={isExpanded}
                    onOpenChange={() => toggleBatchExpanded(batch.id)}
                  >
                    <div className="border rounded-lg overflow-hidden">
                      {/* Batch Header */}
                      <CollapsibleTrigger asChild>
                        <button className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            <div>
                              <div className="font-medium">{batch.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(batch.created_at), { addSuffix: true })}
                                {' · '}
                                {batch.total_items} items · {batch.selected_marketplaces.length} marketplaces
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={status.className}>
                              <StatusIcon className={`w-3 h-3 mr-1 ${batch.status === 'processing' ? 'animate-spin' : ''}`} />
                              {status.label}
                            </Badge>
                            {batch.status === 'completed' || batch.status === 'failed' ? (
                              <span className="text-xs text-muted-foreground">
                                {batch.success_count} ✓ / {batch.failed_count} ✗
                              </span>
                            ) : null}
                          </div>
                        </button>
                      </CollapsibleTrigger>

                      {/* Batch Actions & Items */}
                      <CollapsibleContent>
                        <div className="border-t">
                          {/* Action Bar */}
                          <div className="flex items-center gap-2 p-2 bg-muted/30 border-b">
                            {batch.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleProcess(batch.id)}
                                disabled={processingBatch === batch.id}
                                className="gap-1"
                              >
                                {processingBatch === batch.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Play className="w-3.5 h-3.5" />
                                )}
                                Start Processing
                              </Button>
                            )}
                            {batch.status === 'failed' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRetryAll(batch.id)}
                                  className="gap-1"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  Retry All Failed ({failedItems.length})
                                </Button>
                                {hasSelectedItems && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleRetrySelected(batch.id)}
                                    className="gap-1"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Retry Selected ({selectedItems.size})
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => selectAllFailed(batch.id)}
                                  className="text-xs"
                                >
                                  Select All Failed
                                </Button>
                              </>
                            )}
                            <div className="flex-1" />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Batch?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the batch "{batch.name}" and all its items.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onDeleteBatch(batch.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>

                          {/* Items List */}
                          <div className="max-h-[300px] overflow-y-auto">
                            {isLoadingItems ? (
                              <div className="p-4 text-center text-muted-foreground">
                                <Loader2 className="w-5 h-5 mx-auto animate-spin mb-2" />
                                Loading items...
                              </div>
                            ) : items.length === 0 ? (
                              <div className="p-4 text-center text-muted-foreground text-sm">
                                No items in this batch
                              </div>
                            ) : (
                              <table className="w-full text-sm">
                                <thead className="bg-muted/50 sticky top-0">
                                  <tr>
                                    {batch.status === 'failed' && (
                                      <th className="w-8 p-2"></th>
                                    )}
                                    <th className="text-left p-2 font-medium">Product</th>
                                    <th className="text-left p-2 font-medium w-24">Marketplace</th>
                                    <th className="text-left p-2 font-medium w-24">Status</th>
                                    <th className="text-left p-2 font-medium">Error</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((item) => {
                                    const itemStatus = itemStatusConfig[item.status];
                                    const ItemIcon = itemStatus.icon;
                                    const isFailed = item.status === 'failed';

                                    return (
                                      <tr
                                        key={item.id}
                                        className={`border-t ${isFailed ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}
                                      >
                                        {batch.status === 'failed' && (
                                          <td className="p-2">
                                            {isFailed && (
                                              <Checkbox
                                                checked={selectedItems.has(item.id)}
                                                onCheckedChange={() => toggleItemSelection(item.id)}
                                              />
                                            )}
                                          </td>
                                        )}
                                        <td className="p-2 max-w-[200px] truncate" title={item.product_name}>
                                          {item.product_name}
                                        </td>
                                        <td className="p-2">
                                          <div className="flex items-center gap-1">
                                            <MarketplaceLogo platform={item.marketplace} size="sm" />
                                          </div>
                                        </td>
                                        <td className="p-2">
                                          <span className={`flex items-center gap-1 ${itemStatus.className}`}>
                                            <ItemIcon className={`w-3.5 h-3.5 ${item.status === 'processing' ? 'animate-spin' : ''}`} />
                                            {itemStatus.label}
                                          </span>
                                        </td>
                                        <td className="p-2 text-xs text-muted-foreground">
                                          {item.error_message && (
                                            <span className="flex items-center gap-1 text-red-600">
                                              <AlertCircle className="w-3 h-3" />
                                              {item.error_message}
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
