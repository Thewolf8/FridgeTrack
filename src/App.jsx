import React, { useEffect } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { setLanguage, getCurrentLanguage } from './i18n';
import BottomNav from './components/BottomNav';
import ToastNotification from './components/ToastNotification';
import ConfirmDialog from './components/ConfirmDialog';
import Dashboard from './pages/Dashboard';
import ItemList from './pages/ItemList';
import AddItem from './pages/AddItem';
import ShoppingListPage from './pages/ShoppingList';
import Settings from './pages/Settings';
import './App.css';

function AppContent() {
  const { currentPage, navigateTo, inventory, settings } = useApp();

  // Handle edit pages
  const isEditPage = currentPage.startsWith('edit-');
  const editItemId = isEditPage ? currentPage.replace('edit-', '') : null;
  const editItem = editItemId ? inventory.find(i => i.id === editItemId) : null;

  useEffect(() => {
    if (isEditPage && !editItem) {
      navigateTo('fridge');
    }
  }, [isEditPage, editItem, navigateTo]);

  // Sync document direction with language
  useEffect(() => {
    const lang = getCurrentLanguage();
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [settings.language]);

  const renderPage = () => {
    if (isEditPage && editItem) {
      return <AddItem editItem={editItem} />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'fridge':
      case 'freezer':
      case 'pantry':
        return <ItemList section={currentPage} />;
      case 'items':
        return <ItemList section="all" />;
      case 'add':
        return <AddItem />;
      case 'shopping':
        return <ShoppingListPage />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <MotionConfig reducedMotion={settings.animationsEnabled !== false ? 'never' : 'always'}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
        <main className="max-w-lg mx-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>

        <BottomNav />
        <ToastNotification />
        <ConfirmDialog />
      </div>
    </MotionConfig>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
