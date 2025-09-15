"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

// UI Components from shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import PDFViewer from "@/components/pdfviewer";

type LineItem = {
  description: string;
  unitPrice: number;
  quantity: number;
  total: number;
};

type InvoiceShape = {
  _id?: string;
  fileId: string;
  fileName: string;
  vendor: { name: string; address?: string; taxId?: string };
  invoice: {
    number: string;
    date: string;
    currency?: string;
    subtotal?: number;
    taxPercent?: number;
    total?: number;
    poNumber?: string;
    poDate?: string;
    lineItems: LineItem[];
  };
  createdAt?: string;
  updatedAt?: string;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Helper to format dates for display and input fields
function formatDate(dateString?: string, forInput = false) {
  if (!dateString) return "";
  try {
    const date = parseISO(dateString);
    return forInput ? format(date, "yyyy-MM-dd") : format(date, "MMMM d, yyyy");
  } catch {
    return dateString;
  }
}

export default function InvoiceDetailPage() {
  const params = useParams() as { id?: string };
  const router = useRouter();
  const id = params?.id;
  const [invoice, setInvoice] = useState<InvoiceShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchInvoice = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/invoices/${encodeURIComponent(id)}`);
        const body = await res.json();
        if (!res.ok) {
          toast.error(body?.error || "Failed to load invoice");
          setInvoice(null);
        } else {
          setInvoice(body);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        toast.error(message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  // Field setters (unchanged logic)
  const setVendorField = (key: keyof InvoiceShape["vendor"], value: any) => {
    setInvoice((prev) => (prev ? { ...prev, vendor: { ...prev.vendor, [key]: value } } : null));
  };
  const setInvoiceField = (key: keyof InvoiceShape["invoice"], value: any) => {
    setInvoice((prev) => (prev ? { ...prev, invoice: { ...prev.invoice, [key]: value } } : null));
  };
  const setLineItem = (index: number, patch: Partial<LineItem>) => {
    setInvoice((prev) => {
      if (!prev) return null;
      const items = [...(prev.invoice.lineItems ?? [])];
      items[index] = { ...(items[index] || {}), ...patch };
      return { ...prev, invoice: { ...prev.invoice, lineItems: items } };
    });
  };
  const addLineItem = () => {
    setInvoice((prev) =>
      prev
        ? {
            ...prev,
            invoice: {
              ...prev.invoice,
              lineItems: [...(prev.invoice.lineItems ?? []), { description: "", unitPrice: 0, quantity: 1, total: 0 }],
            },
          }
        : null
    );
  };
  const removeLineItem = (index: number) => {
    setInvoice((prev) => {
      if (!prev) return null;
      const items = prev.invoice.lineItems.filter((_, i) => i !== index);
      return { ...prev, invoice: { ...prev.invoice, lineItems: items } };
    });
  };

  // Recalculate totals when line items change
  useEffect(() => {
    if (!invoice?.invoice?.lineItems) return;

    const subtotal = invoice.invoice.lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const tax = subtotal * ((invoice.invoice.taxPercent || 0) / 100);
    const total = subtotal + tax;

    setInvoice((prev) =>
      prev ? { ...prev, invoice: { ...prev.invoice, subtotal, total } } : null
    );
  }, [invoice?.invoice?.lineItems, invoice?.invoice?.taxPercent]);

  // Save (PUT)
  const handleSave = async () => {
    if (!invoice || !id) return;
    setSaving(true);
    const promise = fetch(`${API}/invoices/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoice),
    }).then(async (res) => {
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Save failed");
      setInvoice(body);
      return body;
    });

    toast.promise(promise, {
      loading: "Saving invoice...",
      success: "Invoice saved successfully!",
      error: (err: unknown) => (err instanceof Error ? err.message : String(err)),
      finally: () => setSaving(false),
    });
  };

  // Delete
  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    const promise = fetch(`${API}/invoices/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error || "Delete failed");
      }
      return { ok: true };
    });

    toast.promise(promise, {
      loading: "Deleting invoice...",
      success: () => {
        router.push("/invoices");
        return "Invoice deleted.";
      },
      error: (err: unknown) => (err instanceof Error ? err.message : String(err)),
      finally: () => setDeleting(false),
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Invoice not found.
        <Button variant="link" onClick={() => router.push("/invoices")}>
          Go back to list
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Invoice Detail</h1>
          <p className="text-muted-foreground">View and edit invoice data.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/invoices")}>
            Back to List
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ✅ FIX: Changed from lg:col-span-7 to lg:col-span-8 for more width */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader><CardTitle>Invoice Document</CardTitle></CardHeader>
            <CardContent>
              {/* ✅ FIX: Changed from h-[70vh] to h-[85vh] for more height */}
              <div className="border rounded-md overflow-hidden h-[85vh]">
                <PDFViewer initialUrl={invoice.fileId} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ✅ FIX: Changed from lg:col-span-5 to lg:col-span-4 to adjust layout */}
        <div className="lg:col-span-4">
          <Card className="flex flex-col max-h-[92vh]">
            <CardHeader>
              <CardTitle>Extracted Data</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto pr-4 space-y-6">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="vendor-name">Vendor Name</Label>
                <Input id="vendor-name" value={invoice.vendor.name ?? ""} onChange={(e) => setVendorField("name", e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="invoice-number">Invoice #</Label>
                  <Input id="invoice-number" value={invoice.invoice.number ?? ""} onChange={(e) => setInvoiceField("number", e.target.value)} />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="invoice-date">Date</Label>
                  <Input id="invoice-date" type="date" value={formatDate(invoice.invoice.date, true)} onChange={(e) => setInvoiceField("date", e.target.value)} />
                </div>
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="po-number">PO Number</Label>
                <Input id="po-number" value={invoice.invoice.poNumber ?? ""} onChange={(e) => setInvoiceField("poNumber", e.target.value)} />
              </div>

              <div>
                <Label>Line Items</Label>
                <div className="space-y-3">
                  {(invoice.invoice.lineItems ?? []).map((item, idx) => (
                    <div key={idx} className="p-3 border rounded-md space-y-2 relative">
                       <Input placeholder="Description" value={item.description} onChange={(e) => setLineItem(idx, { description: e.target.value })} />
                       <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs font-normal text-muted-foreground">Qty</Label>
                            <Input type="number" value={item.quantity} onChange={(e) => setLineItem(idx, { quantity: +e.target.value, total: +e.target.value * (item.unitPrice || 0) })} />
                          </div>
                          <div>
                            <Label className="text-xs font-normal text-muted-foreground">Unit Price</Label>
                            <Input type="number" value={item.unitPrice} onChange={(e) => setLineItem(idx, { unitPrice: +e.target.value, total: +e.target.value * (item.quantity || 0) })} />
                          </div>
                          <div>
                            <Label className="text-xs font-normal text-muted-foreground">Total</Label>
                            <Input type="number" value={item.total} onChange={(e) => setLineItem(idx, { total: +e.target.value })} />
                          </div>
                       </div>
                       <div className="absolute top-1 right-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeLineItem(idx)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                       </div>
                    </div>
                  ))}
                </div>
                 <Button variant="outline" size="sm" className="mt-3" onClick={addLineItem}>+ Add Item</Button>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t pt-6">
                 <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="subtotal">Subtotal</Label>
                  <Input id="subtotal" type="number" value={invoice.invoice.subtotal?.toFixed(2) ?? ""} onChange={(e) => setInvoiceField("subtotal", +e.target.value)} />
                </div>
                 <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="tax">Tax %</Label>
                  <Input id="tax" type="number" value={invoice.invoice.taxPercent ?? ""} onChange={(e) => setInvoiceField("taxPercent", +e.target.value)} />
                </div>
                 <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="total" className="font-semibold">Total</Label>
                  <Input id="total" type="number" value={invoice.invoice.total?.toFixed(2) ?? ""} onChange={(e) => setInvoiceField("total", +e.target.value)} className="font-semibold"/>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center text-sm text-muted-foreground pt-4 border-t">
              <div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Invoice</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone. This will permanently delete the invoice.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                        {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div>
                <p>Updated: {formatDate(invoice.updatedAt)}</p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
