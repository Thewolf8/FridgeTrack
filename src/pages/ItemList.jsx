import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t, getSections, getCategories } from '../i18n';
import {
  getStockStatus,
  isUnusedAlert,
  getExpiryStatus,
} from '../utils/storage';
import SectionTabs from '../components/SectionTabs';
import ItemRow from '../components/ItemRow';

function ItemList({ section: propSection }) {
  const { inventory, navigateTo, searchQuery, setSearchQuery } = useApp();
  const [activeSection, setActiveSection] = useState(propSection || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const sections = getSections();
  const categories = getCategories();

  const sectionCounts = useMemo(() => ({
    fridge: inventory.filter(i => i.section === 'fridge').length,
    freezer: inventory.filter(i => i.section === 'freezer').length,
    pantry: inventory.filter(i => i.section === 'pantry').length,
    all: inventory.length,
  }), [inventory]);

  const filteredItems = useMemo(() => {
    let items = [...inventory];

    // Section filter
    if (activeSection !== 'all') {
      items = items.filter(i => i.section === activeSection);
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.category && i.category.toLowerCase().includes(q)) ||
        (i.notes && i.notes.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      items = items.filter(i => getStockStatus(i) === filterStatus);
    }

    // Category filter
    if (filterCategory !== 'all') {
      items = items.filter(i => i.category === filterCategory);
    }

    // Sorting
    switch (sortBy) {
      case 'name':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'qty':
        items.sort((a, b) => a.quantity - b.quantity);
        break;
      case 'oldest':
        items.sort((a, b) => new Date(a.purchaseDate || 0) - new Date(b.purchaseDate || 0));
        break;
      case 'expiry':
        items.sort((a, b) => {
          if (!a.expirationDate) return 1;
          if (!b.expirationDate) return -1;
          return new Date(a.expirationDate) - new Date(b.expirationDate);
        });
        break;
      case 'added':
        items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case 'status':
        const statusOrder = { out: 0, low: 1, ok: 2 };
        items.sort((a, b) => statusOrder[getStockStatus(a)] - statusOrder[getStockStatus(b)]);
        break;
      default:
        break;
    }

    return items;
  }, [inventory, activeSection, searchQuery, filterStatus, filterCategory, sortBy]);

  const emptyMessages = {
    fridge: t('emptyFridge'),
    freezer: t('emptyFreezer'),
    pantry: t('emptyPantry'),
    all: t('emptyAll'),
  };

  const handleEdit = useCallback((item) => {
    navigateTo(`edit-${item.id}`);
  }, [navigateTo]);

  return (
    <div className="pb-24">
      <SectionTabs
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        counts={sectionCounts}
      />

      {/* Search and Filters */}
      <div className="px-4 py-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchByName')}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              showFilters
                ? 'bg-green-500 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <SlidersHorizontal size={16} />
            {t('filterBy')}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium"
          >
            <ArrowUpDown size={16} />
            {t('sortBy')}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                {/* Status filter */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                    {t('status')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'ok', 'low', 'out'].map(status => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          filterStatus === status
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {t(status === 'ok' ? 'inStock' : status === 'low' ? 'lowStock' : status === 'out' ? 'outOfStock' : 'all')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category filter */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                    {t('category')}
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm border-0 focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">{t('all')}</option>
                    {categories.map(cat => (
                      <option key={cat.key} value={cat.key}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                    {t('sortBy')}
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm border-0 focus:ring-2 focus:ring-green-500"
                  >
                    <option value="name">{t('nameAsc')}</option>
                    <option value="qty">{t('qtyLow')}</option>
                    <option value="oldest">{t('oldest')}</option>
                    <option value="expiry">{t('expirySoon')}</option>
                    <option value="added">{t('dateAdded')}</option>
                    <option value="status">{t('status')}</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Items List */}
      <div className="px-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <ItemRow
                key={item.id}
                item={item}
                index={index}
                onEdit={handleEdit}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Search className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {searchQuery ? t('noItemsFound') : emptyMessages[activeSection]}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => navigateTo('add')}
                  className="mt-3 text-sm text-green-500 font-medium"
                >
                  {t('addFirstItem')}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ItemList;
