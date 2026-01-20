export type OfferType = 
  | 'free_shipping'
  | 'percent_discount'
  | 'fixed_discount'
  | 'quantity_discount'
  | 'bulk_purchase'
  | 'bogo_half'    // Buy one get one 50% off
  | 'bogo_free';   // Buy one get one free

export type OfferStatus = 'active' | 'scheduled' | 'expired' | 'ending_soon' | 'just_created';

export type OfferScope = 'product' | 'marketplace';

export interface OfferCondition {
  minQty?: number;           // Minimum quantity for discount
  minPurchaseAmount?: number; // Minimum purchase amount
  buyQty?: number;           // Buy X quantity (for BOGO)
  getQty?: number;           // Get Y quantity (for BOGO)
}

export interface Offer {
  id: string;
  name: string;
  description?: string;
  type: OfferType;
  scope: OfferScope;
  
  // Discount values
  discountPercent?: number;   // For percent_discount
  discountAmount?: number;    // For fixed_discount
  
  // Conditions
  condition?: OfferCondition;
  
  // Time period
  startDate: Date;
  endDate: Date;
  
  // Targeting
  productIds: string[];       // Products this offer applies to
  marketplaces: string[];     // Marketplaces where offer is active (empty = all)
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Helper to calculate offer status based on dates
export function getOfferStatus(offer: Offer): OfferStatus {
  const now = new Date();
  const start = new Date(offer.startDate);
  const end = new Date(offer.endDate);
  
  if (!offer.isActive) {
    return 'expired';
  }
  
  if (now < start) {
    return 'scheduled';
  }
  
  if (now > end) {
    return 'expired';
  }
  
  // Check if just created (within last 24 hours)
  const createdAt = new Date(offer.createdAt);
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceCreation <= 24 && now >= start && now <= end) {
    return 'just_created';
  }
  
  // Check if ending soon (within 48 hours)
  const hoursUntilEnd = (end.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilEnd <= 48 && hoursUntilEnd > 0) {
    return 'ending_soon';
  }
  
  return 'active';
}

// Helper to format offer discount display
export function formatOfferDiscount(offer: Offer): string {
  switch (offer.type) {
    case 'free_shipping':
      return 'Free Shipping';
    case 'percent_discount':
      return `${offer.discountPercent}% Off`;
    case 'fixed_discount':
      return `$${offer.discountAmount?.toFixed(2)} Off`;
    case 'quantity_discount':
      return `${offer.discountPercent}% Off (${offer.condition?.minQty}+ units)`;
    case 'bulk_purchase':
      return `Bulk: ${offer.discountPercent}% Off (${offer.condition?.minQty}+ units)`;
    case 'bogo_half':
      return `BOGO 50% Off`;
    case 'bogo_free':
      return `BOGO Free`;
    default:
      return 'Special Offer';
  }
}

// Helper to get days remaining
export function getOfferDaysRemaining(offer: Offer): number {
  const now = new Date();
  const end = new Date(offer.endDate);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Offer type labels for UI
export const offerTypeLabels: Record<OfferType, string> = {
  free_shipping: 'Free Shipping',
  percent_discount: '% Discount',
  fixed_discount: '$ Discount',
  quantity_discount: 'Quantity Discount',
  bulk_purchase: 'Bulk Purchase',
  bogo_half: 'Buy 1 Get 1 50% Off',
  bogo_free: 'Buy 1 Get 1 Free',
};

// Offer status labels and colors
export const offerStatusConfig: Record<OfferStatus, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Active', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  scheduled: { label: 'Scheduled', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  expired: { label: 'Expired', color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
  ending_soon: { label: 'Ending Soon', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  just_created: { label: 'Just Created', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
};
