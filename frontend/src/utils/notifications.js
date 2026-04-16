const NOTIFICATIONS_KEY_PREFIX = "notifications";

function storageKeyForUser(userId) {
  return `${NOTIFICATIONS_KEY_PREFIX}:${userId}`;
}

export function loadNotifications(userId) {
  if (!userId) {
    return [];
  }

  const rawValue = localStorage.getItem(storageKeyForUser(userId));
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(storageKeyForUser(userId));
    return [];
  }
}

export function saveNotifications(userId, notifications) {
  if (!userId) {
    return [];
  }

  const normalizedNotifications = Array.isArray(notifications) ? notifications.slice(0, 20) : [];
  localStorage.setItem(storageKeyForUser(userId), JSON.stringify(normalizedNotifications));
  return normalizedNotifications;
}

export function addNotification(userId, notification) {
  const existingNotifications = loadNotifications(userId);
  const nextNotifications = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      read: false,
      ...notification,
    },
    ...existingNotifications,
  ];

  return saveNotifications(userId, nextNotifications);
}

export function markAllNotificationsRead(userId) {
  const existingNotifications = loadNotifications(userId);
  const nextNotifications = existingNotifications.map((notification) => ({
    ...notification,
    read: true,
  }));

  return saveNotifications(userId, nextNotifications);
}
