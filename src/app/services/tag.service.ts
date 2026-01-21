import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Tag } from '@/types/tag';

const TAGS_STORAGE_KEY = 'product-tags';
const PRODUCT_TAGS_STORAGE_KEY = 'product-tag-assignments';

function loadTags(): Tag[] {
  try {
    const stored = localStorage.getItem(TAGS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Tag[]) : [];
  } catch {
    return [];
  }
}

function saveTags(tags: Tag[]): void {
  localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags));
}

function loadProductTags(): Record<string, string[]> {
  try {
    const stored = localStorage.getItem(PRODUCT_TAGS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

function saveProductTags(productTags: Record<string, string[]>): void {
  localStorage.setItem(
    PRODUCT_TAGS_STORAGE_KEY,
    JSON.stringify(productTags)
  );
}

@Injectable({ providedIn: 'root' })
export class TagService {
  private readonly tagsSubject = new BehaviorSubject<Tag[]>(loadTags());
  private readonly productTagsSubject = new BehaviorSubject<
    Record<string, string[]>
  >(loadProductTags());

  readonly tags$ = this.tagsSubject.asObservable();
  readonly productTags$ = this.productTagsSubject.asObservable();

  get tags(): Tag[] {
    return this.tagsSubject.value;
  }

  get productTags(): Record<string, string[]> {
    return this.productTagsSubject.value;
  }

  addTag(tag: Tag): void {
    const updated = this.tagsSubject.value.some((existing) => existing.id === tag.id)
      ? this.tagsSubject.value.map((existing) =>
          existing.id === tag.id ? tag : existing
        )
      : [...this.tagsSubject.value, tag];

    this.tagsSubject.next(updated);
    saveTags(updated);
  }

  deleteTag(tagId: string): void {
    const updatedTags = this.tagsSubject.value.filter(
      (tag) => tag.id !== tagId
    );
    this.tagsSubject.next(updatedTags);
    saveTags(updatedTags);

    const updatedProductTags: Record<string, string[]> = {};
    Object.entries(this.productTagsSubject.value).forEach(([productId, ids]) => {
      updatedProductTags[productId] = ids.filter((id) => id !== tagId);
    });
    this.productTagsSubject.next(updatedProductTags);
    saveProductTags(updatedProductTags);
  }

  toggleProductTag(productId: string, tagId: string): void {
    const current = this.productTagsSubject.value[productId] || [];
    const updated = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId];

    const next = { ...this.productTagsSubject.value, [productId]: updated };
    this.productTagsSubject.next(next);
    saveProductTags(next);
  }

  bulkAddTag(productIds: string[], tagId: string): void {
    if (!tagId || productIds.length === 0) return;
    const next = { ...this.productTagsSubject.value };
    productIds.forEach((productId) => {
      const current = next[productId] || [];
      if (!current.includes(tagId)) {
        next[productId] = [...current, tagId];
      }
    });
    this.productTagsSubject.next(next);
    saveProductTags(next);
  }

  bulkRemoveTag(productIds: string[], tagId: string): void {
    if (!tagId || productIds.length === 0) return;
    const next = { ...this.productTagsSubject.value };
    productIds.forEach((productId) => {
      const current = next[productId] || [];
      next[productId] = current.filter((id) => id !== tagId);
    });
    this.productTagsSubject.next(next);
    saveProductTags(next);
  }

  removeProducts(productIds: string[]): void {
    if (productIds.length === 0) return;
    const next = { ...this.productTagsSubject.value };
    productIds.forEach((productId) => {
      delete next[productId];
    });
    this.productTagsSubject.next(next);
    saveProductTags(next);
  }

  clearTagFromAllProducts(tagId: string): void {
    const next: Record<string, string[]> = {};
    Object.entries(this.productTagsSubject.value).forEach(([productId, ids]) => {
      next[productId] = ids.filter((id) => id !== tagId);
    });
    this.productTagsSubject.next(next);
    saveProductTags(next);
  }
}
