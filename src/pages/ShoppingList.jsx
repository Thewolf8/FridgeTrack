import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Share2,
  Trash2,
  Check,
  CheckSquare,
  Square,
  Plus,
  ShoppingCart,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import ShareExportSheet from '../components/ShareExportSheet';

function ShoppingListPage() {
  const {
    shoppingList,
    inventory,
    removeFromShoppingList,
    toggleShoppingItemPurchased,
    updateShoppingItemQty,
    markAsPurchased,
    clearPurchased,
    addToShoppingList,
    navigateTo,
    showToast,
  } = useApp();

  const [showShareSheet, setShowShareSheet] = useState(false);
  const [groupBy, setGroupBy] = useState('section'); // 'section' or 'category'
  const [freeTextItem, setFreeTextItem] = useState('');
  const [freeTextQty, setFreeTextQty] = useState(1);
  const [showFreeText, setShowFreeText] = useState(false);
  const [purchasingItem, setPurchasingItem] = useState(null);
  const [purchaseQty, setPurchaseQty] = useState(1);

  const activeItems = shoppingList.filter(i => !i.purchased);
  const purchasedItems = shoppingList.filter(i => i.purchased);

  const handleMarkPurchased = (entry) => {
    if (entry.itemId) {
      setPurchasingItem(entry);
      setPurchaseQty(entry.suggestedQty || 1);
    } else {
      removeFromShoppingList(entry.id);
      showToast(t('markedAsPurchased'), 'success');
    }
  };

  const confirmPurchase = () => {
    if (purchasingItem) {
      markAsPurchased(purchasingItem.id, purchaseQty);
      showToast(t('markedAsPurchased'), 'success');
      setPurchasingItem(null);
    }
  };

  const handleAddFreeText = () => {
    if (!freeTextItem.trim()) return;
    addToShoppingList(freeTextItem.trim(), 'fridge', 'otherCat', 'pieces');
    // Update the added item with quantity
    setFreeTextItem('');
    setFreeTextQty(1);
    setShowFreeText(false);
    showToast(t('addedToShoppingList'), 'success');
  };

  const handleSelectAll = () => {
    activeItems.forEach(item => toggleShoppingItemPurchased(item.id));
  };

  const groupedItems = useMemo(() => {
    if (groupBy === 'section') {
      const sections = ['fridge', 'freezer', 'pantry'];
      return sections.map(section => ({
        key: section,
        label: t(section),
        items: activeItems.filter(i => i.section === section),
      })).filter(g => g.items.length > 0);
    } else {
      const cats = [...new Set(activeItems.map(i => i.category))];
      return cats.map(cat => ({
        key: cat,
        label: t(cat) || cat,
        items: activeItems.filter(i => i.category === cat),
      }));
    }
  }, [activeItems, groupBy]);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('dashboard')}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{t('shoppingList')}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activeItems.length} {t('itemsOutOfStock').toLowerCase()}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowShareSheet(true)}
            className="p-2.5 rounded-xl bg-green-500 text-white shadow-lg shadow-green-500/20 active:scale-95 transition-transform"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Group toggle and actions */}
        {activeItems.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setGroupBy('section')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  groupBy === 'section'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {t('groupBySection')}
              </button>
              <button
                onClick={() => setGroupBy('category')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  groupBy === 'category'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {t('groupByCategory')}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                {t('selectAll')}
              </button>
              {purchasedItems.length > 0 && (
                <button
                  onClick={() => {
                    clearPurchased();
                    showToast('Cleared purchased items', 'success');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                >
                  {t('clearPurchased')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Free text item */}
        <div>
          {!showFreeText ? (
            <button
              onClick={() => setShowFreeText(true)}
              className="w-full flex items-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-green-500 hover:text-green-500 transition-colors"
            >
              <Plus size={18} />
              <span className="text-sm font-medium">{t('freeTextItem')}</span>
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3"
            >
              <input
                type="text"
                value={freeTextItem}
                onChange={(e) => setFreeTextItem(e.target.value)}
                placeholder={t('freeTextItem')}
                className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm border-0 focus:ring-2 focus:ring-green-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddFreeText}
                  className="flex-1 py-2 rounded-lg bg-green-500 text-white text-sm font-medium"
                >
                  {t('add')}
                </button>
                <button
                  onClick={() => { setShowFreeText(false); setFreeTextItem(''); }}
                  className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium"
                >
                  {t('cancel')}
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Items List */}
        <AnimatePresence mode="popLayout">
          {activeItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <ShoppingCart className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">{t('emptyShoppingList')}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('shoppingListHint')}</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {groupedItems.map(group => (
                <div key={group.key}>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
                    {group.label}
                  </h3>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {group.items.map(item => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ duration: 0.15 }}
                          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleShoppingItemPurchased(item.id)}
                              className="flex-shrink-0"
                            >
                              {item.purchased ? (
                                <CheckSquare className="text-green-500" size={22} />
                              ) : (
                                <Square className="text-gray-300 dark:text-gray-600" size={22} />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-gray-900 dark:text-white text-sm">
                                {item.name}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {t(item.section)}
                                </span>
                                {item.category && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {t(item.category)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <button
                                  onClick={() => updateShoppingItemQty(item.id, Math.max(1, (item.suggestedQty || 1) - 1))}
                                  className="px-2 py-1 text-gray-500 dark:text-gray-400"
                                >
                                  -
                                </button>
                                <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[24px] text-center">
                                  {item.suggestedQty || 1}
                                </span>
                                <button
                                  onClick={() => updateShoppingItemQty(item.id, (item.suggestedQty || 1) + 1)}
                                  className="px-2 py-1 text-gray-500 dark:text-gray-400"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {t(item.unit)}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                if (item.purchased) {
                                  toggleShoppingItemPurchased(item.id);
                                } else {
                                  handleMarkPurchased(item);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => {
                                removeFromShoppingList(item.id);
                                showToast(t('itemDeleted'), 'info');
                              }}
                              className="p-1.5 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-500"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}

              {/* Purchased items */}
              {purchasedItems.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-2 px-1">
                    {t('markedAsPurchased')}
                  </h3>
                  <div className="space-y-2 opacity-60">
                    {purchasedItems.map(item => (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 line-through"
                      >
                        <div className="flex items-center gap-3">
                          <CheckSquare className="text-green-500 flex-shrink-0" size={22} />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {item.name} — {item.suggestedQty || 1} {t(item.unit)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Purchase quantity dialog */}
      <AnimatePresence>
        {purchasingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPurchasingItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('howManyBought')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {purchasingItem.name}
              </p>
              <input
                type="number"
                min="1"
                value={purchaseQty}
                onChange={(e) => setPurchaseQty(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl font-bold mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setPurchasingItem(null)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={confirmPurchase}
                  className="flex-1 py-3 rounded-xl bg-green-500 text-white font-medium"
                >
                  {t('confirm')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Export Sheet */}
      <ShareExportSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        items={shoppingList}
      />
    </div>
  );
}

export default ShoppingListPage;
