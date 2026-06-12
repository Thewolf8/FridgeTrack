import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Minus,
  Edit2,
  Trash2,
  Bell,
  BellOff,
  ShoppingCart,
  Clock,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t, isRTL } from '../i18n';
import {
  getStockStatus,
  isUnusedAlert,
  getExpiryStatus,
  daysSince,
  daysUntil,
} from '../utils/storage';

function ItemRow({ item, onEdit, index }) {
  const { adjustQuantity, updateItem, deleteItem, addToShoppingList, showToast, showConfirm } = useApp();
  const [swiped, setSwiped] = useState(false);

  const status = getStockStatus(item);
  const unused = isUnusedAlert(item);
  const expiry = getExpiryStatus(item);
  const rtl = isRTL();

  const statusColors = {
    ok: 'border-l-green-500 bg-green-500/5 dark:bg-green-500/10',
    low: 'border-l-amber-500 bg-amber-500/5 dark:bg-amber-500/10',
    out: 'border-l-red-500 bg-red-500/5 dark:bg-red-500/10',
  };

  const statusBadge = {
    ok: { text: t('inStock'), class: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' },
    low: { text: t('lowStock'), class: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
    out: { text: t('outOfStock'), class: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
  };

  const handleMinus = () => {
    if (item.quantity > 0) {
      adjustQuantity(item.id, -1);
      const newQty = item.quantity - 1;
      if (newQty === 0) {
        showToast(`${item.name} ${t('outOfStock')}`, 'warning');
      } else if (newQty <= (item.minThreshold || 0)) {
        showToast(`${item.name} ${t('lowStock')}`, 'warning');
      }
    }
  };

  const handlePlus = () => {
    adjustQuantity(item.id, 1);
  };

  const handleToggleReminder = () => {
    updateItem(item.id, {
      unusedReminderEnabled: !item.unusedReminderEnabled,
    });
    showToast(
      !item.unusedReminderEnabled ? t('reminderEnabled') : t('reminderMuted'),
      'info'
    );
  };

  const handleDelete = () => {
    showConfirm(t('confirmDelete'), t('deleteWarning'), () => {
      deleteItem(item.id);
      showToast(t('itemDeleted'), 'success');
    });
  };

  const handleSwipeStart = (e) => {
    setSwiped(false);
  };

  const handleSwipeEnd = (e, info) => {
    if (Math.abs(info.offset.x) > 80) {
      setSwiped(true);
    } else {
      setSwiped(false);
    }
  };

  const sectionColors = {
    fridge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    freezer: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400',
    pantry: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
  };

  const purchasedDays = daysSince(item.purchaseDate);
  const expiryDays = daysUntil(item.expirationDate);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      drag="x"
      dragConstraints={{ left: -120, right: 0 }}
      dragElastic={0.1}
      onDragStart={handleSwipeStart}
      onDragEnd={handleSwipeEnd}
      className={`relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 border-l-4 ${statusColors[status]} transition-all`}
    >
      {/* Swipe actions */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-1 px-2">
        <button
          onClick={handleToggleReminder}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg active:scale-95 transition-transform"
        >
          {item.unusedReminderEnabled ? <Bell size={20} /> : <BellOff size={20} />}
        </button>
        <button
          onClick={handleDelete}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white shadow-lg active:scale-95 transition-transform"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="relative z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rtl:pr-4 rtl:pl-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Header line */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                {item.name}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[status].class}`}>
                {statusBadge[status].text}
              </span>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span className={`px-1.5 py-0.5 rounded-md font-medium ${sectionColors[item.section] || ''}`}>
                {t(item.section)}
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700">
                {t(item.category) || item.category}
              </span>
            </div>

            {/* Dates */}
            <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              {purchasedDays !== null && (
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {t('boughtDaysAgo', { n: purchasedDays })}
                </span>
              )}
              {expiryDays !== null && (
                <span className={`flex items-center gap-1 ${expiryDays < 0 ? 'text-red-500' : expiryDays <= 3 ? 'text-amber-500' : expiryDays <= 7 ? 'text-purple-500' : ''}`}>
                  {expiryDays < 0 ? <AlertCircle size={12} /> : <AlertTriangle size={12} />}
                  {expiryDays < 0 ? t('expiredDaysAgo', { n: Math.abs(expiryDays) }) :
                    expiryDays === 0 ? t('expiresToday') :
                    t('daysUntilExpiry', { n: expiryDays })}
                </span>
              )}
              {unused && (
                <span className="flex items-center gap-1 text-orange-500">
                  <Bell size={12} />
                  {t('notUsedInDays', { n: purchasedDays })}
                </span>
              )}
            </div>
          </div>

          {/* Quantity controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleMinus}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <Minus size={18} />
            </button>
            <div className={`min-w-[48px] text-center font-bold text-lg ${
              status === 'out' ? 'text-red-500' :
              status === 'low' ? 'text-amber-500' :
              'text-green-600 dark:text-green-400'
            }`}>
              {item.quantity}
            </div>
            <button
              onClick={handlePlus}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => onEdit(item)}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
          >
            <Edit2 size={14} />
            {t('edit')}
          </button>
          <button
            onClick={() => {
              addToShoppingList(item);
              showToast(t('addedToShoppingList'), 'info');
            }}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 active:bg-green-200 dark:active:bg-green-500/30 transition-colors"
          >
            <ShoppingCart size={14} />
            {t('addToShoppingList')}
          </button>
          <button
            onClick={handleToggleReminder}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors ${
              item.unusedReminderEnabled
                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            }`}
          >
            {item.unusedReminderEnabled ? <Bell size={14} /> : <BellOff size={14} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default ItemRow;
