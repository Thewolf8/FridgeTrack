import { useState, useCallback } from 'react';
import {
  getInventory,
  saveInventory,
  getShoppingList,
  saveShoppingList,
  generateId,
  getStockStatus,
} from '../utils/storage';

export function useStorage() {
  const [inventory, setInventoryState] = useState(() => getInventory());
  const [shoppingList, setShoppingListState] = useState(() => getShoppingList());

  const setInventory = useCallback((newInventory) => {
    setInventoryState(newInventory);
    saveInventory(newInventory);
  }, []);

  const setShoppingList = useCallback((newList) => {
    setShoppingListState(newList);
    saveShoppingList(newList);
  }, []);

  const addItem = useCallback((item) => {
    const newItem = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    setInventory(prev => {
      const updated = [...prev, newItem];
      saveInventory(updated);
      return updated;
    });
    return newItem;
  }, []);

  const updateItem = useCallback((id, updates) => {
    setInventory(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item);
      saveInventory(updated);
      return updated;
    });
  }, []);

  const deleteItem = useCallback((id) => {
    setInventory(prev => {
      const updated = prev.filter(item => item.id !== id);
      saveInventory(updated);
      return updated;
    });
    // Also remove from shopping list if present
    setShoppingList(prev => {
      const updated = prev.filter(item => item.itemId !== id);
      saveShoppingList(updated);
      return updated;
    });
  }, []);

  const adjustQuantity = useCallback((id, delta) => {
    setInventory(prev => {
      const updated = prev.map(item => {
        if (item.id !== id) return item;
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty, updatedAt: new Date().toISOString() };
      });
      saveInventory(updated);
      return updated;
    });

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
          const updated = [...prev, newEntry];
          saveShoppingList(updated);
          return updated;
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
      const updated = [...prev, newEntry];
      saveShoppingList(updated);
      return updated;
    });
  }, []);

  const removeFromShoppingList = useCallback((entryId) => {
    setShoppingList(prev => {
      const updated = prev.filter(item => item.id !== entryId);
      saveShoppingList(updated);
      return updated;
    });
  }, []);

  const markAsPurchased = useCallback((entryId, boughtQty) => {
    const list = getShoppingList();
    const entry = list.find(e => e.id === entryId);
    if (!entry) return;

    // Update inventory quantity
    if (entry.itemId) {
      const inv = getInventory();
      const item = inv.find(i => i.id === entry.itemId);
      if (item) {
        const newQty = (item.quantity || 0) + (boughtQty || entry.suggestedQty || 1);
        const updated = inv.map(i => i.id === entry.itemId ? { ...i, quantity: newQty, updatedAt: new Date().toISOString() } : i);
        saveInventory(updated);
        setInventoryState(updated);
      }
    }

    // Remove from shopping list
    setShoppingList(prev => {
      const updated = prev.filter(item => item.id !== entryId);
      saveShoppingList(updated);
      return updated;
    });
  }, []);

  const clearPurchased = useCallback(() => {
    setShoppingList(prev => {
      const updated = prev.filter(item => !item.purchased);
      saveShoppingList(updated);
      return updated;
    });
  }, []);

  const toggleShoppingItemPurchased = useCallback((entryId) => {
    setShoppingList(prev => {
      const updated = prev.map(item =>
        item.id === entryId ? { ...item, purchased: !item.purchased } : item
      );
      saveShoppingList(updated);
      return updated;
    });
  }, []);

  const updateShoppingItemQty = useCallback((entryId, newQty) => {
    setShoppingList(prev => {
      const updated = prev.map(item =>
        item.id === entryId ? { ...item, suggestedQty: newQty } : item
      );
      saveShoppingList(updated);
      return updated;
    });
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
