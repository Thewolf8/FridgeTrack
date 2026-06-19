import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, FileDown, FileJson, Share2, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import {
  shareShoppingListAsText,
  downloadPDF,
  exportJSON,
  downloadFile,
  formatShoppingListAsText,
} from '../utils/fileOperations';
import { jsPDF } from 'jspdf';

function ShareExportSheet({ isOpen, onClose, items }) {
  const { showToast, inventory } = useApp();

  if (!isOpen) return null;

  const handleShareText = async () => {
    try {
      const text = formatShoppingListAsText(items, t);
      await shareShoppingListAsText(text);
      showToast(t('shareSuccess'), 'success');
    } catch (e) {
      showToast(t('error'), 'error');
    }
    onClose();
  };

  const buildShoppingListPDF = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleString();

    doc.setFontSize(20);
    doc.text('FridgeTrack - Shopping List', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${now}`, 14, 28);

    let y = 40;
    const sections = ['fridge', 'freezer', 'pantry'];

    sections.forEach(section => {
      const sectionItems = items.filter(i => i.section === section && !i.purchased);
      if (sectionItems.length > 0) {
        doc.setFontSize(14);
        doc.text(t(section).toUpperCase(), 14, y);
        y += 8;

        doc.setFontSize(10);
        sectionItems.forEach(item => {
          const line = `[ ] ${item.name} - ${item.suggestedQty || 1} ${t(item.unit) || ''}`;
          doc.text(line, 18, y);
          y += 6;
        });
        y += 4;
      }
    });

    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(10);
    doc.text('=====================================', 14, y);
    return doc;
  };

  const buildShoppingListJSON = () => ({
    shoppingList: items,
    exportedAt: new Date().toISOString(),
    version: '1.0',
  });

  const handleSharePDF = async () => {
    try {
      await downloadPDF(buildShoppingListPDF(), 'fridgetrack-shopping-list.pdf');
      showToast(t('exportInventory'), 'success');
    } catch (e) {
      showToast(t('error'), 'error');
    }
    onClose();
  };

  const handleDownloadPDFDirect = async () => {
    try {
      const base64 = buildShoppingListPDF().output('datauristring').split(',')[1];
      const path = await downloadFile(base64, 'fridgetrack-shopping-list.pdf', true);
      showToast(`${t('savedToDevice')}${path ? ': ' + path : ''}`, 'success');
    } catch (e) {
      showToast(t('downloadFailed'), 'error');
    }
    onClose();
  };

  const handleShareJSON = async () => {
    try {
      await exportJSON(buildShoppingListJSON(), 'fridgetrack-shopping-list.json');
      showToast(t('exportInventory'), 'success');
    } catch (e) {
      showToast(t('error'), 'error');
    }
    onClose();
  };

  const handleDownloadJSONDirect = async () => {
    try {
      const path = await downloadFile(JSON.stringify(buildShoppingListJSON(), null, 2), 'fridgetrack-shopping-list.json', false);
      showToast(`${t('savedToDevice')}${path ? ': ' + path : ''}`, 'success');
    } catch (e) {
      showToast(t('downloadFailed'), 'error');
    }
    onClose();
  };

  const options = [
    {
      key: 'text',
      label: t('shareAsText'),
      description: t('shareAsTextDesc'),
      icon: Share2,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      onClick: handleShareText,
    },
    {
      key: 'pdf',
      label: t('downloadPDF'),
      description: t('downloadPDFDesc'),
      icon: FileDown,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      onShare: handleSharePDF,
      onDownload: handleDownloadPDFDirect,
    },
    {
      key: 'json',
      label: t('exportJSON'),
      description: t('exportJSONDesc'),
      icon: FileJson,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      onShare: handleShareJSON,
      onDownload: handleDownloadJSONDirect,
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={t('shareExport')}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('shareExport')}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('close')}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors active:scale-95"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {options.map((option) => {
              const Icon = option.icon;

              // "Share as text" — single action, unchanged
              if (option.onClick) {
                return (
                  <button
                    type="button"
                    key={option.key}
                    onClick={option.onClick}
                    aria-label={`${option.label} — ${option.description}`}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-[0.98] transition-all text-start"
                  >
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${option.bg}`}>
                      <Icon className={option.color} size={24} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
                    </div>
                  </button>
                );
              }

              // PDF / JSON — two distinct actions: Share vs true Download
              return (
                <div
                  key={option.key}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${option.bg}`}>
                    <Icon className={option.color} size={24} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{option.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={option.onShare}
                    title={t('share')}
                    aria-label={`${t('share')} ${option.label}`}
                    className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 active:scale-95 transition-transform"
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={option.onDownload}
                    title={t('download')}
                    aria-label={`${t('download')} ${option.label}`}
                    className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-green-500 text-white active:scale-95 transition-transform"
                  >
                    <Download size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('cancel')}
            className="w-full mt-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-[0.98] transition-all"
          >
            {t('cancel')}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ShareExportSheet;
