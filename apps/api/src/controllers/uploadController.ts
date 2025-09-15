import { Request, Response } from "express";
import { put } from "@vercel/blob";
import {getSafeKey} from "../utils/getSafeKey"
export const handleUpload = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const safeKey = getSafeKey(req.file.originalname);
    const blob = await put(safeKey, fileBuffer, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,  // ✅ use env var
    });

    res.json({
      fileId: blob.url, // permanent URL
      fileName,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "File upload failed" });
  }
};
