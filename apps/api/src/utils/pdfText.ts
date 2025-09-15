// apps/api/src/utils/pdfText.ts
// import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

export async function extractTextFromPdf(pdfData: Uint8Array): Promise<string>  {
  // pdfjs-dist legacy build works in Node; no worker config required for this usage.
  // But optionally we set workerSrc if you bundle a worker — not needed for server-side.
  try {
     const loadingTask = getDocument({ data: pdfData });
    const doc = await loadingTask.promise;
    const maxPages = doc.numPages;
    let fullText = "";

    for (let i = 1; i <= maxPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();

      // textContent.items contains items of text pieces — join them with spaces/newlines
      const pageText = textContent.items.map((it: any) => (it.str || "")).join(" ");
      fullText += pageText + "\n";
    }

    // cleanup (pdfjs will free resources when doc is garbage-collected)
    return fullText.trim();
  } catch (err) {
    // bubble up for caller to handle
    throw err;
  }
}
