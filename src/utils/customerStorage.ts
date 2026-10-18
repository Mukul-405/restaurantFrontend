/**
 * Local storage manager for Order Customer Names.
 * Persists customer names locally on the client without modifying the database schema.
 */

const STORAGE_KEY = 'restaurant_order_customer_names';

export const getAllOrderCustomers = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to read customer names from localStorage', err);
    return {};
  }
};

export const getOrderCustomer = (orderId: number | string | undefined | null): string => {
  if (!orderId || typeof window === 'undefined') return '';
  const map = getAllOrderCustomers();
  return map[String(orderId)] || '';
};

export const setOrderCustomer = (orderId: number | string, customerName: string): void => {
  if (typeof window === 'undefined' || !orderId) return;
  try {
    const map = getAllOrderCustomers();
    const trimmed = (customerName || '').trim();
    if (trimmed) {
      map[String(orderId)] = trimmed;
    } else {
      delete map[String(orderId)];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('order_customers_updated', { detail: { orderId, customerName: trimmed } }));
  } catch (err) {
    console.error('Failed to save customer name to localStorage', err);
  }
};

export const removeOrderCustomer = (orderId: number | string): void => {
  if (typeof window === 'undefined' || !orderId) return;
  try {
    const map = getAllOrderCustomers();
    if (map[String(orderId)]) {
      delete map[String(orderId)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
      window.dispatchEvent(new CustomEvent('order_customers_updated', { detail: { orderId, customerName: '' } }));
    }
  } catch (err) {
    console.error('Failed to remove customer name from localStorage', err);
  }
};
