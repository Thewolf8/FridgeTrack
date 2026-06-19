import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useStorage } from '../hooks/useStorage';
import { useNotifications } from '../hooks/useNotifications';
import { getSettings, saveSettings } from '../utils/storage';
import { setLanguage, getCurrentLanguage } from '../i18n';

const AppContext = createContext(null);

// Resolve 'light' | 'dark' | 'system' into an actual dark/light boolean
// and apply it to the DOM, along with the AMOLED variant when relevant.
function applyTheme(theme, darkVariant) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.classList.toggle('amoled', isDark && darkVariant === 'amoled');
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
  const backStackRef = useRef([]);

  // Apply theme on initial load
  useEffect(() => {
    applyTheme(settings.theme ?? 'system', settings.darkVariant ?? 'blue');
    applyAnimations(settings.animationsEnabled !== false);
  }, []);

  // Live-update when OS theme changes, but only while 'system' is selected
  useEffect(() => {
    if (settings.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system', settings.darkVariant ?? 'blue');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.theme, settings.darkVariant]);

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
    if (updates.theme !== undefined || updates.darkVariant !== undefined) {
      applyTheme(newSettings.theme ?? 'system', newSettings.darkVariant ?? 'blue');
    }

    // Apply animations immediately — no restart needed
    if (updates.animationsEnabled !== undefined) {
      applyAnimations(updates.animationsEnabled);
    }
  }, [settings]);

  // navigateTo pushes the page you're LEAVING onto a back-stack, so the
  // hardware Android back button (and the in-app back arrows) can return
  // to exactly where the user came from instead of exiting the app.
  const navigateTo = useCallback((page) => {
    setCurrentPage((prevPage) => {
      if (page !== prevPage) {
        backStackRef.current.push(prevPage);
      }
      return page;
    });
    window.scrollTo(0, 0);
  }, []);

  // Returns true if it handled the navigation, false if the stack was
  // empty (caller — typically the hardware back button — should exit).
  const goBack = useCallback(() => {
    if (backStackRef.current.length === 0) return false;
    const prevPage = backStackRef.current.pop();
    setCurrentPage(prevPage);
    window.scrollTo(0, 0);
    return true;
  }, []);

  // Hardware Android back button. By default Capacitor exits the app
  // immediately because this is a single-page app with no real browser
  // history — registering this listener gives us full control: close any
  // open confirm dialog first, otherwise pop our own page stack, and only
  // exit the app once there's truly nowhere left to go back to.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = CapacitorApp.addListener('backButton', () => {
      if (confirmDialog) {
        hideConfirm();
        return;
      }
      const handled = goBack();
      if (!handled) {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, [confirmDialog, goBack, hideConfirm]);

  const value = {
    ...storage,
    ...notifications,
    settings,
    updateSettings,
    currentPage,
    navigateTo,
    goBack,
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
