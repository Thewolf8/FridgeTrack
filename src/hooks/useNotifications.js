import { useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings } from '../utils/storage';
import {
  scheduleDailyNotification,
  cancelAllNotifications,
  requestNotificationPermission,
  checkNotificationPermission,
} from '../utils/notifications';

export function useNotifications() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [settings, setSettings] = useState(() => getSettings());

  useEffect(() => {
    checkPermission();
  }, []);

  useEffect(() => {
    if (settings.notifications && permissionGranted) {
      scheduleDailyNotification(settings.dailyNotificationTime);
    } else {
      cancelAllNotifications();
    }
  }, [settings.notifications, settings.dailyNotificationTime, permissionGranted]);

  const checkPermission = useCallback(async () => {
    const result = await checkNotificationPermission();
    setPermissionGranted(result.granted === true);
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermissionGranted(result.granted === true);
    return result.granted === true;
  }, []);

  const toggleNotifications = useCallback(async (enabled) => {
    if (enabled && !permissionGranted) {
      const granted = await requestPermission();
      if (!granted) return false;
    }
    const newSettings = { ...settings, notifications: enabled };
    setSettings(newSettings);
    saveSettings(newSettings);
    return true;
  }, [settings, permissionGranted]);

  const updateNotificationTime = useCallback((time) => {
    const newSettings = { ...settings, dailyNotificationTime: time };
    setSettings(newSettings);
    saveSettings(newSettings);
  }, [settings]);

  const toggleUnusedReminders = useCallback((enabled) => {
    const newSettings = { ...settings, unusedReminders: enabled };
    setSettings(newSettings);
    saveSettings(newSettings);
  }, [settings]);

  return {
    permissionGranted,
    settings,
    requestPermission,
    toggleNotifications,
    updateNotificationTime,
    toggleUnusedReminders,
  };
}
