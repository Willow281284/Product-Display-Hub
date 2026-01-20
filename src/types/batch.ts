export type BatchStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type BatchItemStatus = 'pending' | 'processing' | 'success' | 'failed';

export interface MarketplaceBatch {
  id: string;
  user_id: string;
  name: string;
  status: BatchStatus;
  total_items: number;
  success_count: number;
  failed_count: number;
  selected_marketplaces: string[];
  created_at: string;
  updated_at: string;
}

export interface BatchItem {
  id: string;
  batch_id: string;
  product_id: string;
  product_name: string;
  product_sku: string | null;
  product_image: string | null;
  stock_qty: number | null;
  sale_price: number | null;
  profit_margin: number | null;
  marketplace: string;
  status: BatchItemStatus;
  error_message: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BatchWithItems extends MarketplaceBatch {
  items: BatchItem[];
}
