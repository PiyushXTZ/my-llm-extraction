// apps/api/src/utils/validation.ts
import { z } from "zod";

export const LineItemSchema = z.object({
  description: z.string().min(1),
  unitPrice: z.coerce.number().nonnegative(),
  quantity: z.coerce.number().int().nonnegative(),
  total: z.coerce.number().nonnegative(),
});

export const InvoicePayloadSchema = z.object({
  fileId: z.string().url().or(z.string()), // allow url-like or plain string
  fileName: z.string().min(1),
  vendor: z.object({
    name: z.string().min(1),
    address: z.string().optional().nullable(),
    taxId: z.string().optional().nullable(),
  }),
  invoice: z.object({
    number: z.string().min(1),
    date: z.string().min(1), // keep as ISO-like string; validate further if needed
    currency: z.string().optional().nullable(),
    subtotal: z.coerce.number().optional().nullable(),
    taxPercent: z.coerce.number().optional().nullable(),
    total: z.coerce.number().optional().nullable(),
    poNumber: z.string().optional().nullable(),
    poDate: z.string().optional().nullable(),
    lineItems: z.array(LineItemSchema).optional().default([]),
  }),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// For updates: allow partials (client may send only changed fields)
export const InvoiceUpdateSchema = InvoicePayloadSchema.partial({
  fileId: true,
  fileName: true,
  vendor: true,
  invoice: true,
  createdAt: true,
  updatedAt: true,
});
