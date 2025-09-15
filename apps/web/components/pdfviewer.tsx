"use client";

import React, { useEffect, useState } from "react";

export default function PDFViewer({ initialUrl }: { initialUrl?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | undefined>(initialUrl);
  const [pageHint, setPageHint] = useState<number | null>(null); // small UI control for future use
  const [scale, setScale] = useState<number>(1);

  // When initialUrl changes (upload response), use it
  useEffect(() => {
    setFileUrl(initialUrl);
  }, [initialUrl]);

  // When a local file is chosen, create an object URL
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  }

  function zoomIn() {
    setScale((s) => Math.min(3, +(s + 0.1).toFixed(2)));
  }
  function zoomOut() {
    setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(2)));
  }
  function resetZoom() {
    setScale(1);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <span className="sr-only">Choose PDF</span>
          <input aria-label="Choose PDF file" type="file" accept="application/pdf" onChange={onFileChange} />
        </label>

        <div className="flex items-center gap-2">
          <button type="button" onClick={zoomOut} aria-label="Zoom out" className="px-2 py-1 rounded border">-</button>
          <button type="button" onClick={resetZoom} aria-label="Reset zoom" className="px-2 py-1 rounded border">100%</button>
          <button type="button" onClick={zoomIn} aria-label="Zoom in" className="px-2 py-1 rounded border">+</button>
          <div className="ml-3 text-sm text-muted-foreground">Zoom: {Math.round(scale * 100)}%</div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm">Page (hint)</label>
          <input
            type="number"
            min={1}
            value={pageHint ?? ""}
            onChange={(e) => setPageHint(e.target.value ? Math.max(1, Number(e.target.value)) : null)}
            className="w-20 px-2 py-1 border rounded"
            aria-label="Page hint"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 border rounded p-2 bg-white shadow-sm" style={{ minHeight: 480 }}>
          {fileUrl ? (
            <div className="h-full w-full">
              {/* iframe is simplest: pass URL directly. scale handled by CSS transform */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <iframe
                  src={fileUrl}
                  title={`PDF Viewer${pageHint ? ` - page ${pageHint}` : ""}`}
                  style={{
                    width: "100%",
                    height: 600,
                    border: "none",
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-sm text-gray-500">
              No PDF loaded. Choose a local file or provide an <code>initialUrl</code>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
