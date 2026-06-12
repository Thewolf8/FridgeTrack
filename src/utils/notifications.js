let LocalNotifications = null;

try {
  const cap = require('@capacitor/local-notifications');
  LocalNotifications = cap.LocalNotifications;
} catch {
  // Not in Capacitor environment
}

export async function scheduleDailyNotification(time = '08:00') {
  if (!LocalNotifications) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    const [hours, minutes] = time.split(':');
    await LocalNotifications.schedule({
      notifications: [{
        id: 1,
        title: 'FridgeTrack',
        body: 'Daily inventory check — review your items and shopping list.',
        schedule: {
          on: { hour: parseInt(hours), minute: parseInt(minutes) },
          repeats: true,
        },
      }]
    });
  } catch (e) {
    console.warn('Failed to schedule notification:', e);
  }
}

export async function cancelAllNotifications() {
  if (!LocalNotifications) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
  } catch (e) {
    console.warn('Failed to cancel notifications:', e);
  }
}

export async function requestNotificationPermission() {
  if (!LocalNotifications) return { granted: false };
  try {
    const result = await LocalNotifications.requestPermissions();
    return result;
  } catch (e) {
    return { granted: false };
  }
}

export async function checkNotificationPermission() {
  if (!LocalNotifications) return { granted: false };
  try {
    const result = await LocalNotifications.checkPermissions();
    return result;
  } catch (e) {
    return { granted: false };
  }
}
