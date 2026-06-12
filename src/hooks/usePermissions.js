import { useState, useCallback } from 'react';
import { requestStoragePermissions, isNativePlatform } from '../utils/fileOperations';

export function usePermissions() {
  const [storagePermission, setStoragePermission] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  const checkStoragePermission = useCallback(async () => {
    if (!isNativePlatform()) {
      setStoragePermission(true);
      return true;
    }
    const result = await requestStoragePermissions();
    setStoragePermission(result.granted);
    return result.granted;
  }, []);

  const requestStorage = useCallback(async () => {
    if (!isNativePlatform()) {
      setStoragePermission(true);
      return true;
    }
    const result = await requestStoragePermissions();
    setStoragePermission(result.granted);
    if (!result.granted) {
      setShowPermissionDialog(true);
    }
    return result.granted;
  }, []);

  return {
    storagePermission,
    showPermissionDialog,
    setShowPermissionDialog,
    checkStoragePermission,
    requestStorage,
  };
}
