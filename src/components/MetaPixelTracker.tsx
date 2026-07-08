import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Fires a Meta Pixel PageView on every SPA route change.
 * The base snippet in index.html covers the initial load, so the
 * first render is skipped to avoid double-counting.
 */
export const MetaPixelTracker = () => {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [location.pathname]);

  return null;
};
