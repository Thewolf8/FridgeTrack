import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const iconMap = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const colorMap = {
  success: 'bg-green-500 text-white',
  warning: 'bg-amber-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
};

function ToastNotification() {
  const { toast } = useApp();

  if (!toast) return null;

  const Icon = iconMap[toast.type] || Info;

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="fixed bottom-20 left-4 right-4 z-[60] flex justify-center pointer-events-none"
        >
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl pointer-events-auto ${colorMap[toast.type]}`}>
            <Icon size={20} />
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ToastNotification;
