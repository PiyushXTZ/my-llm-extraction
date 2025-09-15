"use client";

import React, { useEffect, useState } from "react";

export default function PDFViewer({ initialUrl }: { initialUrl?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | undefined>(initialUrl);
  const [pageHint, setPageHint] = useState<number | null>(null); // for future use
  const [scale, setScale] = useState<number>(1);

  // When initialUrl changes (upload response), use it
  useEffect(() => {
    console.log(initialUrl);
    
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
  console.log(fileUrl);
  
  // Render controls + iframe. Browser will handle PDF rendering (works in Chromium, Firefox).
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
       

        
      </div>

      <div className="flex gap-4">
        <div className="flex-1 border rounded p-2 bg-white shadow-sm" style={{ minHeight: 480 }}>
          {fileUrl ? (
            <div className="h-full w-full">
              {/* iframe is simplest: pass URL directly. scale handled by CSS transform */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <iframe
                  src={fileUrl}
                  title="PDF Viewer"
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
