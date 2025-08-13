import { useState, useEffect } from 'react';

/**
 * Custom hook for managing localStorage with React state
 * @param {string} key - The localStorage key
 * @param {any} initialValue - Initial value if key doesn't exist
 * @returns {[any, function]} - [value, setValue] tuple
 */
export const useLocalStorage = (key, initialValue) => {
  // Get value from localStorage or use initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      if (valueToStore === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

/**
 * Hook for managing arrays in localStorage (useful for saved items, search history, etc.)
 * @param {string} key - The localStorage key
 * @param {number} maxItems - Maximum number of items to keep
 * @returns {[array, function, function, function]} - [items, addItem, removeItem, clearItems]
 */
export const useLocalStorageArray = (key, maxItems = 100) => {
  const [items, setItems] = useLocalStorage(key, []);

  const addItem = (newItem) => {
    setItems(prevItems => {
      // Remove existing item if it exists
      const filteredItems = prevItems.filter(item => 
        typeof item === 'object' ? item.id !== newItem.id : item !== newItem
      );
      
      // Add new item to the beginning and limit array size
      const updatedItems = [newItem, ...filteredItems].slice(0, maxItems);
      return updatedItems;
    });
  };

  const removeItem = (itemToRemove) => {
    setItems(prevItems => 
      prevItems.filter(item => 
        typeof item === 'object' ? item.id !== itemToRemove.id : item !== itemToRemove
      )
    );
  };

  const clearItems = () => {
    setItems([]);
  };

  const hasItem = (itemToCheck) => {
    return items.some(item => 
      typeof item === 'object' ? item.id === itemToCheck.id : item === itemToCheck
    );
  };

  return [items, addItem, removeItem, clearItems, hasItem];
};

export default useLocalStorage;