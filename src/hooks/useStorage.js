import { useState, useCallback } from 'react';
import {
  getInventory,
  saveInventory,
  getShoppingList,
  saveShoppingList,
  generateId,
  getStockStatus,
} from '../utils/storage';

// ⚠️ FIX: setInventory/setShoppingList now correctly support BOTH a plain
// array and a functional updater (prev => next). Previously, passing an
// updater function caused saveInventory(fn) to serialize the function
// itself (JSON.stringify(fn) === undefined), silently corrupting
// localStorage on every add/update/delete/adjustQuantity call. Data looked
// fine in-session but vanished after closing and reopening the app.

export function useStorage() {
  const [inventory, setInventoryState] = useState(() => getInventory());
  const [shoppingList, setShoppingListState] = useState(() => getShoppingList());

  const setInventory = useCallback((updaterOrArray) => {
    setInventoryState(prev => {
      const next = typeof updaterOrArray === 'function' ? updaterOrArray(prev) : updaterOrArray;
      saveInventory(next);
      return next;
    });
  }, []);

  const setShoppingList = useCallback((updaterOrArray) => {
    setShoppingListState(prev => {
      const next = typeof updaterOrArray === 'function' ? updaterOrArray(prev) : updaterOrArray;
      saveShoppingList(next);
      return next;
    });
  }, []);

  const addItem = useCallback((item) => {
    const newItem = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    setInventory(prev => [...prev, newItem]);
    return newItem;
  }, []);

  const updateItem = useCallback((id, updates) => {
    setInventory(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
    ));
  }, []);

  const deleteItem = useCallback((id) => {
    setInventory(prev => prev.filter(item => item.id !== id));
    setShoppingList(prev => prev.filter(item => item.itemId !== id));
  }, []);

  const adjustQuantity = useCallback((id, delta) => {
    setInventory(prev => prev.map(item => {
      if (item.id !== id) return item;
      const newQty = Math.max(0, item.quantity + delta);
      return { ...item, quantity: newQty, updatedAt: new Date().toISOString() };
    }));

    // Auto-add to shopping list if low/out of stock
    setTimeout(() => {
      const currentInventory = getInventory();
      const item = currentInventory.find(i => i.id === id);
      if (!item) return;
      const status = getStockStatus(item);
      if (status === 'out' || status === 'low') {
        setShoppingList(prev => {
          const exists = prev.find(s => s.itemId === id);
          if (exists) return prev;
          const newEntry = {
            id: generateId(),
            itemId: item.id,
            name: item.name,
            section: item.section,
            category: item.category,
            suggestedQty: (item.minThreshold || 0) + 1,
            unit: item.unit,
            purchased: false,
            createdAt: new Date().toISOString(),
          };
          return [...prev, newEntry];
        });
      }
    }, 0);
  }, []);

  const addToShoppingList = useCallback((itemOrName, section, category, unit) => {
    setShoppingList(prev => {
      const isItem = typeof itemOrName === 'object';
      const itemName = isItem ? itemOrName.name : itemOrName;
      const itemId = isItem ? itemOrName.id : null;
      const exists = prev.find(s => s.name.toLowerCase() === itemName.toLowerCase());
      if (exists) return prev;
      const newEntry = {
        id: generateId(),
        itemId,
        name: itemName,
        section: isItem ? itemOrName.section : (section || 'fridge'),
        category: isItem ? itemOrName.category : (category || 'otherCat'),
        suggestedQty: isItem ? (itemOrName.minThreshold || 0) + 1 : 1,
        unit: isItem ? itemOrName.unit : (unit || 'pieces'),
        purchased: false,
        createdAt: new Date().toISOString(),
      };
      return [...prev, newEntry];
    });
  }, []);

  const removeFromShoppingList = useCallback((entryId) => {
    setShoppingList(prev => prev.filter(item => item.id !== entryId));
  }, []);

  const markAsPurchased = useCallback((entryId, boughtQty) => {
    const list = getShoppingList();
    const entry = list.find(e => e.id === entryId);
    if (!entry) return;

    if (entry.itemId) {
      setInventory(prev => prev.map(i =>
        i.id === entry.itemId
          ? { ...i, quantity: (i.quantity || 0) + (boughtQty || entry.suggestedQty || 1), updatedAt: new Date().toISOString() }
          : i
      ));
    }

    setShoppingList(prev => prev.filter(item => item.id !== entryId));
  }, []);

  const clearPurchased = useCallback(() => {
    setShoppingList(prev => prev.filter(item => !item.purchased));
  }, []);

  const toggleShoppingItemPurchased = useCallback((entryId) => {
    setShoppingList(prev => prev.map(item =>
      item.id === entryId ? { ...item, purchased: !item.purchased } : item
    ));
  }, []);

  const updateShoppingItemQty = useCallback((entryId, newQty) => {
    setShoppingList(prev => prev.map(item =>
      item.id === entryId ? { ...item, suggestedQty: newQty } : item
    ));
  }, []);

  const resetData = useCallback(() => {
    localStorage.clear();
    setInventoryState([]);
    setShoppingListState([]);
  }, []);

  return {
    inventory,
    shoppingList,
    setInventory,
    setShoppingList,
    addItem,
    updateItem,
    deleteItem,
    adjustQuantity,
    addToShoppingList,
    removeFromShoppingList,
    markAsPurchased,
    clearPurchased,
    toggleShoppingItemPurchased,
    updateShoppingItemQty,
    resetData,
  };
}
