import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, useColorScheme } from 'react-native';

type ThemePreference = 'light' | 'dark' | 'system';
type ThemeContextValue = {
  preference: ThemePreference;
  scheme: 'light' | 'dark';
  setPreference: (value: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const storageKey = 'fintwin:theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('light');
  const changed = useRef(false);
  const writes = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey).then((value) => {
      if (active && !changed.current && (value === 'light' || value === 'dark' || value === 'system')) {
        setPreferenceState(value);
      }
    }).catch(() => {
      if (active) Alert.alert('Appearance unavailable', 'Your saved appearance could not be loaded.');
    });
    return () => { active = false; };
  }, []);

  const setPreference = useCallback((value: ThemePreference) => {
    changed.current = true;
    setPreferenceState(value);
    writes.current = writes.current.then(() => AsyncStorage.setItem(storageKey, value)).catch(() => {
      Alert.alert('Appearance not saved', 'Your appearance choice may not persist after closing the app.');
    });
  }, []);

  const scheme = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const value = useMemo(() => ({ preference, scheme, setPreference }), [preference, scheme, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within ThemeProvider');
  return value;
}
