import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
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
  const [detailCard, setDetailCard] = useState(null); // { label, color, bg, items } | null

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
      getItems: () => inventory,
    },
    {
      key: 'outOfStock',
      label: t('itemsOutOfStock'),
      value: stats.outOfStock,
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      getItems: () => inventory.filter(i => getStockStatus(i) === 'out'),
    },
    {
      key: 'lowStock',
      label: t('itemsLowStock'),
      value: stats.lowStock,
      icon: AlertTriangle,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      getItems: () => inventory.filter(i => getStockStatus(i) === 'low'),
    },
    {
      key: 'unused',
      label: t('unusedItems'),
      value: stats.unused,
      icon: Bell,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      getItems: () => inventory.filter(i => isUnusedAlert(i)),
    },
  ];

  const openCardDetail = (card) => {
    setDetailCard({
      key: card.key,
      label: card.label,
      icon: card.icon,
      color: card.color,
      bg: card.bg,
      items: card.getItems(),
    });
  };

  const handleEditFromModal = (item) => {
    setDetailCard(null);
    navigateTo(`edit-${item.id}`);
  };

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
    <>
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
                onClick={() => openCardDetail(card)}
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

    {/* Card Detail Modal — shows the actual items behind a stat card
        instead of forcing a navigation to a whole other page */}
    <AnimatePresence>
      {detailCard && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setDetailCard(null)}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md max-h-[80vh] flex flex-col bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-gray-700">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${detailCard.bg}`}>
                <detailCard.icon className={detailCard.color} size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white">{detailCard.label}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{detailCard.items.length} {t('all').toLowerCase()}</p>
              </div>
              <button
                onClick={() => setDetailCard(null)}
                aria-label={t('close')}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="overflow-y-auto px-4 py-3 space-y-2">
              {detailCard.items.length > 0 ? (
                detailCard.items.map((item) => {
                  const status = getStockStatus(item);
                  const statusColor =
                    status === 'out' ? 'text-red-500' :
                    status === 'low' ? 'text-amber-500' : 'text-green-500';
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleEditFromModal(item)}
                      className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-[0.98] transition-all text-left"
                    >
                      <span className="font-medium text-gray-900 dark:text-white truncate">{item.name}</span>
                      <span className={`text-xs font-medium shrink-0 ${statusColor}`}>
                        {item.quantity} {t(item.unit) || ''}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                  {t('noItemsFound')}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setDetailCard(null)}
                className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

export default Dashboard;
