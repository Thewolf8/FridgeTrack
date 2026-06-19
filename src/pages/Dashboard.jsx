import React from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  AlertCircle,
  AlertTriangle,
  Clock,
  ShoppingCart,
  Refrigerator,
  Snowflake,
  PlusCircle,
  Search,
  Bell,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import {
  getStockStatus,
  isUnusedAlert,
  getExpiryStatus,
  daysUntil,
} from '../utils/storage';

// Pantry icon workaround
const PantryIconComp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 20v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>
    <path d="M4 20h16"/>
    <path d="M8 10V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"/>
  </svg>
);

function Dashboard() {
  const { inventory, shoppingList, navigateTo, showToast, setSearchQuery } = useApp();

  const stats = {
    total: inventory.length,
    outOfStock: inventory.filter(i => getStockStatus(i) === 'out').length,
    lowStock: inventory.filter(i => getStockStatus(i) === 'low').length,
    unused: inventory.filter(i => isUnusedAlert(i)).length,
    expiring: inventory.filter(i => {
      const es = getExpiryStatus(i);
      return es === 'warning' || es === 'urgent';
    }).length,
    shoppingPending: shoppingList.filter(i => !i.purchased).length,
  };

  const sectionStats = {
    fridge: inventory.filter(i => i.section === 'fridge'),
    freezer: inventory.filter(i => i.section === 'freezer'),
    pantry: inventory.filter(i => i.section === 'pantry'),
  };

  const statCards = [
    {
      key: 'total',
      label: t('totalItems'),
      value: stats.total,
      icon: Package,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      onClick: () => navigateTo('fridge'),
    },
    {
      key: 'outOfStock',
      label: t('itemsOutOfStock'),
      value: stats.outOfStock,
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      onClick: () => navigateTo('fridge'),
    },
    {
      key: 'lowStock',
      label: t('itemsLowStock'),
      value: stats.lowStock,
      icon: AlertTriangle,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      onClick: () => navigateTo('fridge'),
    },
    {
      key: 'unused',
      label: t('unusedItems'),
      value: stats.unused,
      icon: Bell,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      onClick: () => navigateTo('fridge'),
    },
  ];

  const sectionCards = [
    {
      key: 'fridge',
      label: t('fridge'),
      icon: Refrigerator,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      items: sectionStats.fridge,
    },
    {
      key: 'freezer',
      label: t('freezer'),
      icon: Snowflake,
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      items: sectionStats.freezer,
    },
    {
      key: 'pantry',
      label: t('pantry'),
      icon: PantryIconComp,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      items: sectionStats.pantry,
    },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="px-4 pt-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-gray-900 dark:text-white"
        >
          {t('dashboard')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-gray-500 dark:text-gray-400 mt-1"
        >
          FridgeTrack
        </motion.p>
      </div>

      {/* Search */}
      <div className="px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={t('search')}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value) navigateTo('fridge');
            }}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
          />
        </motion.div>
      </div>

      {/* Stat Cards */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={card.onClick}
                className={`flex flex-col items-start p-4 rounded-2xl border ${card.border} ${card.bg} text-left active:scale-95 transition-transform`}
              >
                <div className={`${card.color} mb-2`}>
                  <Icon size={24} />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Section Cards */}
      <div className="px-4">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          {t('inventorySummary')}
        </h2>
        <div className="space-y-3">
          {sectionCards.map((section, i) => {
            const Icon = section.icon;
            const lowCount = section.items.filter(i => getStockStatus(i) === 'low').length;
            const outCount = section.items.filter(i => getStockStatus(i) === 'out').length;
            return (
              <motion.button
                key={section.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigateTo(section.key)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border ${section.border} ${section.bg} text-left active:scale-[0.98] transition-transform`}
              >
                <div className={`${section.color}`}>
                  <Icon size={28} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-gray-900 dark:text-white">{section.label}</span>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      {section.items.length} {t('all').toLowerCase()}
                    </span>
                    {lowCount > 0 && (
                      <span className="text-amber-500">{lowCount} {t('lowStock')}</span>
                    )}
                    {outCount > 0 && (
                      <span className="text-red-500">{outCount} {t('outOfStock')}</span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Shopping List Card */}
      <div className="px-4">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigateTo('shopping')}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border border-purple-500/20 bg-purple-500/10 text-left active:scale-[0.98] transition-transform"
        >
          <div className="text-purple-500">
            <ShoppingCart size={28} />
          </div>
          <div className="flex-1">
            <span className="font-semibold text-gray-900 dark:text-white">{t('shoppingList')}</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {stats.shoppingPending} {t('itemsOutOfStock').toLowerCase()}
            </p>
          </div>
          {stats.shoppingPending > 0 && (
            <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-purple-500 px-1.5 text-xs font-bold text-white">
              {stats.shoppingPending}
            </span>
          )}
        </motion.button>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-6">
        <div className="flex gap-3">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigateTo('add')}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-green-500 text-white font-medium shadow-lg shadow-green-500/20 active:scale-95 transition-transform"
          >
            <PlusCircle size={20} />
            {t('quickAdd')}
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigateTo('shopping')}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium active:scale-95 transition-transform"
          >
            <ShoppingCart size={20} />
            {t('viewShoppingList')}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
