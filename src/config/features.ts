/**
 * Feature Flags del Frontend
 *
 * Se leen de las variables de entorno VITE_* de Vite.
 */

export const features = {
  /** Mapa interactivo para pin de ubicación (desarrollo/producción) */
  parishPinMap: import.meta.env.VITE_PARISH_PIN_MAP_ENABLED === 'true',
} as const;
