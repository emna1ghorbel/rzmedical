"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const WISHLIST_KEY = "rz_wishlist";

interface WishlistContextValue {
  ids: number[];
  ready: boolean;
  has: (id: number) => boolean;
  toggle: (id: number) => void;
  add: (id: number) => void;
  remove: (id: number) => void;
  count: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<number[]>([]);
  const [ready, setReady] = useState(false);

  // Hydration depuis localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setIds(parsed as number[]);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  // Persistance
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }, [ids, ready]);

  const has = useCallback((id: number) => ids.includes(id), [ids]);

  const add = useCallback(
    (id: number) => setIds((prev) => (prev.includes(id) ? prev : [...prev, id])),
    [],
  );

  const remove = useCallback(
    (id: number) => setIds((prev) => prev.filter((i) => i !== id)),
    [],
  );

  const toggle = useCallback(
    (id: number) =>
      setIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
      ),
    [],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({ ids, ready, has, toggle, add, remove, count: ids.length }),
    [ids, ready, has, toggle, add, remove],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
