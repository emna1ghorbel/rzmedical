"use client";

import { useEffect, useState } from "react";

/**
 * Direction de défilement + position haute de page, pour un header qui se
 * masque en défilant vers le bas et réapparaît vers le haut.
 */
export function useScrollDirection() {
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const threshold = 8;

    const update = () => {
      const y = window.scrollY;
      setAtTop(y < 10);
      if (Math.abs(y - lastY) >= threshold) {
        setDirection(y > lastY && y > 80 ? "down" : "up");
        lastY = y;
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return { direction, atTop };
}
