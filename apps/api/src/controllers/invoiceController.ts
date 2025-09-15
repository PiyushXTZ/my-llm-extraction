import { Request, Response } from "express";
import Invoice from "../models/Invoice";
import { InvoicePayloadSchema } from "../utils/validation";
import mongoose from "mongoose";
export const getInvoice = async (req: Request, res: Response) => {
   try {
    const { id } = req.params;
    // Use findById to get a single object
    const invoice = await Invoice.findById(id); 

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    
    // This will now correctly send a single object
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string | undefined;
    let filter = {};
    if (q) {
      filter = {
        $or: [
          { "vendor.name": { $regex: q, $options: "i" } },
          { "invoice.number": { $regex: q, $options: "i" } },
        ],
      };
    }
    const invoices = await Invoice.find(filter);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
};


export const createInvoice = async (req: Request, res: Response) => {
  try {
    // Normalize incoming body: support wrapped responses (e.g. { success:true, data: {...} })
    const incoming = req.body;
    let payload = incoming;

    if (incoming && typeof incoming === "object") {
      if ("data" in incoming && incoming.data && typeof incoming.data === "object") {
        payload = incoming.data;
      } else if ("success" in incoming && "data" in incoming && incoming.data) {
        payload = incoming.data;
      }
    }

    // Optional quick debug (uncomment while testing)
    // console.log("Normalized payload for createInvoice:", JSON.stringify(payload).slice(0, 1000));

    // Validate & coerce using Zod schema
    const parsed = InvoicePayloadSchema.parse(payload);

    // Auto-fill total if missing but subtotal and taxPercent present
    if ((parsed.invoice.total === null || parsed.invoice.total === undefined) && parsed.invoice.subtotal != null) {
      const subtotal = Number(parsed.invoice.subtotal ?? 0);
      const tax = parsed.invoice.taxPercent ? subtotal * (Number(parsed.invoice.taxPercent) / 100) : 0;
      parsed.invoice.total = Number((subtotal + tax).toFixed(2));
    }

    const created = await Invoice.create(parsed);
    return res.status(201).json(created);
  } catch (err: any) {
    // Zod validation error
    if (err?.issues) {
      return res.status(400).json({ error: "Validation failed", details: err.issues });
    }
    console.error("createInvoice error:", err);
    return res.status(500).json({ error: "Failed to create invoice" });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const existing = await Invoice.findById(id);
    if (!existing) {
      return res.status(404).json({ error: "Not found" });
    }

    // Normalize incoming (support wrappers like { data: {...} })
    let incoming: any = req.body;
    if (incoming && typeof incoming === "object" && "data" in incoming && incoming.data) {
      incoming = incoming.data;
    }

    // Merge existing doc with incoming updates (shallow + nested merge for invoice/vendor)
    const merged: any = {
      ...existing.toObject(),
      ...incoming,
      vendor: { ...(existing.vendor || {}), ...(incoming.vendor || {}) },
      invoice: { ...(existing.invoice || {}), ...(incoming.invoice || {}) },
    };

    // Convert Date objects to ISO strings so Zod (expecting strings) validates correctly
    if (merged.createdAt instanceof Date) merged.createdAt = merged.createdAt.toISOString();
    if (merged.updatedAt instanceof Date) merged.updatedAt = merged.updatedAt.toISOString();

    // Validate & coerce the merged payload to full shape
    const validated = InvoicePayloadSchema.parse(merged);

    // Build sanitized update object with only allowed top-level fields (do NOT include createdAt/updatedAt)
    const updatePayload: any = {
      fileId: validated.fileId,
      fileName: validated.fileName,
      vendor: {
        name: validated.vendor.name,
        address: validated.vendor.address ?? undefined,
        taxId: validated.vendor.taxId ?? undefined,
      },
      invoice: {
        number: validated.invoice.number,
        date: validated.invoice.date,
        currency: validated.invoice.currency ?? undefined,
        subtotal: validated.invoice.subtotal ?? undefined,
        taxPercent: validated.invoice.taxPercent ?? undefined,
        total: validated.invoice.total ?? undefined,
        poNumber: validated.invoice.poNumber ?? undefined,
        poDate: validated.invoice.poDate ?? undefined,
        lineItems: validated.invoice.lineItems ?? [],
      },
    };

    // Persist changes (runValidators ensures mongoose schema validations)
    const updated = await Invoice.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
      context: "query",
    });

    return res.json(updated);
  } catch (err: any) {
    // Zod validation error
    if (err?.issues) {
      return res.status(400).json({ error: "Validation failed", details: err.issues });
    }

    console.error("updateInvoice error:", err);
    return res.status(500).json({ error: "Failed to update invoice", message: err.message });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: "Failed to delete invoice" });
  }
};
