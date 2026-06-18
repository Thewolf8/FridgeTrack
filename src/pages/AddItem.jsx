import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t, getSections, getCategories, getUnits } from '../i18n';
import { generateId, getDraftItem, saveDraftItem, clearDraftItem } from '../utils/storage';

function AddItem({ editItem }) {
  const { addItem, updateItem, navigateTo, showToast, settings } = useApp();
  const isEditing = !!editItem;
  const isMonthYear = settings?.datePickerType === 'month-year';

  // Convert YYYY-MM-DD ↔ YYYY-MM for month-only picker
  const toInputVal = (dateStr) =>
    isMonthYear && dateStr ? dateStr.substring(0, 7) : (dateStr || '');
  const fromInputVal = (val) =>
    isMonthYear && val ? val + '-01' : val;

  const [form, setForm] = useState({
    name: '',
    section: 'fridge',
    category: 'otherCat',
    quantity: 1,
    unit: 'pieces',
    minThreshold: 0,
    purchaseDate: '',
    unusedReminder: false,
    unusedReminderEnabled: true,
    unusedReminderDays: 3,
    expirationDate: '',
    notes: '',
  });

  const sections = getSections();
  const categories = getCategories();
  const units = getUnits();

  // Load edit data or draft
  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || '',
        section: editItem.section || 'fridge',
        category: editItem.category || 'otherCat',
        quantity: editItem.quantity ?? 1,
        unit: editItem.unit || 'pieces',
        minThreshold: editItem.minThreshold || 0,
        purchaseDate: editItem.purchaseDate || '',
        unusedReminder: editItem.unusedReminder || false,
        unusedReminderEnabled: editItem.unusedReminderEnabled ?? true,
        unusedReminderDays: editItem.unusedReminderDays || 3,
        expirationDate: editItem.expirationDate || '',
        notes: editItem.notes || '',
      });
    } else {
      const draft = getDraftItem();
      if (draft) {
        setForm(prev => ({ ...prev, ...draft }));
      }
    }
  }, [editItem]);

  // Auto-save draft
  useEffect(() => {
    if (!isEditing && form.name) {
      const timeout = setTimeout(() => {
        saveDraftItem(form);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [form, isEditing]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      showToast(t('error'), 'error');
      return;
    }

    if (isEditing) {
      updateItem(editItem.id, { ...form, name: form.name.trim() });
      showToast(t('itemUpdated'), 'success');
    } else {
      addItem({ ...form, name: form.name.trim() });
      showToast(t('itemAdded'), 'success');
      clearDraftItem();
    }

    navigateTo('fridge');
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('fridge')}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {isEditing ? t('editItem') : t('addItem')}
          </h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-4 space-y-5"
      >
        {/* Item Name */}
        <div>
          <label className={labelClass}>{t('itemName')} *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={t('itemName')}
            className={inputClass}
          />
        </div>

        {/* Section */}
        <div>
          <label className={labelClass}>{t('section')}</label>
          <div className="grid grid-cols-3 gap-2">
            {sections.map(sec => (
              <button
                key={sec.key}
                onClick={() => handleChange('section', sec.key)}
                className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                  form.section === sec.key
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className={labelClass}>{t('category')}</label>
          <select
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className={inputClass}
          >
            {categories.map(cat => (
              <option key={cat.key} value={cat.key}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Quantity and Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>{t('quantity')}</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.quantity === 0 ? '' : form.quantity}
              placeholder="0"
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                handleChange('quantity', raw === '' ? 0 : parseInt(raw, 10));
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t('unit')}</label>
            <select
              value={form.unit}
              onChange={(e) => handleChange('unit', e.target.value)}
              className={inputClass}
            >
              {units.map(u => (
                <option key={u.key} value={u.key}>{u.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Min Threshold */}
        <div>
          <label className={labelClass}>{t('minimumThreshold')}</label>
          <input
            type="number"
            min="0"
            value={form.minThreshold}
            onChange={(e) => handleChange('minThreshold', parseInt(e.target.value) || 0)}
            className={inputClass}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Alert when quantity reaches this number
          </p>
        </div>

        {/* Purchase Date */}
        <div>
          <label className={labelClass}>{t('purchaseDate')} ({t('optional')})</label>
          <input
            type={isMonthYear ? 'month' : 'date'}
            value={toInputVal(form.purchaseDate)}
            onChange={(e) => handleChange('purchaseDate', fromInputVal(e.target.value))}
            className={inputClass}
          />
        </div>

        {/* Unused Reminder */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-medium text-gray-900 dark:text-white">{t('unusedReminder')}</label>
            <button
              onClick={() => handleChange('unusedReminder', !form.unusedReminder)}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                form.unusedReminder ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                form.unusedReminder ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <AnimatePresence>
            {form.unusedReminder && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-3"
              >
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">{t('reminderDays')}</label>
                  <input
                    type="number"
                    min="1"
                    value={form.unusedReminderDays}
                    onChange={(e) => handleChange('unusedReminderDays', parseInt(e.target.value) || 1)}
                    className={`${inputClass} mt-1`}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Expiration Date */}
        <div>
          <label className={labelClass}>{t('expirationDate')} ({t('optional')})</label>
          <input
            type={isMonthYear ? 'month' : 'date'}
            value={toInputVal(form.expirationDate)}
            onChange={(e) => handleChange('expirationDate', fromInputVal(e.target.value))}
            className={inputClass}
          />
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>{t('addNotes')}</label>
          <textarea
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder={t('addNotes')}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Submit Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={!form.name.trim()}
          className="w-full py-4 rounded-2xl bg-green-500 text-white font-semibold text-lg shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
        >
          <Save size={20} />
          {isEditing ? t('updateItem') : t('saveItem')}
        </motion.button>
      </motion.div>
    </div>
  );
}

export default AddItem;
