const normalizeBooleanFlag = (value: unknown, defaultValue: boolean): boolean => {
  if (typeof value !== "string") {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
};

export const isNotificationsFeatureEnabled = normalizeBooleanFlag(
  import.meta.env.VITE_NOTIFICATIONS_ENABLED,
  true
);
