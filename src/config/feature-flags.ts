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

export const isInternalAuditFeatureEnabled = normalizeBooleanFlag(
  import.meta.env.VITE_INTERNAL_AUDIT_ENABLED,
  false
);

export const isTaxpayerDashboardFeatureEnabled = normalizeBooleanFlag(
  import.meta.env.VITE_TAXPAYER_DASHBOARD_ENABLED,
  false
);

export const isThemeToggleEnabled = normalizeBooleanFlag(
  import.meta.env.VITE_THEME_TOGGLE_ENABLED,
  true
);

export const isVisitNotificationsFeatureEnabled = normalizeBooleanFlag(
  import.meta.env.VITE_VISIT_NOTIFICATIONS_ENABLED,
  true
);

export const isMaquinasFiscalesFeatureEnabled = normalizeBooleanFlag(
  import.meta.env.VITE_MAQUINAS_FISCALES_ENABLED,
  true
);

export const isControlesIngresoEnabled = normalizeBooleanFlag(
  import.meta.env.VITE_CONTROLES_INGRESO_ENABLED,
  true
);

/**
 * Habilita la nueva página /gestion-actas con la UI renovada.
 * - false (default): los admins siguen usando /gestion-personal con la UI actual.
 * - true: la página nueva reemplaza la antigua.
 *
 * Debe permanecer en false hasta que TASK-006b (migración del segundo consumidor
 * en fiscalizacion-page-v2.tsx) esté mergeada y validada en staging.
 */
export const isActasExpedientesEnabled = normalizeBooleanFlag(
  import.meta.env.VITE_ACTAS_EXPEDIENTES_ENABLED,
  false
);

export const isWhatsAppNotificationsEnabled = normalizeBooleanFlag(
  import.meta.env.VITE_WHATSAPP_NOTIFICATIONS_ENABLED,
  false
);
