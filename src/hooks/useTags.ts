import { useState, useEffect } from 'react';
import { Tag } from '@/types/tag';

const TAGS_STORAGE_KEY = 'product-tags';
const PRODUCT_TAGS_STORAGE_KEY = 'product-tag-assignments';

function loadTags(): Tag[] {
  try {
    const stored = localStorage.getItem(TAGS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTags(tags: Tag[]) {
  localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags));
}

function loadProductTags(): Record<string, string[]> {
  try {
    const stored = localStorage.getItem(PRODUCT_TAGS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveProductTags(productTags: Record<string, string[]>) {
  localStorage.setItem(PRODUCT_TAGS_STORAGE_KEY, JSON.stringify(productTags));
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>(loadTags);
  const [productTags, setProductTags] = useState<Record<string, string[]>>(loadProductTags);

  useEffect(() => {
    saveTags(tags);
  }, [tags]);

  useEffect(() => {
    saveProductTags(productTags);
  }, [productTags]);

  const addTag = (tag: Tag) => {
    setTags((prev) => {
      const existing = prev.find((t) => t.id === tag.id);
      if (existing) {
        return prev.map((t) => (t.id === tag.id ? tag : t));
      }
      return [...prev, tag];
    });
  };

  const deleteTag = (tagId: string) => {
    setTags((prev) => prev.filter((t) => t.id !== tagId));
    // Remove tag from all products
    setProductTags((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((productId) => {
        updated[productId] = updated[productId].filter((id) => id !== tagId);
      });
      return updated;
    });
  };

  const assignTagToProduct = (productId: string, tagId: string) => {
    setProductTags((prev) => {
      const current = prev[productId] || [];
      if (current.includes(tagId)) return prev;
      return { ...prev, [productId]: [...current, tagId] };
    });
  };

  const removeTagFromProduct = (productId: string, tagId: string) => {
    setProductTags((prev) => {
      const current = prev[productId] || [];
      return { ...prev, [productId]: current.filter((id) => id !== tagId) };
    });
  };

  const getProductTags = (productId: string): Tag[] => {
    const tagIds = productTags[productId] || [];
    return tags.filter((t) => tagIds.includes(t.id));
  };

  const toggleProductTag = (productId: string, tagId: string) => {
    const current = productTags[productId] || [];
    if (current.includes(tagId)) {
      removeTagFromProduct(productId, tagId);
    } else {
      assignTagToProduct(productId, tagId);
    }
  };

  const bulkAddTag = (productIds: string[], tagId: string) => {
    setProductTags((prev) => {
      const updated = { ...prev };
      productIds.forEach((productId) => {
        const current = updated[productId] || [];
        if (!current.includes(tagId)) {
          updated[productId] = [...current, tagId];
        }
      });
      return updated;
    });
  };

  const bulkRemoveTag = (productIds: string[], tagId: string) => {
    setProductTags((prev) => {
      const updated = { ...prev };
      productIds.forEach((productId) => {
        const current = updated[productId] || [];
        updated[productId] = current.filter((id) => id !== tagId);
      });
      return updated;
    });
  };

  return {
    tags,
    productTags,
    addTag,
    deleteTag,
    assignTagToProduct,
    removeTagFromProduct,
    getProductTags,
    toggleProductTag,
    bulkAddTag,
    bulkRemoveTag,
  };
}
