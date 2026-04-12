import { useCallback, useEffect } from 'react';
import axios from 'axios';
import { useAppStore } from '../store/appStore';

export function useShopping() {
  const { shoppingCategories, totalItems, boughtItems, isShoppingGenerated, peopleCount,
    setShoppingData, toggleShoppingItem, resetShopping, setPeopleCount } = useAppStore();

  const loadShopping = useCallback(async () => {
    try {
      const res = await axios.get('/api/shopping', { withCredentials: true });
      // Validate shopping data has expected shape
      const categories = res.data.categories;
      if (Array.isArray(categories) && categories.every((c: any) => c && typeof c.name === 'string' && Array.isArray(c.items))) {
        setShoppingData(
          categories,
          typeof res.data.totalItems === 'number' ? res.data.totalItems : 0,
          typeof res.data.boughtItems === 'number' ? res.data.boughtItems : 0,
          res.data.isGenerated || false,
          typeof res.data.peopleCount === 'number' ? res.data.peopleCount : 1
        );
      } else {
        setShoppingData([], 0, 0, false, 1);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadShopping();
  }, [loadShopping]);

  const toggleItem = useCallback(async (key: string, currentBought: boolean) => {
    toggleShoppingItem(key, !currentBought);
    try {
      await axios.post(`/api/shopping/${key}/toggle`, {}, { withCredentials: true });
    } catch {
      toggleShoppingItem(key, currentBought);
    }
  }, [toggleShoppingItem]);

  const reset = useCallback(async () => {
    resetShopping();
    try {
      await axios.delete('/api/shopping/reset', { withCredentials: true });
    } catch {
      loadShopping();
    }
  }, [resetShopping, loadShopping]);

  const updatePeopleCount = useCallback(async (count: number) => {
    setPeopleCount(count);
    try {
      await axios.post('/api/shopping/people-count', { peopleCount: count }, { withCredentials: true });
    } catch {
      // silent
    }
  }, [setPeopleCount]);

  return { shoppingCategories, totalItems, boughtItems, isShoppingGenerated, peopleCount, toggleItem, reset, updatePeopleCount, loadShopping };
}
