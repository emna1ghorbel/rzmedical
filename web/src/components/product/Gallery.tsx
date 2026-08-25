"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { imageUrl } from "@/lib/api";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Modal } from "@/components/ui/Modal";
import { PackageIcon, SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const ZOOM_SCALE = 2.4;

/** Galerie produit : vignettes + grande image (zoom sur la zone au survol). */
export function Gallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const list = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const src = list[active];
  const canZoom = Boolean(src) && !reduced;

  const updateOrigin = useCallback((clientX: number, clientY: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setOrigin({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  }, []);

  const onPointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canZoom || e.pointerType !== "mouse") return;
    updateOrigin(e.clientX, e.clientY);
    setZoom(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canZoom || e.pointerType !== "mouse") return;
    updateOrigin(e.clientX, e.clientY);
    if (!zoom) setZoom(true);
  };

  const onPointerLeave = () => setZoom(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="min-w-0">
        <div
          ref={frameRef}
          onPointerEnter={onPointerEnter}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          onClick={() => src && setLightbox(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (src) setLightbox(true);
            }
          }}
          role={src ? "button" : undefined}
          tabIndex={src ? 0 : undefined}
          aria-label={
            src
              ? "Agrandir l'image. Survolez pour zoomer sur une zone."
              : undefined
          }
          className={cn(
            "relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-surface select-none",
            src && "cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-500",
          )}
        >
          {src ? (
            <>
              <div
                className="absolute inset-0 will-change-transform"
                style={{
                  transform: zoom ? `scale(${ZOOM_SCALE})` : "scale(1)",
                  transformOrigin: `${origin.x}% ${origin.y}%`,
                  transition: zoom ? "none" : "transform 180ms ease-out",
                }}
              >
                <Image
                  src={imageUrl(src)}
                  alt={alt}
                  fill
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  preload
                  className="object-contain p-3 sm:p-4"
                />
              </div>
              <div
                className={cn(
                  "pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg border border-border bg-surface/90 px-2 py-1 text-xs font-medium text-navy-800 shadow-xs transition-opacity",
                  zoom ? "opacity-0" : "opacity-100",
                )}
              >
                <SearchIcon size={14} />
                Zoom
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <PackageIcon size={72} strokeWidth={1} />
            </div>
          )}
        </div>
      </div>

      {list.length > 1 ? (
        <div
          role="tablist"
          aria-label="Photos du produit"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {list.map((img, i) => (
            <button
              key={img + i}
              type="button"
              role="tab"
              onClick={() => setActive(i)}
              aria-label={`Voir la photo ${i + 1}`}
              aria-selected={i === active}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-surface transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-500 sm:h-20 sm:w-20",
                i === active
                  ? "border-azure-500 ring-2 ring-azure-500/30"
                  : "border-border hover:border-navy-300",
              )}
            >
              <Image
                src={imageUrl(img)}
                alt=""
                fill
                sizes="80px"
                className="object-contain p-1.5"
              />
            </button>
          ))}
        </div>
      ) : null}

      <Modal open={lightbox} onClose={() => setLightbox(false)} title={alt} size="lg">
        <div className="relative aspect-square w-full overflow-hidden bg-white select-none">
          {src ? (
            <Image
              src={imageUrl(src)}
              alt={alt}
              fill
              sizes="(min-width: 640px) 640px, 100vw"
              className="object-contain p-2"
            />
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
