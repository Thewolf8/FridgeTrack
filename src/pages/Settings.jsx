import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Moon,
  Sun,
  Globe,
  Bell,
  Download,
  Upload,
  Trash2,
  Shield,
  FileText,
  FileJson,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t, setLanguage } from '../i18n';
import {
  exportFullBackup,
  importFullBackup,
  exportJSON,
  exportInventoryTXT,
  pickJSONFile,
} from '../utils/fileOperations';
import { jsPDF } from 'jspdf';
import { getInventory, getShoppingList, getSettings } from '../utils/storage';

function Settings() {
  const {
    settings,
    updateSettings,
    navigateTo,
    showToast,
    showConfirm,
    resetData,
  } = useApp();

  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleExportInventory = async (format) => {
    try {
      const inventory = getInventory();
      const shoppingList = getShoppingList();
      const now = new Date().toLocaleString();

      if (format === 'pdf') {
        const doc = new jsPDF();
        let y = 20;

        doc.setFontSize(22);
        doc.text('FridgeTrack Inventory', 14, y);
        y += 10;
        doc.setFontSize(10);
        doc.text(`Exported: ${now}`, 14, y);
        y += 15;

        // Summary
        doc.setFontSize(14);
        doc.text('Summary', 14, y);
        y += 8;
        doc.setFontSize(10);
        doc.text(`Total Items: ${inventory.length}`, 14, y);
        y += 6;
        doc.text(`Low Stock: ${inventory.filter(i => i.quantity > 0 && i.quantity <= (i.minThreshold || 0)).length}`, 14, y);
        y += 6;
        doc.text(`Out of Stock: ${inventory.filter(i => i.quantity <= 0).length}`, 14, y);
        y += 12;

        // Sections
        const sections = ['fridge', 'freezer', 'pantry'];
        sections.forEach(section => {
          if (y > 250) { doc.addPage(); y = 20; }
          const items = inventory.filter(i => i.section === section);
          if (items.length > 0) {
            doc.setFontSize(14);
            doc.text(t(section).toUpperCase(), 14, y);
            y += 8;
            doc.setFontSize(10);
            items.forEach(item => {
              const status = item.quantity <= 0 ? 'OUT' : item.quantity <= (item.minThreshold || 0) ? 'LOW' : 'OK';
              const line = `${item.name} | Qty: ${item.quantity} ${t(item.unit)} | Status: ${status}`;
              doc.text(line, 14, y);
              y += 6;
            });
            y += 6;
          }
        });

        // Shopping list
        if (shoppingList.length > 0) {
          if (y > 250) { doc.addPage(); y = 20; }
          doc.setFontSize(14);
          doc.text('Shopping List', 14, y);
          y += 8;
          doc.setFontSize(10);
          shoppingList.forEach(item => {
            const line = `[${item.purchased ? 'x' : ' '}] ${item.name} - ${item.suggestedQty || 1} ${t(item.unit)}`;
            doc.text(line, 14, y);
            y += 6;
          });
          y += 12;
        }

        // AI Analysis prompt
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.text('AI Analysis Prompt', 14, y);
        y += 8;
        doc.setFontSize(9);
        const aiText = t('aiPromptText');
        const splitText = doc.splitTextToSize(aiText, 180);
        doc.text(splitText, 14, y);

        const { exportInventoryPDF } = await import('../utils/fileOperations');
        await exportInventoryPDF(doc, 'fridgetrack-inventory.pdf');
      } else if (format === 'txt') {
        let content = `===== FridgeTrack Inventory =====\n`;
        content += `Exported: ${now}\n\n`;
        content += `Summary:\n`;
        content += `Total Items: ${inventory.length}\n`;
        content += `Low Stock: ${inventory.filter(i => i.quantity > 0 && i.quantity <= (i.minThreshold || 0)).length}\n`;
        content += `Out of Stock: ${inventory.filter(i => i.quantity <= 0).length}\n\n`;

        sections.forEach(section => {
          const items = inventory.filter(i => i.section === section);
          if (items.length > 0) {
            content += `${t(section).toUpperCase()}:\n`;
            items.forEach(item => {
              const status = item.quantity <= 0 ? 'OUT' : item.quantity <= (item.minThreshold || 0) ? 'LOW' : 'OK';
              content += `- ${item.name} | Qty: ${item.quantity} ${t(item.unit)} | Status: ${status}\n`;
            });
            content += '\n';
          }
        });

        if (shoppingList.length > 0) {
          content += `Shopping List:\n`;
          shoppingList.forEach(item => {
            content += `- [${item.purchased ? 'x' : ' '}] ${item.name} - ${item.suggestedQty || 1} ${t(item.unit)}\n`;
          });
          content += '\n';
        }

        content += `\n${t('aiPromptText')}\n`;
        content += `=====================================\n`;

        await exportInventoryTXT(content, 'fridgetrack-inventory.txt');
      } else {
        await exportJSON(exportFullBackup(), 'fridgetrack-backup.json');
      }
      showToast(t('exportInventory'), 'success');
    } catch (e) {
      showToast(t('error'), 'error');
    }
  };

  const handleImportInventory = async () => {
    try {
      const data = await pickJSONFile();
      if (data.inventory && Array.isArray(data.inventory)) {
        importFullBackup(data);
        showToast(`${data.inventory.length} items imported`, 'success');
        window.location.reload();
      } else if (Array.isArray(data)) {
        // Direct inventory array
        const current = getInventory();
        const merged = [...current];
        let count = 0;
        data.forEach(item => {
          if (item.id && item.name && !merged.find(i => i.id === item.id)) {
            merged.push(item);
            count++;
          }
        });
        // Save via app context would be better but this works
        localStorage.setItem('fridgetrack-inventory', JSON.stringify(merged));
        showToast(`${count} items imported to inventory`, 'success');
        window.location.reload();
      } else {
        showToast('Invalid file format', 'error');
      }
    } catch (e) {
      showToast(e.message || 'Import failed', 'error');
    }
  };

  const handleImportShoppingList = async () => {
    try {
      const data = await pickJSONFile();
      let items = [];
      if (data.shoppingList && Array.isArray(data.shoppingList)) {
        items = data.shoppingList;
      } else if (Array.isArray(data)) {
        items = data;
      }
      if (items.length > 0) {
        const current = JSON.parse(localStorage.getItem('fridgetrack-shopping-list') || '[]');
        const merged = [...current];
        let count = 0;
        items.forEach(item => {
          if (item.name && !merged.find(i => i.name === item.name)) {
            merged.push({ ...item, id: Date.now() + Math.random().toString(36) });
            count++;
          }
        });
        localStorage.setItem('fridgetrack-shopping-list', JSON.stringify(merged));
        showToast(`${count} items added to shopping list`, 'success');
        window.location.reload();
      }
    } catch (e) {
      showToast(e.message || 'Import failed', 'error');
    }
  };

  const handleResetData = () => {
    showConfirm(t('confirmReset'), t('resetWarning'), () => {
      resetData();
      showToast('All data cleared', 'success');
      window.location.reload();
    });
  };

  const languages = [
    { key: 'system', label: t('systemDefault') },
    { key: 'en', label: 'English' },
    { key: 'ar', label: 'العربية' },
    { key: 'fr', label: 'Français' },
  ];

  const exportFormats = [
    { key: 'pdf', label: 'PDF', icon: FileText },
    { key: 'txt', label: 'TXT', icon: FileText },
    { key: 'json', label: 'JSON', icon: FileJson },
  ];

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('dashboard')}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{t('settings')}</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Appearance */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Appearance
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => updateSettings({ darkMode: !settings.darkMode })}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {settings.darkMode ? <Moon size={20} className="text-purple-500" /> : <Sun size={20} className="text-amber-500" />}
                <span className="text-gray-900 dark:text-white font-medium">
                  {settings.darkMode ? t('darkMode') : t('lightMode')}
                </span>
              </div>
              <div className={`h-7 w-12 rounded-full transition-colors ${settings.darkMode ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'} relative`}>
                <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${settings.darkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>
        </section>

        {/* Language */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t('language')}
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {languages.map((lang, i) => (
              <button
                key={lang.key}
                onClick={() => updateSettings({ language: lang.key })}
                className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  i < languages.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Globe size={20} className="text-blue-500" />
                  <span className="text-gray-900 dark:text-white">{lang.label}</span>
                </div>
                {settings.language === lang.key && (
                  <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t('notifications')}
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden space-y-1">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-green-500" />
                <span className="text-gray-900 dark:text-white font-medium">{t('enableNotifications')}</span>
              </div>
              <button
                onClick={() => updateSettings({ notifications: !settings.notifications })}
                className={`h-7 w-12 rounded-full transition-colors ${settings.notifications ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'} relative`}
              >
                <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${settings.notifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-amber-500" />
                <span className="text-gray-900 dark:text-white font-medium">{t('enableUnusedReminders')}</span>
              </div>
              <button
                onClick={() => updateSettings({ unusedReminders: !settings.unusedReminders })}
                className={`h-7 w-12 rounded-full transition-colors ${settings.unusedReminders ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'} relative`}
              >
                <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${settings.unusedReminders ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">{t('dailyNotificationTime')}</label>
              <input
                type="time"
                value={settings.dailyNotificationTime}
                onChange={(e) => updateSettings({ dailyNotificationTime: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0"
              />
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t('dataManagement')}
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden space-y-1">
            {/* Export Inventory */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t('exportInventory')}</p>
              <div className="flex gap-2">
                {exportFormats.map(fmt => {
                  const Icon = fmt.icon;
                  return (
                    <button
                      key={fmt.key}
                      onClick={() => handleExportInventory(fmt.key)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Icon size={14} />
                      {fmt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Import Backup */}
            <button
              onClick={handleImportInventory}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700"
            >
              <Upload size={20} className="text-blue-500" />
              <span className="text-gray-900 dark:text-white font-medium">{t('importBackup')}</span>
            </button>

            {/* Import Shopping List */}
            <button
              onClick={handleImportShoppingList}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700"
            >
              <Upload size={20} className="text-purple-500" />
              <span className="text-gray-900 dark:text-white font-medium">{t('importShoppingList')}</span>
            </button>

            {/* Reset Data */}
            <button
              onClick={handleResetData}
              className="w-full flex items-center gap-3 p-4 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={20} className="text-red-500" />
              <span className="text-red-600 dark:text-red-400 font-medium">{t('resetData')}</span>
            </button>
          </div>
        </section>

        {/* Privacy */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t('privacyNotice')}
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start gap-3">
              <Shield size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('privacyText')}</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {t('noCloud')}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {t('noAccount')}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {t('allDataLocal')}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {t('noAI')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Version */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-600 pt-4 pb-6">
          FridgeTrack v1.0
        </div>
      </div>
    </div>
  );
}

export default Settings;
