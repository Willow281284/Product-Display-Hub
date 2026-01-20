import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MarketplaceBatch, BatchItem, BatchStatus, BatchItemStatus } from '@/types/batch';
import { useToast } from '@/hooks/use-toast';

export function useBatchOperations() {
  const [batches, setBatches] = useState<MarketplaceBatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch all batches for the current user
  const fetchBatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketplace_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: 'Error fetching batches',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch items for a specific batch
  const fetchBatchItems = useCallback(async (batchId: string): Promise<BatchItem[]> => {
    try {
      const { data, error } = await supabase
        .from('batch_items')
        .select('*')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching batch items:', error);
      return [];
    }
  }, []);

  // Create a new batch with items
  const createBatch = useCallback(async (
    name: string,
    products: { id: string; name: string; sku?: string; stockQty?: number; salePrice?: number; profitMargin?: number }[],
    marketplaces: string[],
    userId: string
  ): Promise<MarketplaceBatch | null> => {
    try {
      // Create the batch
      const { data: batch, error: batchError } = await supabase
        .from('marketplace_batches')
        .insert({
          user_id: userId,
          name,
          status: 'pending' as BatchStatus,
          total_items: products.length * marketplaces.length,
          selected_marketplaces: marketplaces,
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Create batch items for each product/marketplace combination
      const batchItems = products.flatMap((product) =>
        marketplaces.map((marketplace) => ({
          batch_id: batch.id,
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku || null,
          stock_qty: product.stockQty ?? null,
          sale_price: product.salePrice ?? null,
          profit_margin: product.profitMargin ?? null,
          marketplace,
          status: 'pending' as BatchItemStatus,
        }))
      );

      const { error: itemsError } = await supabase
        .from('batch_items')
        .insert(batchItems);

      if (itemsError) throw itemsError;

      toast({
        title: 'Batch created',
        description: `Created batch "${name}" with ${batchItems.length} items`,
      });

      // Refresh batches
      fetchBatches();

      return batch;
    } catch (error) {
      console.error('Error creating batch:', error);
      toast({
        title: 'Error creating batch',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      return null;
    }
  }, [fetchBatches, toast]);

  // Start processing a batch (simulate marketplace listing)
  const processBatch = useCallback(async (batchId: string) => {
    try {
      // Update batch status to processing
      await supabase
        .from('marketplace_batches')
        .update({ status: 'processing' as BatchStatus })
        .eq('id', batchId);

      // Get all pending items for this batch
      const { data: items, error: itemsError } = await supabase
        .from('batch_items')
        .select('*')
        .eq('batch_id', batchId)
        .eq('status', 'pending');

      if (itemsError) throw itemsError;

      let successCount = 0;
      let failedCount = 0;

      // Process each item (simulated)
      for (const item of items || []) {
        // Update item to processing
        await supabase
          .from('batch_items')
          .update({ status: 'processing' as BatchItemStatus })
          .eq('id', item.id);

        // Simulate API call with random success/failure (90% success rate)
        await new Promise((resolve) => setTimeout(resolve, 100));
        const isSuccess = Math.random() > 0.1;

        if (isSuccess) {
          await supabase
            .from('batch_items')
            .update({ status: 'success' as BatchItemStatus, error_message: null })
            .eq('id', item.id);
          successCount++;
        } else {
          const errorMessages = [
            'API rate limit exceeded',
            'Invalid product data',
            'Marketplace authentication failed',
            'Product already exists',
            'Missing required fields',
          ];
          const errorMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];
          await supabase
            .from('batch_items')
            .update({ status: 'failed' as BatchItemStatus, error_message: errorMessage })
            .eq('id', item.id);
          failedCount++;
        }
      }

      // Update batch with final counts
      const finalStatus: BatchStatus = failedCount > 0 ? 'failed' : 'completed';
      await supabase
        .from('marketplace_batches')
        .update({
          status: finalStatus,
          success_count: successCount,
          failed_count: failedCount,
        })
        .eq('id', batchId);

      toast({
        title: 'Batch processing complete',
        description: `${successCount} succeeded, ${failedCount} failed`,
        variant: failedCount > 0 ? 'destructive' : 'default',
      });

      fetchBatches();
    } catch (error) {
      console.error('Error processing batch:', error);
      toast({
        title: 'Error processing batch',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  }, [fetchBatches, toast]);

  // Retry failed items in a batch
  const retryFailedItems = useCallback(async (batchId: string, itemIds?: string[]) => {
    try {
      // Reset specified items or all failed items to pending
      let query = supabase
        .from('batch_items')
        .update({ status: 'pending' as BatchItemStatus, error_message: null });

      if (itemIds && itemIds.length > 0) {
        query = query.in('id', itemIds);
      } else {
        query = query.eq('batch_id', batchId).eq('status', 'failed');
      }

      const { error } = await query;
      if (error) throw error;

      // Update batch status back to pending
      await supabase
        .from('marketplace_batches')
        .update({ status: 'pending' as BatchStatus })
        .eq('id', batchId);

      toast({
        title: 'Items reset for retry',
        description: 'Failed items have been queued for retry',
      });

      fetchBatches();
    } catch (error) {
      console.error('Error retrying items:', error);
      toast({
        title: 'Error retrying items',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  }, [fetchBatches, toast]);

  // Update batch name
  const updateBatchName = useCallback(async (batchId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_batches')
        .update({ name: newName })
        .eq('id', batchId);

      if (error) throw error;

      toast({
        title: 'Batch renamed',
        description: `Batch renamed to "${newName}"`,
      });

      fetchBatches();
    } catch (error) {
      console.error('Error updating batch name:', error);
      toast({
        title: 'Error renaming batch',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  }, [fetchBatches, toast]);

  // Delete a batch
  const deleteBatch = useCallback(async (batchId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_batches')
        .delete()
        .eq('id', batchId);

      if (error) throw error;

      toast({
        title: 'Batch deleted',
        description: 'The batch has been removed',
      });

      fetchBatches();
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast({
        title: 'Error deleting batch',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  }, [fetchBatches, toast]);

  // Update a batch item and retry it
  const updateBatchItemAndRetry = useCallback(async (
    itemId: string,
    updates: {
      product_name: string;
      product_sku: string | null;
      stock_qty: number | null;
      sale_price: number | null;
      profit_margin: number | null;
    }
  ) => {
    try {
      // Update the item with new values and reset status to pending
      const { error } = await supabase
        .from('batch_items')
        .update({
          ...updates,
          status: 'pending' as BatchItemStatus,
          error_message: null,
        })
        .eq('id', itemId);

      if (error) throw error;

      // Get the batch_id for this item to update batch status
      const { data: item } = await supabase
        .from('batch_items')
        .select('batch_id')
        .eq('id', itemId)
        .single();

      if (item) {
        // Update batch status back to pending
        await supabase
          .from('marketplace_batches')
          .update({ status: 'pending' as BatchStatus })
          .eq('id', item.batch_id);
      }

      toast({
        title: 'Item updated',
        description: 'Item has been updated and queued for retry',
      });

      fetchBatches();
    } catch (error) {
      console.error('Error updating batch item:', error);
      toast({
        title: 'Error updating item',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  }, [fetchBatches, toast]);

  // Subscribe to realtime updates
  useEffect(() => {
    fetchBatches();

    const batchesChannel = supabase
      .channel('marketplace_batches_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'marketplace_batches' },
        () => {
          fetchBatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(batchesChannel);
    };
  }, [fetchBatches]);

  return {
    batches,
    isLoading,
    fetchBatches,
    fetchBatchItems,
    createBatch,
    processBatch,
    retryFailedItems,
    updateBatchName,
    deleteBatch,
    updateBatchItemAndRetry,
  };
}
