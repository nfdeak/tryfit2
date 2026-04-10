import { useCallback, useEffect } from 'react';
import axios from 'axios';
import { useAppStore } from '../store/appStore';

export function useShopping() {
  const { shoppingCategories, totalItems, boughtItems, isShoppingGenerated, peopleCount,
    setShoppingData, toggleShoppingItem, resetShopping, setPeopleCount } = useAppStore();

  const loadShopping = useCallback(async () => {
    try {
      const res = await axios.get('/api/shopping', { withCredentials: true });
      setShoppingData(
        res.data.categories,
        res.data.totalItems,
        res.data.boughtItems,
        res.data.isGenerated || false,
        res.data.peopleCount || 1
      );
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
