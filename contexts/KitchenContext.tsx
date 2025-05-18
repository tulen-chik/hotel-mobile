import React, { createContext, useContext, useEffect, useState } from 'react';
import { MenuItem, createMenuItem, deleteMenuItem, subscribeToMenuItems, subscribeToMenuItemsByCategory, updateMenuItem } from '../services/kitchen';

interface KitchenContextType {
  menuItems: MenuItem[];
  loading: boolean;
  error: string | null;
  fetchMenuItems: () => Promise<void>;
  fetchMenuItemsByCategory: (category: string) => Promise<void>;
  addMenuItem: (menuItem: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (id: string, menuItem: Partial<MenuItem>) => Promise<void>;
  removeMenuItem: (id: string) => Promise<void>;
}

const KitchenContext = createContext<KitchenContextType | undefined>(undefined);

export const KitchenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState<string>('Все');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = () => {
      if (currentCategory === 'Все') {
        unsubscribe = subscribeToMenuItems((items) => {
          setMenuItems(items);
          setLoading(false);
        });
      } else {
        unsubscribe = subscribeToMenuItemsByCategory(currentCategory, (items) => {
          setMenuItems(items);
          setLoading(false);
        });
      }
    };

    setLoading(true);
    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentCategory]);

  const fetchMenuItems = async () => {
    setCurrentCategory('Все');
  };

  const fetchMenuItemsByCategory = async (category: string) => {
    setCurrentCategory(category);
  };

  const addMenuItem = async (menuItem: Omit<MenuItem, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      await createMenuItem(menuItem);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMenuItem = async (id: string, menuItem: Partial<MenuItem>) => {
    try {
      setLoading(true);
      setError(null);
      await updateMenuItem(id, menuItem);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update menu item');
    } finally {
      setLoading(false);
    }
  };

  const removeMenuItem = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteMenuItem(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove menu item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KitchenContext.Provider
      value={{
        menuItems,
        loading,
        error,
        fetchMenuItems,
        fetchMenuItemsByCategory,
        addMenuItem,
        updateMenuItem: handleUpdateMenuItem,
        removeMenuItem,
      }}
    >
      {children}
    </KitchenContext.Provider>
  );
};

export const useKitchen = () => {
  const context = useContext(KitchenContext);
  if (context === undefined) {
    throw new Error('useKitchen must be used within a KitchenProvider');
  }
  return context;
}; 