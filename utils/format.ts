/**
 * Formatea un número como moneda en pesos argentinos.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Formatea un número como kilometraje.
 */
export function formatMileage(mileage: number): string {
  return `${mileage.toLocaleString('es-AR')} km`;
}

/**
 * Formatea una fecha ISO en formato local.
 */
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Capitaliza la primera letra de un string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
} 