import { useState, useCallback, useMemo } from 'react';
import { Offer, OfferType, OfferScope, getOfferStatus, OfferStatus } from '@/types/offer';

// Generate some mock offers for demo
const generateMockOffers = (): Offer[] => {
  const now = new Date();
  const offers: Offer[] = [
    {
      id: 'offer-1',
      name: 'Summer Sale',
      description: '20% off all products',
      type: 'percent_discount',
      scope: 'product',
      discountPercent: 20,
      startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      productIds: ['1', '2', '3', '10', '15'],
      marketplaces: ['amazon', 'walmart'],
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: now,
      isActive: true,
    },
    {
      id: 'offer-2',
      name: 'Free Shipping Weekend',
      type: 'free_shipping',
      scope: 'marketplace',
      startDate: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
      endDate: new Date(now.getTime() + 36 * 60 * 60 * 1000), // 36 hours from now
      productIds: ['5', '8', '12', '20', '25', '30'],
      marketplaces: ['amazon'],
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      updatedAt: now,
      isActive: true,
    },
    {
      id: 'offer-3',
      name: 'BOGO Electronics',
      description: 'Buy one get one 50% off',
      type: 'bogo_half',
      scope: 'product',
      condition: { buyQty: 1, getQty: 1 },
      startDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      productIds: ['40', '41', '42', '45', '50'],
      marketplaces: [],
      createdAt: now,
      updatedAt: now,
      isActive: true,
    },
    {
      id: 'offer-4',
      name: 'Bulk Discount',
      description: '15% off when buying 5+ units',
      type: 'bulk_purchase',
      scope: 'product',
      discountPercent: 15,
      condition: { minQty: 5 },
      startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // Ending soon
      productIds: ['60', '61', '62', '63'],
      marketplaces: ['ebay', 'walmart'],
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      updatedAt: now,
      isActive: true,
    },
  ];
  return offers;
};

const OFFERS_STORAGE_KEY = 'product_offers';

const loadOffers = (): Offer[] => {
  try {
    const stored = localStorage.getItem(OFFERS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((o: any) => ({
        ...o,
        startDate: new Date(o.startDate),
        endDate: new Date(o.endDate),
        createdAt: new Date(o.createdAt),
        updatedAt: new Date(o.updatedAt),
      }));
    }
  } catch (e) {
    console.error('Failed to load offers:', e);
  }
  return generateMockOffers();
};

const saveOffers = (offers: Offer[]) => {
  try {
    localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(offers));
  } catch (e) {
    console.error('Failed to save offers:', e);
  }
};

export function useOffers() {
  const [offers, setOffers] = useState<Offer[]>(loadOffers);

  const addOffer = useCallback((offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newOffer: Offer = {
      ...offer,
      id: `offer-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setOffers(prev => {
      const updated = [...prev, newOffer];
      saveOffers(updated);
      return updated;
    });
    return newOffer;
  }, []);

  const updateOffer = useCallback((offerId: string, updates: Partial<Offer>) => {
    setOffers(prev => {
      const updated = prev.map(o => 
        o.id === offerId 
          ? { ...o, ...updates, updatedAt: new Date() }
          : o
      );
      saveOffers(updated);
      return updated;
    });
  }, []);

  const deleteOffer = useCallback((offerId: string) => {
    setOffers(prev => {
      const updated = prev.filter(o => o.id !== offerId);
      saveOffers(updated);
      return updated;
    });
  }, []);

  const getOffersForProduct = useCallback((productId: string): Offer[] => {
    return offers.filter(o => 
      o.isActive && 
      o.productIds.includes(productId) &&
      getOfferStatus(o) !== 'expired'
    );
  }, [offers]);

  const getOffersForMarketplace = useCallback((marketplace: string): Offer[] => {
    return offers.filter(o => 
      o.isActive && 
      (o.marketplaces.length === 0 || o.marketplaces.includes(marketplace)) &&
      getOfferStatus(o) !== 'expired'
    );
  }, [offers]);

  const getActiveOffers = useMemo(() => {
    return offers.filter(o => {
      const status = getOfferStatus(o);
      return status === 'active' || status === 'just_created' || status === 'ending_soon';
    });
  }, [offers]);

  const getScheduledOffers = useMemo(() => {
    return offers.filter(o => getOfferStatus(o) === 'scheduled');
  }, [offers]);

  const getExpiredOffers = useMemo(() => {
    return offers.filter(o => getOfferStatus(o) === 'expired');
  }, [offers]);

  // Check if a product has any active offers
  const productHasOffer = useCallback((productId: string): boolean => {
    return offers.some(o => {
      const status = getOfferStatus(o);
      return o.productIds.includes(productId) && 
             (status === 'active' || status === 'just_created' || status === 'ending_soon');
    });
  }, [offers]);

  // Get the best offer for display on a product
  const getBestOfferForProduct = useCallback((productId: string): Offer | null => {
    const productOffers = getOffersForProduct(productId);
    if (productOffers.length === 0) return null;
    
    // Prioritize: ending_soon > just_created > active
    // Then by discount value
    return productOffers.sort((a, b) => {
      const statusA = getOfferStatus(a);
      const statusB = getOfferStatus(b);
      
      const statusPriority: Record<OfferStatus, number> = {
        ending_soon: 3,
        just_created: 2,
        active: 1,
        scheduled: 0,
        expired: -1,
      };
      
      if (statusPriority[statusA] !== statusPriority[statusB]) {
        return statusPriority[statusB] - statusPriority[statusA];
      }
      
      // Compare by discount
      const discountA = a.discountPercent || a.discountAmount || 0;
      const discountB = b.discountPercent || b.discountAmount || 0;
      return discountB - discountA;
    })[0];
  }, [getOffersForProduct]);

  return {
    offers,
    addOffer,
    updateOffer,
    deleteOffer,
    getOffersForProduct,
    getOffersForMarketplace,
    getActiveOffers,
    getScheduledOffers,
    getExpiredOffers,
    productHasOffer,
    getBestOfferForProduct,
  };
}
