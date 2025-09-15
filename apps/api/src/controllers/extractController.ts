// apps/api/src/controllers/extractController.ts
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import axios from "axios";
import { extractWithGemini } from "../utils/aiClient";
import { InvoicePayloadSchema } from "../utils/validation";

const TMP_DIR = path.resolve("tmp");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

export const extractData = async (req: Request, res: Response) => {
  try {
    const { fileId, fileName } = req.body;
    if (!fileId || !fileName) {
      return res.status(400).json({ error: "fileId and fileName are required" });
    }

    // fetch pdf via axios (more reliable for binary)
    let resp;
    try {
      resp = await axios.get(fileId, { responseType: "arraybuffer", maxRedirects: 5 });
    } catch (fetchErr: any) {
      console.error("Fetch error:", fetchErr.message || fetchErr);
      return res.status(502).json({ error: "Failed to fetch file from blob", details: fetchErr.message });
    }

    // diagnostic checks
    const status = resp.status;
    const contentType = (resp.headers && (resp.headers['content-type'] || resp.headers['Content-Type'])) || "unknown";
    if (status !== 200) {
      return res.status(502).json({ error: "Blob fetch returned non-200", status, contentType });
    }
    if (!String(contentType).toLowerCase().includes("pdf")) {
      // Save response to a file for debugging
      const debugPath = path.join(TMP_DIR, `${fileName.replace(/\s/g, "_")}.debug`);
      fs.writeFileSync(debugPath, Buffer.from(resp.data));
      console.error("Fetched resource is not a PDF. content-type:", contentType, "saved to", debugPath);
      return res.status(400).json({
        error: "Fetched resource is not a PDF",
        contentType,
        debugFile: debugPath,
      });
    }

    const buffer = Buffer.from(resp.data);

    // save to tmp for inspection (optional but useful while debugging)
    const tmpPath = path.join(TMP_DIR, `${Date.now()}-${fileName}`);
    fs.writeFileSync(tmpPath, buffer);

    // pdf-parse can throw FormatError; wrap in try/catch
    let pdfData;
    try {
      pdfData = await pdfParse(buffer);
    } catch (pdfErr: any) {
      console.error("pdf-parse error:", pdfErr && pdfErr.message ? pdfErr.message : pdfErr);
      return res.status(500).json({
        error: "Failed to parse PDF",
        message: pdfErr?.message ?? String(pdfErr),
        tmpFile: tmpPath,
        hint: "Open tmpFile in a PDF reader to inspect contents (it may be HTML or corrupted).",
      });
    }

    // Build a strong prompt and call Gemini
    const prompt = `
You must return a single JSON object and NOTHING ELSE (no commentary, no code fences).
Return valid JSON matching this structure (use empty string or 0 if missing; lineItems may be an empty array):

{
  "fileId": "${fileId}",
  "fileName": "${fileName}",
  "vendor": { "name": "", "address": "", "taxId": "" },
  "invoice": {
    "number": "", "date": "", "currency": "",
    "subtotal": 0, "taxPercent": 0, "total": 0,
    "poNumber": "", "poDate": "",
    "lineItems": [
      { "description": "", "unitPrice": 0, "quantity": 0, "total": 0 }
    ]
  }
}

PDF TEXT:
${pdfData.text}
`;

    const aiRaw = await extractWithGemini(prompt);
    const aiText = typeof aiRaw === "string" ? aiRaw : String(aiRaw);

    // sanitize model output (strip ``` fences or surrounding text)
    const extractJsonString = (s: string) => {
      if (!s) return null;
      const fenced = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (fenced && fenced[1]) return fenced[1].trim();
      const first = s.indexOf("{");
      const last = s.lastIndexOf("}");
      if (first >= 0 && last > first) return s.slice(first, last + 1);
      return null;
    };
    const candidate = extractJsonString(aiText);
    if (!candidate) {
      // save raw AI to tmp for inspection
      const aiPath = path.join(TMP_DIR, `ai-${Date.now()}.txt`);
      fs.writeFileSync(aiPath, aiText);
      return res.status(500).json({
        error: "Invalid JSON from Gemini (no JSON found)",
        rawPreview: aiText.slice(0, 1200),
        aiDumpFile: aiPath,
      });
    }

    // try parse
    let parsed;
    try {
      parsed = JSON.parse(candidate);
    } catch (parseErr) {
      const aiPath = path.join(TMP_DIR, `ai-${Date.now()}.txt`);
      fs.writeFileSync(aiPath, aiText);
      return res.status(500).json({
        error: "Failed to parse JSON from Gemini",
        parseError: (parseErr as Error).message,
        rawPreview: candidate.slice(0, 1200),
        aiDumpFile: aiPath,
      });
    }

    // validate with Zod
    try {
      const validated = InvoicePayloadSchema.parse(parsed);
      return res.json({ success: true, data: validated });
    } catch (zErr: any) {
      const aiPath = path.join(TMP_DIR, `ai-${Date.now()}.txt`);
      fs.writeFileSync(aiPath, aiText);
      return res.status(400).json({
        error: "Validation failed",
        details: zErr.errors ?? zErr.message,
        rawPreview: candidate.slice(0, 1200),
        aiDumpFile: aiPath,
      });
    }
  } catch (err) {
    console.error("Unexpected extraction error:", err);
    res.status(500).json({ error: "Extraction failed", message: String(err) });
  }
};
