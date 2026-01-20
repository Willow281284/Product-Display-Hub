import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MarketplaceLogo } from '@/components/products/MarketplaceLogo';
import { ProductAttributeEditor } from '@/components/batches/ProductAttributeEditor';
import { useBatchOperations } from '@/hooks/useBatchOperations';
import { BatchItem, BatchStatus, BatchItemStatus } from '@/types/batch';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  History,
  Play,
  RefreshCw,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Package,
  Save,
  X,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

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

export default function BatchManagement() {
  const {
    batches,
    isLoading,
    fetchBatchItems,
    processBatch,
    retryFailedItems,
    deleteBatch,
    updateBatchName,
    updateBatchItemAndRetry,
  } = useBatchOperations();

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [processingBatch, setProcessingBatch] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [errorDialogItem, setErrorDialogItem] = useState<BatchItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<BatchItemStatus | 'all'>('all');

  const selectedBatch = batches.find(b => b.id === selectedBatchId);

  // Load items when batch is selected
  useEffect(() => {
    if (selectedBatchId) {
      setLoadingItems(true);
      setStatusFilter('all'); // Reset filter when switching batches
      fetchBatchItems(selectedBatchId).then(items => {
        setBatchItems(items);
        setLoadingItems(false);
      });
    } else {
      setBatchItems([]);
    }
  }, [selectedBatchId, fetchBatchItems]);

  const handleProcess = async (batchId: string) => {
    setProcessingBatch(batchId);
    await processBatch(batchId);
    if (selectedBatchId === batchId) {
      const items = await fetchBatchItems(batchId);
      setBatchItems(items);
    }
    setProcessingBatch(null);
  };

  const handleRetryAll = async () => {
    if (!selectedBatchId) return;
    await retryFailedItems(selectedBatchId);
    const items = await fetchBatchItems(selectedBatchId);
    setBatchItems(items);
    setSelectedItemIds(new Set());
  };

  const handleRetrySelected = async () => {
    if (!selectedBatchId) return;
    const itemIds = Array.from(selectedItemIds);
    await retryFailedItems(selectedBatchId, itemIds);
    const items = await fetchBatchItems(selectedBatchId);
    setBatchItems(items);
    setSelectedItemIds(new Set());
  };

  const handleDelete = async (batchId: string) => {
    await deleteBatch(batchId);
    if (selectedBatchId === batchId) {
      setSelectedBatchId(null);
    }
  };

  const startEditName = (batchId: string, currentName: string) => {
    setEditingBatchId(batchId);
    setEditName(currentName);
  };

  const handleSaveName = async () => {
    if (!editingBatchId || !editName.trim()) return;
    await updateBatchName(editingBatchId, editName.trim());
    setEditingBatchId(null);
    setEditName('');
  };

  const cancelEditName = () => {
    setEditingBatchId(null);
    setEditName('');
  };

  const toggleItemSelection = (itemId: string) => {
    const newSet = new Set(selectedItemIds);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setSelectedItemIds(newSet);
  };

  const selectAllFailed = () => {
    const failedIds = batchItems.filter(i => i.status === 'failed').map(i => i.id);
    setSelectedItemIds(new Set(failedIds));
  };

  const handleSaveAndRetry = async (itemId: string, updates: {
    product_name: string;
    product_sku: string | null;
    stock_qty: number | null;
    sale_price: number | null;
    profit_margin: number | null;
  }) => {
    await updateBatchItemAndRetry(itemId, updates);
    if (selectedBatchId) {
      const items = await fetchBatchItems(selectedBatchId);
      setBatchItems(items);
    }
  };

  const failedItems = batchItems.filter(i => i.status === 'failed');
  const successItems = batchItems.filter(i => i.status === 'success');
  const pendingItems = batchItems.filter(i => i.status === 'pending');

  // Filtered items based on status filter
  const filteredItems = statusFilter === 'all' 
    ? batchItems 
    : batchItems.filter(i => i.status === statusFilter);

  const handleStatusFilterClick = (status: BatchItemStatus | 'all') => {
    setStatusFilter(prev => prev === status ? 'all' : status);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Products
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Batch Management</h1>
              <p className="text-sm text-muted-foreground">
                {batches.length} batch{batches.length !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Batches List - Left Panel */}
        <div className="w-96 border-r border-border flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <h2 className="font-semibold text-sm">All Batches</h2>
          </div>
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                <Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" />
                Loading batches...
              </div>
            ) : batches.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No batches yet</p>
                <p className="text-sm mt-1">
                  Select products and click "List to Marketplaces" to create a batch
                </p>
                <Link to="/">
                  <Button variant="outline" size="sm" className="mt-4">
                    Go to Products
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {batches.map(batch => {
                  const status = statusConfig[batch.status];
                  const StatusIcon = status.icon;
                  const isSelected = selectedBatchId === batch.id;
                  const isEditing = editingBatchId === batch.id;

                  return (
                    <Card
                      key={batch.id}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => !isEditing && setSelectedBatchId(batch.id)}
                    >
                      <CardHeader className="p-3 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          {isEditing ? (
                            <div className="flex-1 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <Input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="h-7 text-sm"
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveName();
                                  if (e.key === 'Escape') cancelEditName();
                                }}
                              />
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSaveName}>
                                <Save className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditName}>
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <CardTitle className="text-sm font-medium truncate flex-1">
                                {batch.name}
                              </CardTitle>
                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => startEditName(batch.id, batch.name)}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Batch?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete "{batch.name}" and all its items.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(batch.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </>
                          )}
                        </div>
                        <CardDescription className="text-xs">
                          {format(new Date(batch.created_at), 'MMM d, yyyy h:mm a')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="flex items-center justify-between">
                          <Badge className={status.className}>
                            <StatusIcon className={`w-3 h-3 mr-1 ${batch.status === 'processing' ? 'animate-spin' : ''}`} />
                            {status.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {batch.total_items} items
                          </span>
                        </div>
                        {(batch.status === 'completed' || batch.status === 'failed') && (
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-3 h-3" />
                              {batch.success_count}
                            </span>
                            <span className="flex items-center gap-1 text-red-600">
                              <XCircle className="w-3 h-3" />
                              {batch.failed_count}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {batch.selected_marketplaces.slice(0, 4).map(mp => (
                            <MarketplaceLogo key={mp} platform={mp} size="sm" />
                          ))}
                          {batch.selected_marketplaces.length > 4 && (
                            <span className="text-xs text-muted-foreground self-center">
                              +{batch.selected_marketplaces.length - 4} more
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Batch Details - Right Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedBatch ? (
            <>
              {/* Batch Header */}
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedBatch.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      Created {formatDistanceToNow(new Date(selectedBatch.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedBatch.status === 'pending' && (
                      <Button
                        onClick={() => handleProcess(selectedBatch.id)}
                        disabled={processingBatch === selectedBatch.id}
                        className="gap-2"
                      >
                        {processingBatch === selectedBatch.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        Start Processing
                      </Button>
                    )}
                    {selectedBatch.status === 'failed' && (
                      <>
                        <Button variant="outline" onClick={handleRetryAll} className="gap-2">
                          <RefreshCw className="w-4 h-4" />
                          Retry All Failed ({failedItems.length})
                        </Button>
                        {selectedItemIds.size > 0 && (
                          <Button onClick={handleRetrySelected} className="gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Retry Selected ({selectedItemIds.size})
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Stats - Clickable filters */}
                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={() => handleStatusFilterClick('success')}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-base font-medium transition-colors",
                      statusFilter === 'success'
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 ring-2 ring-green-500"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    disabled={successItems.length === 0}
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Success: {successItems.length}
                  </button>
                  <button
                    onClick={() => handleStatusFilterClick('failed')}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-base font-medium transition-colors",
                      statusFilter === 'failed'
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 ring-2 ring-red-500"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    disabled={failedItems.length === 0}
                  >
                    <XCircle className="w-4 h-4 text-red-600" />
                    Failed: {failedItems.length}
                  </button>
                  <button
                    onClick={() => handleStatusFilterClick('pending')}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-base font-medium transition-colors",
                      statusFilter === 'pending'
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 ring-2 ring-yellow-500"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    disabled={pendingItems.length === 0}
                  >
                    <Clock className="w-4 h-4 text-yellow-600" />
                    Pending: {pendingItems.length}
                  </button>
                  <div className="text-base text-muted-foreground ml-2">
                    {statusFilter !== 'all' ? (
                      <button 
                        onClick={() => setStatusFilter('all')}
                        className="hover:text-foreground underline"
                      >
                        Show all ({batchItems.length})
                      </button>
                    ) : (
                      `Total: ${batchItems.length} items`
                    )}
                  </div>
                </div>
              </div>

              {/* Action Bar for Failed */}
              {selectedBatch.status === 'failed' && failedItems.length > 0 && (
                <div className="p-2 border-b bg-red-50 dark:bg-red-950/30 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600 font-medium">
                    {failedItems.length} item{failedItems.length !== 1 ? 's' : ''} failed
                  </span>
                  <Button variant="ghost" size="sm" onClick={selectAllFailed} className="text-xs ml-auto">
                    Select All Failed
                  </Button>
                </div>
              )}

              {/* Items Table */}
              <ScrollArea className="flex-1">
                {loadingItems ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" />
                    Loading items...
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {statusFilter !== 'all' 
                      ? `No ${statusFilter} items in this batch`
                      : 'No items in this batch'}
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        {selectedBatch.status === 'failed' && (
                          <TableHead className="w-10"></TableHead>
                        )}
                        <TableHead className="w-14 text-sm font-semibold">Image</TableHead>
                        <TableHead className="text-sm font-semibold">Product</TableHead>
                        <TableHead className="w-28 text-sm font-semibold">SKU</TableHead>
                        <TableHead className="w-20 text-right text-sm font-semibold">Stock</TableHead>
                        <TableHead className="w-24 text-right text-sm font-semibold">Price</TableHead>
                        <TableHead className="w-20 text-right text-sm font-semibold">Margin</TableHead>
                        <TableHead className="w-28 text-sm font-semibold">Marketplace</TableHead>
                        <TableHead className="w-24 text-sm font-semibold">Status</TableHead>
                        <TableHead className="text-sm font-semibold">Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map(item => {
                        const itemStatus = itemStatusConfig[item.status];
                        const ItemIcon = itemStatus.icon;
                        const isFailed = item.status === 'failed';
                        const isSuccess = item.status === 'success';
                        const isClickable = isFailed || isSuccess;

                        return (
                          <TableRow
                            key={item.id}
                            className={cn(
                              isClickable && 'cursor-pointer',
                              isFailed && 'bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-950/40',
                              isSuccess && 'hover:bg-muted/50'
                            )}
                            onClick={() => isClickable && setErrorDialogItem(item)}
                          >
                            {selectedBatch.status === 'failed' && (
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                {isFailed && (
                                  <Checkbox
                                    checked={selectedItemIds.has(item.id)}
                                    onCheckedChange={() => toggleItemSelection(item.id)}
                                  />
                                )}
                              </TableCell>
                            )}
                            <TableCell className="w-14">
                              {item.product_image ? (
                                <img
                                  src={item.product_image}
                                  alt={item.product_name}
                                  className="w-10 h-10 rounded object-cover bg-muted"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                  <Package className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-base max-w-[200px] truncate" title={item.product_name}>
                              {item.product_name}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground font-mono">
                              {item.product_sku || '-'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-base">
                              {item.stock_qty ?? '-'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-base">
                              {item.sale_price != null ? `$${item.sale_price.toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-base">
                              {item.profit_margin != null ? (
                                <span className={item.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {item.profit_margin.toFixed(1)}%
                                </span>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <MarketplaceLogo platform={item.marketplace} size="sm" />
                            </TableCell>
                            <TableCell>
                              <span className={`flex items-center gap-1.5 text-base ${itemStatus.className}`}>
                                <ItemIcon className={`w-4 h-4 ${item.status === 'processing' ? 'animate-spin' : ''}`} />
                                {itemStatus.label}
                              </span>
                            </TableCell>
                            <TableCell className="text-base text-muted-foreground">
                              {item.error_message && (
                                <span className="flex items-center gap-1.5 text-red-600">
                                  <AlertCircle className="w-4 h-4 shrink-0" />
                                  <span className="truncate max-w-[150px]">{item.error_message}</span>
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Select a batch to view details</p>
                <p className="text-sm mt-1">Click on a batch from the left panel</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Attribute Editor */}
      <ProductAttributeEditor
        item={errorDialogItem}
        batchId={selectedBatchId || undefined}
        open={!!errorDialogItem}
        onOpenChange={(open) => !open && setErrorDialogItem(null)}
        onSaveAndRetry={handleSaveAndRetry}
        onNavigateToItem={(itemId) => {
          // Navigate to a different batch item (variation)
          const targetItem = batchItems.find(bi => bi.id === itemId);
          if (targetItem) {
            setErrorDialogItem(targetItem);
          }
        }}
      />
    </div>
  );
}
