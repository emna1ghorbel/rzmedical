"use client";

import { useEffect, useRef, useState } from "react";
import { DatasheetDownload } from "./DatasheetDownload";

type Status = "loading" | "ready" | "error";

/** Affiche les pages du PDF (sans la barre du lecteur navigateur). */
export function PdfPages({ src }: { src: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let loadingTask: { promise: Promise<any>; destroy: () => Promise<unknown> } | null = null;
    const canvases: HTMLCanvasElement[] = [];

    const run = async () => {
      setStatus("loading");
      host.replaceChildren();

      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      loadingTask = pdfjs.getDocument({ url: src, withCredentials: false });
      const doc = await loadingTask.promise;
      if (cancelled) {
        await loadingTask.destroy();
        return;
      }

      const width = Math.min(host.clientWidth || 800, 896);

      for (let i = 1; i <= doc.numPages; i++) {
        if (cancelled) return;
        const page = await doc.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const scale = width / base.width;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: scale * dpr });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${base.height * scale}px`;
        canvas.className = "block w-full bg-white";
        canvas.setAttribute("aria-label", `Page ${i} sur ${doc.numPages}`);

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas indisponible");

        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        if (cancelled) return;

        canvases.push(canvas);
        host.appendChild(canvas);
      }

      setStatus("ready");
    };

    run().catch(() => {
      if (!cancelled) setStatus("error");
    });

    return () => {
      cancelled = true;
      canvases.forEach((c) => c.remove());
      void loadingTask?.destroy().catch(() => { });
    };
  }, [src]);

  if (status === "error") {
    return (
      <div className="max-w-md">
        <p className="mb-3 text-sm text-muted">
          Impossible d&apos;afficher le document ici. Vous pouvez le télécharger.
        </p>
        <DatasheetDownload href={src} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {status === "loading" && (
        <p className="mb-3 text-sm text-muted">Chargement du document…</p>
      )}
      <div
        ref={hostRef}
        className="space-y-6 overflow-hidden bg-transparent"
      />
    </div>
  );
}
