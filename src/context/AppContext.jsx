import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useStorage } from '../hooks/useStorage';
import { useNotifications } from '../hooks/useNotifications';
import { getSettings, saveSettings } from '../utils/storage';
import { setLanguage, getCurrentLanguage } from '../i18n';

const AppContext = createContext(null);

// Resolve 'light' | 'dark' | 'system' into an actual dark/light boolean
// and apply it to the DOM.
function applyTheme(theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', isDark);
}

// Apply animations — instant, no restart needed
function applyAnimations(enabled) {
  document.documentElement.classList.toggle('no-animations', !enabled);
}

export function AppProvider({ children }) {
  const storage = useStorage();
  const notifications = useNotifications();
  const [settings, setSettingsState] = useState(() => getSettings());
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');

  // Apply theme on initial load
  useEffect(() => {
    applyTheme(settings.theme ?? 'system');
    applyAnimations(settings.animationsEnabled !== false);
  }, []);

  // Live-update when OS theme changes, but only while 'system' is selected
  useEffect(() => {
    if (settings.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.theme]);

  // Apply language changes
  useEffect(() => {
    setLanguage(settings.language);
  }, [settings.language]);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const showConfirm = useCallback((title, message, onConfirm) => {
    setConfirmDialog({ title, message, onConfirm });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirmDialog(null);
  }, []);

  const updateSettings = useCallback((updates) => {
    const newSettings = { ...settings, ...updates };
    setSettingsState(newSettings);
    saveSettings(newSettings);

    // Apply language immediately
    if (updates.language !== undefined) {
      setLanguage(updates.language);
    }

    // Apply theme immediately — no restart needed
    if (updates.theme !== undefined) {
      applyTheme(updates.theme);
    }

    // Apply animations immediately — no restart needed
    if (updates.animationsEnabled !== undefined) {
      applyAnimations(updates.animationsEnabled);
    }
  }, [settings]);

  const navigateTo = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);

  const value = {
    ...storage,
    ...notifications,
    settings,
    updateSettings,
    currentPage,
    navigateTo,
    toast,
    showToast,
    confirmDialog,
    showConfirm,
    hideConfirm,
    searchQuery,
    setSearchQuery,
    selectedSection,
    setSelectedSection,
    language: getCurrentLanguage(),
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
