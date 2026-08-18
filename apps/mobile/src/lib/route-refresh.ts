// RF-SMART Elevate owns this file
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

export type RouteRefreshTarget = 'audit' | 'dashboard' | 'events' | 'inbox' | 'pots';

const listeners = new Map<RouteRefreshTarget, Set<() => void>>();

export function triggerRouteRefresh(target: RouteRefreshTarget) {
  listeners.get(target)?.forEach((listener) => listener());
}

export function useRouteRefresh(target: RouteRefreshTarget, refresh: () => Promise<void> | void) {
  const refreshRef = useRef(refresh);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    const listener = () => setRefreshVersion((current) => current + 1);
    const targetListeners = listeners.get(target) ?? new Set<() => void>();

    targetListeners.add(listener);
    listeners.set(target, targetListeners);

    return () => {
      targetListeners.delete(listener);

      if (targetListeners.size === 0) {
        listeners.delete(target);
      }
    };
  }, [target]);

  useFocusEffect(useCallback(() => {
    void refreshRef.current();
  }, [target]));

  useEffect(() => {
    if (refreshVersion > 0) {
      void refreshRef.current();
    }
  }, [refreshVersion]);
}