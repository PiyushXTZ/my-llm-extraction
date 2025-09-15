"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import PDFViewer from "@/components/pdfviewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UploadCloud, Wand2, Save, Trash2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { produce } from "immer";

// --- All your types, constants, and helper functions remain exactly the same ---
type LineItem = { description: string; unitPrice: number; quantity: number; total: number; };
type InvoiceShape = { _id: string; fileId: string; fileName: string; vendor: { name: string; address?: string; taxId?: string; }; invoice: { number: string; date: string; currency?: string; subtotal?: number; taxPercent?: number; total?: number; poNumber?: string; poDate?: string; lineItems: LineItem[]; }; };
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) return dateString.split('.').reverse().join('-');
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return dateString.split('/').reverse().join('-');
  return dateString;
};

function normalizeLineItem(li: unknown): LineItem {
  const rec = li as Partial<LineItem> | Record<string, unknown>;
  const quantity = Math.max(1, Number((rec as any).quantity) || 1);
  const unitPrice = Number((rec as any).unitPrice) || 0;
  const total = Number((rec as any).total) || unitPrice * quantity;
  return {
    description: String((rec as any).description ?? ""),
    unitPrice,
    quantity,
    total,
  };
}

function ReviewPageContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("id");

  // --- All your state hooks remain exactly the same ---
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Partial<InvoiceShape> | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [loadingExtract, setLoadingExtract] = useState(false);

  // --- All your logic functions and useEffect hooks remain exactly the same ---
  useEffect(() => {
    if (invoiceId) {
      const fetchInvoiceForEdit = async () => {
        const promise = fetch(`${API}/invoices/${invoiceId}`).then(res => {
          if (!res.ok) throw new Error("Failed to load invoice.");
          return res.json();
        });
        
        toast.promise(promise, {
          loading: "Loading invoice for editing...",
          success: (body) => {
            const data = (body as any).data ?? body; // API may wrap in { data }
            if (data?.invoice?.date) {
              data.invoice.date = formatDate(data.invoice.date);
            }
            if (Array.isArray(data?.invoice?.lineItems)) {
              data.invoice.lineItems = data.invoice.lineItems.map(normalizeLineItem);
            } else {
              data.invoice = data.invoice ?? { lineItems: [] };
            }
            setInvoice(data);
            setFileUrl(data.fileId);
            setFileName(data.fileName);
            setSavedId(data._id);
            return "Invoice loaded successfully!";
          },
          error: "Error: Failed to load invoice.",
        });
      };
      fetchInvoiceForEdit();
    }
  }, [invoiceId]);

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) {
      toast.error("File too large", { description: "Maximum file size is 25MB." });
      return;
    }
    setUploading(true);
    const toastId = toast.loading("Uploading PDF...");
    const fd = new FormData();
    fd.append("file", f);
    try {
      const res = await fetch(`${API}/upload`, { method: "POST", body: fd });
      const body = await res.json();
      if (!res.ok) throw new Error((body as any)?.error || "Upload failed");
      setFileUrl((body as any).fileId);
      setFileName((body as any).fileName);
      setInvoice(null);
      setSavedId(null);
      toast.success("Upload complete!", { id: toastId, description: "Ready to extract data." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Upload failed", { id: toastId, description: message });
    } finally {
      setUploading(false);
    }
  }

  async function handleExtract() {
    if (!fileUrl || !fileName) {
      toast.warning("Upload a PDF first.");
      return;
    }
    setLoadingExtract(true);
    const toastId = toast.loading("Extracting data with AI...");
    try {
      const res = await fetch(`${API}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: fileUrl, fileName }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error((body as any)?.error || "Extraction failed");
      const data = (body as any)?.data ?? body;
      if (data?.invoice?.date) {
        data.invoice.date = formatDate(data.invoice.date);
      }
      if (!data.invoice) data.invoice = { lineItems: [] };
      if (!Array.isArray(data.invoice.lineItems)) data.invoice.lineItems = [];
      data.invoice.lineItems = data.invoice.lineItems.map(normalizeLineItem);
      setInvoice(data);
      toast.success("Extraction complete!", { id: toastId, description: "You can now edit the fields." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Extraction failed", { id: toastId, description: message });
    } finally {
      setLoadingExtract(false);
    }
  }

  function setVendorField<K extends keyof InvoiceShape["vendor"]>(key: K, value: string) {
    setInvoice(
      produce((draft) => {
        // Safely update a nested property. No need to worry about nulls.
        if (draft?.vendor) {
          (draft.vendor as any)[key] = value;
        }
      })
    );
  }

  function setInvoiceField<K extends keyof InvoiceShape["invoice"]>(key: K, value: string | number | undefined) {
    setInvoice(
      produce((draft) => {
        if (draft?.invoice) {
          (draft.invoice as any)[key] = value;
        }
      })
    );
  }

  function setLineItem(index: number, patch: Partial<LineItem>) {
    setInvoice(
      produce((draft) => {
        // Directly access and modify the item in the array.
        const item = draft?.invoice?.lineItems?.[index];
        if (item) {
          Object.assign(item, patch); // Apply all changes from the patch
          item.quantity = Math.max(1, item.quantity || 1); // Enforce quantity rule
        }
      })
    );
  }

  function addLineItem() {
    setInvoice(
      produce((draft) => {
        // Use standard array methods like .push()
        if (draft?.invoice?.lineItems) {
          draft.invoice.lineItems.push({
            description: "",
            unitPrice: 0,
            quantity: 1,
            total: 0,
          });
        }
      })
    );
  }

  function removeLineItem(index: number) {
    setInvoice(
      produce((draft) => {
        // Use standard array methods like .splice()
        if (draft?.invoice?.lineItems) {
          draft.invoice.lineItems.splice(index, 1);
        }
      })
    );
  }
  useEffect(() => {
    if (!invoice?.invoice?.lineItems) return;
    const subtotal = invoice.invoice.lineItems.reduce((s, li) => {
      const lineTotal = Number(li.total) || (Number(li.unitPrice) * Number(li.quantity) || 0);
      return s + lineTotal;
    }, 0);
    setInvoice((prev) => prev ? { ...prev, invoice: { ...prev.invoice!, subtotal } } : prev);
  }, [invoice?.invoice?.lineItems]);

  async function handleSave() {
    if (!invoice) return toast.warning("Nothing to save.");
    const promise = fetch(`${API}/invoices`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(invoice), }).then(async (res) => { const body = await res.json(); if (!res.ok) throw new Error((body as any)?.error || "Save failed"); return body; });
    toast.promise(promise, { loading: "Saving invoice...", success: (body) => { setSavedId((body as any)._id ?? (body as any).id ?? null); return "Invoice saved successfully!"; }, error: (err: unknown) => (err instanceof Error ? err.message : String(err)), });
  }
  async function handleUpdate() {
    if (!savedId || !invoice) return toast.warning("No saved invoice to update.");
    const promise = fetch(`${API}/invoices/${savedId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(invoice), }).then(async (res) => { if (!res.ok) { const body = await res.json(); throw new Error((body as any)?.error || "Update failed"); } return res.json(); });
    toast.promise(promise, { loading: "Updating invoice...", success: "Invoice updated successfully!", error: (err: unknown) => (err instanceof Error ? err.message : String(err)), });
  }
  async function handleDelete() {
    if (!savedId) return toast.warning("No saved invoice to delete.");
    toast("Are you sure you want to delete this invoice?", {
      duration: 10000,
      action: { label: "Confirm Delete", onClick: () => {
        const promise = fetch(`${API}/invoices/${savedId}`, { method: "DELETE" }).then(async (res) => { if (!res.ok) { const body = await res.json(); throw new Error((body as any)?.error || "Delete failed"); } });
        toast.promise(promise, { loading: "Deleting invoice...", success: () => { setInvoice(null); setSavedId(null); setFileUrl(null); setFileName(null); return "Invoice deleted successfully."; }, error: (err: unknown) => (err instanceof Error ? err.message : String(err)), });
      }},
      cancel: {
      label: "Cancel",
      onClick: () => {}, // ✅ FIX: Added the required onClick handler
    }
    });
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{invoiceId ? "Edit Invoice" : "Create New Invoice"}</h1>
          <p className="text-muted-foreground">Upload, extract, review, and save.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/invoices"><ArrowLeft className="mr-2 h-4 w-4" />Back to List</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* --- UI SIMPLIFICATION STARTS HERE --- */}
        <div className="lg:col-span-7">
          <Card className="h-full">
            <CardHeader><CardTitle>PDF Preview</CardTitle></CardHeader>
            <CardContent>
              {fileUrl ? (
                <div className="h-[75vh] border rounded-md"><PDFViewer initialUrl={fileUrl} /></div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg min-h-[600px]">
                  <UploadCloud className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Upload a PDF to Begin</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Your document will be displayed here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Data</CardTitle>
              <CardDescription>Upload a file, extract its content, then review below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[75vh] overflow-y-auto p-4">
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="pdf-upload">1. Upload PDF</Label>
                  <Input id="pdf-upload" type="file" accept="application/pdf" onChange={uploadFile} disabled={uploading} />
                </div>
                <Button onClick={handleExtract} disabled={!fileUrl || loadingExtract || uploading} className="w-full">
                  {loadingExtract ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  2. Extract with AI
                </Button>
              </div>

              <Separator />
              
              {!invoice ? (
                <div className="text-sm text-center text-muted-foreground py-10">Data will appear here after extraction.</div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Vendor Name</Label><Input value={invoice.vendor?.name ?? ""} onChange={(e) => setVendorField("name", e.target.value)} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Invoice #</Label><Input value={invoice.invoice?.number ?? ""} onChange={(e) => setInvoiceField("number", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Date</Label><Input type="date" value={invoice.invoice?.date ?? ""} onChange={(e) => setInvoiceField("date", e.target.value)} /></div>
                  </div>
                  <div>
                    <Label>Line Items</Label>
                    <div className="space-y-2 pt-2">
                      {(invoice.invoice?.lineItems ?? []).map((li, idx) => (
                        <div key={idx} className="p-3 border rounded-md space-y-2">
                          <Input value={li.description} placeholder="Description" onChange={(e) => setLineItem(idx, { description: e.target.value })} />
                          <div className="flex gap-2 items-center">
                            <Input value={String(li.unitPrice)} onChange={(e) => setLineItem(idx, { unitPrice: Number(e.target.value), total: Number(e.target.value) * Number(li.quantity) })} type="number" placeholder="Price" />
                            <Input value={String(li.quantity)} onChange={(e) => { const q = Math.max(1, Number(e.target.value) || 1); setLineItem(idx, { quantity: q, total: Number(li.unitPrice) * q }); }} type="number" placeholder="Qty" />
                            <Input value={String(li.total)} onChange={(e) => setLineItem(idx, { total: Number(e.target.value) })} type="number" placeholder="Total" />
                            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeLineItem(idx)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                          </div>
                        </div>
                      ))}
                      <Button onClick={addLineItem} variant="outline" className="w-full">+ Add Line Item</Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Subtotal</Label><Input value={String(invoice.invoice?.subtotal ?? "")} type="number" readOnly className="font-medium"/></div>
                    <div className="space-y-2"><Label>Tax %</Label><Input value={String(invoice.invoice?.taxPercent ?? "")} onChange={(e) => setInvoiceField("taxPercent", Number(e.target.value))} type="number" /></div>
                    <div className="space-y-2"><Label>Total</Label><Input value={String(invoice.invoice?.total ?? "")} onChange={(e) => setInvoiceField("total", Number(e.target.value))} type="number" /></div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2 justify-end pt-4 border-t">
              {savedId && <Button variant="destructive" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>}
              {savedId
                ? <Button onClick={handleUpdate} disabled={!invoice}><Save className="mr-2 h-4 w-4"/>Update</Button>
                : <Button onClick={handleSave} disabled={!invoice}><Save className="mr-2 h-4 w-4"/>Save</Button>
              }
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ReviewPageContent />
    </Suspense>
  );
}
