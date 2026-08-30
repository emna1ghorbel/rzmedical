"use client";

/**
 * HeroVideoProvider
 *
 * Allows any page-level Hero component to signal that it is currently
 * showing a fullscreen video, so that SiteHeader can adopt the
 * transparent/glass appearance without needing a prop drilled from the
 * server layout.
 *
 * Usage:
 *   - Wrap the app in <HeroVideoProvider> (done in the root providers or layout).
 *   - Hero calls `useSetHeroVideo(true)` while it renders with video active.
 *   - SiteHeader reads `useHasHeroVideo()` to decide its look.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface HeroVideoCtx {
  hasHeroVideo: boolean;
  setHasHeroVideo: (v: boolean) => void;
}

const Ctx = createContext<HeroVideoCtx>({
  hasHeroVideo: false,
  setHasHeroVideo: () => {},
});

export function HeroVideoProvider({ children }: { children: ReactNode }) {
  const [hasHeroVideo, setHasHeroVideoRaw] = useState(false);
  const setHasHeroVideo = useCallback((v: boolean) => {
    setHasHeroVideoRaw((prev) => (prev === v ? prev : v));
  }, []);
  return (
    <Ctx.Provider value={{ hasHeroVideo, setHasHeroVideo }}>
      {children}
    </Ctx.Provider>
  );
}

/** Read whether any hero video is currently active on the page. */
export function useHasHeroVideo() {
  return useContext(Ctx).hasHeroVideo;
}

/**
 * Call inside a Hero component to register/unregister the video state.
 * Uses useLayoutEffect so the header updates synchronously before the
 * browser paints — avoids the flash of solid header on first render.
 * Cleanup resets to false when the component unmounts (page navigation).
 */
export function useSetHeroVideo(active: boolean) {
  const { setHasHeroVideo } = useContext(Ctx);
  useEffect(() => {
    setHasHeroVideo(active);
    return () => setHasHeroVideo(false);
  }, [active, setHasHeroVideo]);
}
