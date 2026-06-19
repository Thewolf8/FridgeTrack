const STORAGE_KEYS = {
  INVENTORY: 'fridgetrack-inventory',
  SHOPPING_LIST: 'fridgetrack-shopping-list',
  SETTINGS: 'fridgetrack-settings',
  DRAFT_ITEM: 'fridgetrack-draft-item',
};

const DEFAULT_SETTINGS = {
  theme: 'system', // 'light' | 'dark' | 'system'
  language: 'system',
  notifications: true,
  unusedReminders: true,
  dailyNotificationTime: '08:00',
  defaultExportFormat: 'pdf',
  animationsEnabled: true,
  dateFormat: 'DMY',
  datePickerType: 'full',
};

// Inventory
export function getInventory() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveInventory(inventory) {
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
}

// Shopping List
export function getShoppingList() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SHOPPING_LIST);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveShoppingList(list) {
  localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(list));
}

// Settings
export function getSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const parsed = data ? JSON.parse(data) : {};
    const merged = { ...DEFAULT_SETTINGS, ...parsed };
    // Migrate legacy darkMode boolean → theme string (one-time, transparent to the user)
    if (parsed.theme === undefined && parsed.darkMode !== undefined) {
      merged.theme = parsed.darkMode ? 'dark' : 'light';
    }
    delete merged.darkMode;
    return merged;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// Draft (auto-save)
export function getDraftItem() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DRAFT_ITEM);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveDraftItem(draft) {
  localStorage.setItem(STORAGE_KEYS.DRAFT_ITEM, JSON.stringify(draft));
}

export function clearDraftItem() {
  localStorage.removeItem(STORAGE_KEYS.DRAFT_ITEM);
}

// Reset all data
export function resetAllData() {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

// Generate unique ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Date helpers
export function daysSince(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  return diff;
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  return diff;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString();
}

// Stock status helpers
export function getStockStatus(item) {
  if (item.quantity <= 0) return 'out';
  if (item.quantity <= (item.minThreshold || 0)) return 'low';
  return 'ok';
}

export function isUnusedAlert(item) {
  if (!item.unusedReminder || !item.unusedReminderEnabled) return false;
  if (!item.purchaseDate || !item.unusedReminderDays) return false;
  const days = daysSince(item.purchaseDate);
  return days !== null && days >= item.unusedReminderDays && item.quantity > 0;
}

export function getExpiryStatus(item) {
  if (!item.expirationDate) return null;
  const days = daysUntil(item.expirationDate);
  if (days === null) return null;
  if (days < 0) return 'expired';
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'warning';
  return 'ok';
}

// Export full backup
export function exportFullBackup() {
  return {
    inventory: getInventory(),
    shoppingList: getShoppingList(),
    settings: getSettings(),
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };
}

// Import full backup
export function importFullBackup(data) {
  if (data.inventory && Array.isArray(data.inventory)) {
    saveInventory(data.inventory);
  }
  if (data.shoppingList && Array.isArray(data.shoppingList)) {
    saveShoppingList(data.shoppingList);
  }
  if (data.settings) {
    saveSettings({ ...getSettings(), ...data.settings });
  }
}
