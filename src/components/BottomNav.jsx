import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Refrigerator,
  PlusCircle,
  ShoppingCart,
  Settings,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';

function BottomNav() {
  const { currentPage, navigateTo, shoppingList } = useApp();
  const pendingCount = shoppingList.filter(i => !i.purchased).length;

  const tabs = [
    { key: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { key: 'items', label: t('allItems'), icon: Refrigerator },
    { key: 'add', label: t('addItem'), icon: PlusCircle, isFab: true },
    { key: 'shopping', label: t('shoppingList'), icon: ShoppingCart, badge: pendingCount },
    { key: 'settings', label: t('settings'), icon: Settings },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 safe-area-bottom"
      aria-label={t('mainNavigation')}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 pb-1">
        {tabs.map((tab) => {
          const isActive = currentPage === tab.key || (tab.key === 'items' && ['fridge', 'freezer', 'pantry'].includes(currentPage));
          const Icon = tab.icon;

          if (tab.isFab) {
            return (
              <button
                type="button"
                key={tab.key}
                onClick={() => navigateTo('add')}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                className="relative -mt-6 flex flex-col items-center active:scale-95 transition-transform"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/30 text-white"
                >
                  <PlusCircle size={28} aria-hidden="true" />
                </motion.div>
                <span className="text-[10px] mt-0.5 text-gray-500 dark:text-gray-400 font-medium">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              type="button"
              key={tab.key}
              onClick={() => navigateTo(tab.key === 'items' ? 'fridge' : tab.key)}
              aria-label={tab.badge > 0 ? `${tab.label} (${tab.badge})` : tab.label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-col items-center justify-center py-2 px-3 min-w-[60px] active:scale-95 transition-transform"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-green-500"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <div className="relative">
                <Icon
                  size={22}
                  aria-hidden="true"
                  className={isActive
                    ? 'text-green-500'
                    : 'text-gray-400 dark:text-gray-500'
                  }
                />
                {tab.badge > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 font-medium ${
                isActive
                  ? 'text-green-500'
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
