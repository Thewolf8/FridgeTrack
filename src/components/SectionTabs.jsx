import React from 'react';
import { motion } from 'framer-motion';
import { Refrigerator, Snowflake, Package, LayoutGrid } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';

const sectionConfig = {
  fridge: { icon: Refrigerator, color: 'text-blue-500', bg: 'bg-blue-500', label: t('fridge') },
  freezer: { icon: Snowflake, color: 'text-cyan-500', bg: 'bg-cyan-500', label: t('freezer') },
  pantry: { icon: Package, color: 'text-orange-500', bg: 'bg-orange-500', label: t('pantry') },
  all: { icon: LayoutGrid, color: 'text-green-500', bg: 'bg-green-500', label: t('allItems') },
};

function SectionTabs({ activeSection, onSectionChange, counts }) {
  const sections = ['fridge', 'freezer', 'pantry', 'all'];

  return (
    <div className="sticky top-0 z-30 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 px-2 py-2">
      <div className="flex items-center gap-1 max-w-lg mx-auto">
        {sections.map((section) => {
          const config = {
            fridge: { icon: Refrigerator, color: 'text-blue-500', bg: 'bg-blue-500', label: t('fridge') },
            freezer: { icon: Snowflake, color: 'text-cyan-500', bg: 'bg-cyan-500', label: t('freezer') },
            pantry: { icon: Package, color: 'text-orange-500', bg: 'bg-orange-500', label: t('pantry') },
            all: { icon: LayoutGrid, color: 'text-green-500', bg: 'bg-green-500', label: t('allItems') },
          }[section];
          const Icon = config.icon;
          const isActive = activeSection === section;
          const count = counts?.[section] || 0;

          return (
            <button
              key={section}
              onClick={() => onSectionChange(section)}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'text-white shadow-md'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sectionTabBg"
                  className={`absolute inset-0 rounded-xl ${config.bg}`}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                <Icon size={16} />
                <span className="hidden sm:inline">{config.label}</span>
                {count > 0 && (
                  <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    {count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SectionTabs;
