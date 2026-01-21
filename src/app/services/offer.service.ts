import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import {
  Offer,
  OfferStatus,
  OfferType,
  getOfferStatus,
} from '@/types/offer';

const OFFERS_STORAGE_KEY = 'product_offers';

const generateMockOffers = (): Offer[] => {
  const now = new Date();
  return [
    {
      id: 'offer-1',
      name: 'Summer Sale',
      description: '20% off all products',
      type: 'percent_discount',
      scope: 'product',
      discountPercent: 20,
      startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
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
      startDate: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 36 * 60 * 60 * 1000),
      productIds: ['5', '8', '12', '20', '25', '30'],
      marketplaces: ['amazon'],
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      updatedAt: now,
      isActive: true,
    },
  ];
};

const loadOffers = (): Offer[] => {
  try {
    const stored = localStorage.getItem(OFFERS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Offer[];
      return parsed.map((offer) => ({
        ...offer,
        startDate: new Date(offer.startDate),
        endDate: new Date(offer.endDate),
        createdAt: new Date(offer.createdAt),
        updatedAt: new Date(offer.updatedAt),
      }));
    }
  } catch (error) {
    console.error('Failed to load offers:', error);
  }
  return generateMockOffers();
};

const saveOffers = (offers: Offer[]): void => {
  try {
    localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(offers));
  } catch (error) {
    console.error('Failed to save offers:', error);
  }
};

@Injectable({ providedIn: 'root' })
export class OfferService {
  private readonly offersSubject = new BehaviorSubject<Offer[]>(loadOffers());
  readonly offers$ = this.offersSubject.asObservable();

  get offers(): Offer[] {
    return this.offersSubject.value;
  }

  addOffer(offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Offer {
    const created: Offer = {
      ...offer,
      id: `offer-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updated = [...this.offersSubject.value, created];
    this.offersSubject.next(updated);
    saveOffers(updated);
    return created;
  }

  updateOffer(offerId: string, updates: Partial<Offer>): void {
    const updated = this.offersSubject.value.map((offer) =>
      offer.id === offerId
        ? { ...offer, ...updates, updatedAt: new Date() }
        : offer
    );
    this.offersSubject.next(updated);
    saveOffers(updated);
  }

  deleteOffer(offerId: string): void {
    const updated = this.offersSubject.value.filter(
      (offer) => offer.id !== offerId
    );
    this.offersSubject.next(updated);
    saveOffers(updated);
  }

  getOffersForProduct(productId: string): Offer[] {
    return this.offersSubject.value.filter((offer) => {
      const status = getOfferStatus(offer);
      return (
        offer.isActive &&
        offer.productIds.includes(productId) &&
        status !== 'expired'
      );
    });
  }

  getBestOfferForProduct(productId: string): Offer | null {
    const offers = this.getOffersForProduct(productId);
    if (offers.length === 0) return null;

    const statusPriority: Record<OfferStatus, number> = {
      ending_soon: 3,
      just_created: 2,
      active: 1,
      scheduled: 0,
      expired: -1,
    };

    return offers.sort((a, b) => {
      const statusA = getOfferStatus(a);
      const statusB = getOfferStatus(b);
      if (statusPriority[statusA] !== statusPriority[statusB]) {
        return statusPriority[statusB] - statusPriority[statusA];
      }
      const discountA = a.discountPercent || a.discountAmount || 0;
      const discountB = b.discountPercent || b.discountAmount || 0;
      return discountB - discountA;
    })[0];
  }

  getOfferTypeOptions(): OfferType[] {
    return [
      'free_shipping',
      'percent_discount',
      'fixed_discount',
      'quantity_discount',
      'bulk_purchase',
      'bogo_half',
      'bogo_free',
    ];
  }
}
