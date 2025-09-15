"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import PDFViewer from "@/components/pdfviewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UploadCloud, Wand2, Save, Trash2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

type LineItem = { description: string; unitPrice: number; quantity: number; total: number; };
type InvoiceShape = { _id: string; fileId: string; fileName: string; vendor: { name: string; address?: string; taxId?: string; }; invoice: { number: string; date: string; currency?: string; subtotal?: number; taxPercent?: number; total?: number; poNumber?: string; poDate?: string; lineItems: LineItem[]; }; };

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// FIX 2 (from previous): Helper function to convert date strings to yyyy-MM-dd
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) return dateString.split('.').reverse().join('-');
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return dateString.split('/').reverse().join('-');
  return dateString;
};


function ReviewPageContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("id");

  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Partial<InvoiceShape> | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [loadingExtract, setLoadingExtract] = useState(false);

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
            const data = body.data ?? body;
            if (data?.invoice?.date) {
              data.invoice.date = formatDate(data.invoice.date);
            }

            // normalize line items so quantity is at least 1
            if (Array.isArray(data?.invoice?.lineItems)) {
              data.invoice.lineItems = data.invoice.lineItems.map((li: any) => {
                const quantity = Math.max(1, Number(li.quantity) || 1);
                const unitPrice = Number(li.unitPrice) || 0;
                const total = Number(li.total) || unitPrice * quantity;
                return { ...li, quantity, unitPrice, total };
              });
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
      if (!res.ok) throw new Error(body?.error || "Upload failed");

      setFileUrl(body.fileId);
      setFileName(body.fileName);
      setInvoice(null);
      setSavedId(null);
      toast.success("Upload complete!", { id: toastId, description: "Ready to extract data." });
    } catch (err: any) {
      toast.error("Upload failed", { id: toastId, description: err.message });
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
      if (!res.ok) throw new Error(body?.error || "Extraction failed");
      
      const data = body?.data ?? body;
      if (data?.invoice?.date) {
        data.invoice.date = formatDate(data.invoice.date);
      }
      if (!data.invoice) data.invoice = { lineItems: [] };
      if (!Array.isArray(data.invoice.lineItems)) data.invoice.lineItems = [];

      // normalize extracted line items: quantity >= 1, numeric unitPrice and total
      data.invoice.lineItems = data.invoice.lineItems.map((li: any) => {
        const quantity = Math.max(1, Number(li.quantity) || 1);
        const unitPrice = Number(li.unitPrice) || 0;
        const total = Number(li.total) || unitPrice * quantity;
        return { ...li, quantity, unitPrice, total };
      });

      setInvoice(data);
      toast.success("Extraction complete!", { id: toastId, description: "You can now edit the fields." });
    } catch (err: any) {
      toast.error("Extraction failed", { id: toastId, description: err.message });
    } finally {
      setLoadingExtract(false);
    }
  }

  function setVendorField<K extends keyof InvoiceShape["vendor"]>(key: K, value: any) { setInvoice((prev) => ({ ...(prev ?? {}), vendor: { ...(prev?.vendor ?? {}), [key]: value } })); }
  function setInvoiceField<K extends keyof InvoiceShape["invoice"]>(key: K, value: any) { setInvoice((prev) => ({ ...(prev ?? {}), invoice: { ...(prev?.invoice ?? {}), [key]: value } })); }

  function setLineItem(index: number, patch: Partial<LineItem>) {
    setInvoice((prev) => {
      const items = prev?.invoice?.lineItems ? [...prev!.invoice!.lineItems] : [];
      items[index] = {
        ...(items[index] ?? { description: "", unitPrice: 0, quantity: 1, total: 0 }),
        ...patch,
        // ensure quantity can't be below 1 if patch includes quantity
        quantity: Math.max(1, Number((patch as Partial<LineItem>).quantity ?? items[index]?.quantity ?? 1)),
      };
      return { ...(prev ?? {}), invoice: { ...(prev?.invoice ?? {}), lineItems: items } };
    });
  }

  function addLineItem() { setInvoice((prev) => ({ ...(prev ?? {}), invoice: { ...(prev?.invoice ?? {}), lineItems: [...(prev?.invoice?.lineItems ?? []), { description: "", unitPrice: 0, quantity: 1, total: 0 }] } })); }
  function removeLineItem(i: number) { setInvoice((prev) => { const items = [...(prev?.invoice?.lineItems ?? [])]; items.splice(i, 1); return { ...(prev ?? {}), invoice: { ...(prev?.invoice ?? {}), lineItems: items } }; }); }

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
    const promise = fetch(`${API}/invoices`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(invoice), }).then(async (res) => { const body = await res.json(); if (!res.ok) throw new Error(body?.error || "Save failed"); return body; });
    toast.promise(promise, { loading: "Saving invoice...", success: (body) => { setSavedId(body._id ?? body.id ?? null); return "Invoice saved successfully!"; }, error: (err) => err.message, });
  }
  
  async function handleUpdate() {
    if (!savedId || !invoice) return toast.warning("No saved invoice to update.");
    const promise = fetch(`${API}/invoices/${savedId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(invoice), }).then(async (res) => { if (!res.ok) { const body = await res.json(); throw new Error(body?.error || "Update failed"); } return res.json(); });
    toast.promise(promise, { loading: "Updating invoice...", success: "Invoice updated successfully!", error: (err) => err.message, });
  }

  // FIX 1: Use a Sonner toast for delete confirmation instead of window.confirm
  async function handleDelete() {
    if (!savedId) return toast.warning("No saved invoice to delete.");
    
    toast("Are you sure you want to delete this invoice?", {
      duration: 10000,
      action: {
        label: "Confirm Delete",
        onClick: () => {
          const promise = fetch(`${API}/invoices/${savedId}`, { method: "DELETE" }).then(async (res) => {
            if (!res.ok) {
              const body = await res.json();
              throw new Error(body?.error || "Delete failed");
            }
          });

          toast.promise(promise, {
            loading: "Deleting invoice...",
            success: () => {
              setInvoice(null); setSavedId(null); setFileUrl(null); setFileName(null);
              return "Invoice deleted successfully.";
            },
            error: (err) => err.message,
          });
        }
      },
      cancel: {
        label: "Cancel"
      }
    });
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{invoiceId ? "Edit Invoice" : "Create New Invoice"}</h1>
        <p className="text-muted-foreground">Upload a PDF, extract data with AI, then review and save.</p>
        <div className="flex items-center gap-2 ">
        <Button variant="outline" asChild>
            <Link href="/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
            </Link>
        </Button>
    </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>PDF Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {fileUrl ? (
                <PDFViewer initialUrl={fileUrl} />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-[600px]">
                  <UploadCloud className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Upload a PDF to Begin</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Your document will be displayed here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Start by uploading a file, then extract its content.</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="pdf-upload">1. Upload PDF</Label>
                <Input id="pdf-upload" type="file" accept="application/pdf" onChange={uploadFile} disabled={uploading} />
              </div>
              <Button onClick={handleExtract} disabled={!fileUrl || loadingExtract || uploading} className="w-full">
                {loadingExtract ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                2. Extract with AI
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Extracted Data</CardTitle>
              <CardDescription>Review and edit the fields below before saving.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
              {!invoice ? (
                <div className="text-sm text-center text-muted-foreground py-10">Data will appear here after extraction.</div>
              ) : (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Vendor Name</Label>
                    <Input value={invoice.vendor?.name ?? ""} onChange={(e) => setVendorField("name", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"> <Label>Invoice #</Label> <Input value={invoice.invoice?.number ?? ""} onChange={(e) => setInvoiceField("number", e.target.value)} /> </div>
                    <div className="space-y-2"> <Label>Date</Label> <Input type="date" value={invoice.invoice?.date ?? ""} onChange={(e) => setInvoiceField("date", e.target.value)} /> </div>
                  </div>
                  <div>
                    <Label>Line Items</Label>
                    <div className="space-y-2 pt-2">
                      {(invoice.invoice?.lineItems ?? []).map((li, idx) => (
                        <Card key={idx} className="p-3">
                          <Input value={li.description} placeholder="Description" onChange={(e) => setLineItem(idx, { description: e.target.value })} className="mb-2" />
                          <div className="flex gap-2">
                            <Input value={String(li.unitPrice)} onChange={(e) => setLineItem(idx, { unitPrice: Number(e.target.value), total: Number(e.target.value) * Number(li.quantity) })} type="number" placeholder="Price" onWheel={(e) => (e.target as HTMLInputElement).blur()}/>
                            <Input
                              value={String(li.quantity)}
                              onChange={(e) => {
                                const raw = Number(e.target.value) || 0;
                                const q = Math.max(1, raw);
                                setLineItem(idx, { quantity: q, total: Number(li.unitPrice) * q });
                              }}
                              type="number"
                              placeholder="Qty"
                              onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            />
                            <Input value={String(li.total)} onChange={(e) => setLineItem(idx, { total: Number(e.target.value) })} type="number" placeholder="Total" onWheel={(e) => (e.target as HTMLInputElement).blur()} />
                            <Button variant="ghost" size="icon" onClick={() => removeLineItem(idx)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                          </div>
                        </Card>
                      ))}
                      <Button onClick={addLineItem} variant="outline" className="w-full">+ Add Line Item</Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2"> <Label>Subtotal</Label> <Input value={String(invoice.invoice?.subtotal ?? "")} type="number" readOnly className="font-medium"/></div>
                      <div className="space-y-2"> <Label>Tax %</Label> <Input value={String(invoice.invoice?.taxPercent ?? "")} onChange={(e) => setInvoiceField("taxPercent", Number(e.target.value))} type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} /></div>
                      <div className="space-y-2"> <Label>Total</Label> <Input value={String(invoice.invoice?.total ?? "")} onChange={(e) => setInvoiceField("total", Number(e.target.value))} type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} /></div>
                  </div>
                  <Separator />
                  <div className="flex gap-2 justify-end">
                    {savedId && <Button variant="destructive" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>}
                    {savedId 
                      ? <Button onClick={handleUpdate}><Save className="mr-2 h-4 w-4"/>Update</Button>
                      : <Button onClick={handleSave}><Save className="mr-2 h-4 w-4"/>Save</Button>
                    }
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReviewPageContent />
    </Suspense>
  );
}
