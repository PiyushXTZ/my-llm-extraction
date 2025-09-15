"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner"; // REFACTOR: Import toast
import PDFViewer from "@/components/pdfviewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Save, Trash2, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";

// ... (Your types and helper functions remain the same)
type LineItem = { description: string; unitPrice: number; quantity: number; total: number; };
type InvoiceShape = { _id?: string; fileId: string; fileName: string; vendor: { name: string; address?: string; taxId?: string; }; invoice: { number: string; date: string; currency?: string; subtotal?: number; taxPercent?: number; total?: number; poNumber?: string; poDate?: string; lineItems: LineItem[]; }; createdAt?: string; updatedAt?: string; };
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
function formatDateForInput(d?: string) { if (!d) return ""; try { return new Date(d).toISOString().slice(0, 10); } catch { return d; } }

export default function InvoiceDetailPage() {
  const params = useParams() as { id?: string };
  const router = useRouter();
  const id = params?.id;
  
  const [invoice, setInvoice] = useState<InvoiceShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false); // For delete confirmation

  // REFACTOR: The message and error states are no longer needed
  // const [message, setMessage] = useState<string | null>(null);
  // const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const promise = fetch(`${API}/invoices/${id}`).then(res => {
        if (!res.ok) throw new Error("Failed to load invoice");
        return res.json();
    });

    toast.promise(promise, {
        loading: "Loading invoice...",
        success: (data) => {
            setInvoice(data);
            setLoading(false);
            return "Invoice loaded successfully.";
        },
        error: (err) => {
            setLoading(false);
            return err.message;
        }
    });
  }, [id]);

  // ... (All your field setters like setVendorField remain unchanged)
  function setVendorField<K extends keyof InvoiceShape["vendor"]>(key: K, value: any) { setInvoice((prev) => (prev ? { ...prev, vendor: { ...prev.vendor, [key]: value } } : prev)); }
  function setInvoiceField<K extends keyof InvoiceShape["invoice"]>(key: K, value: any) { setInvoice((prev) => (prev ? { ...prev, invoice: { ...prev.invoice, [key]: value } } : prev)); }
  function setLineItem(index: number, patch: Partial<LineItem>) { setInvoice((prev) => { if (!prev) return prev; const items = [...(prev.invoice?.lineItems ?? [])]; items[index] = { ...(items[index] ?? { description: "", quantity: 1, unitPrice: 0, total: 0 }), ...patch }; return { ...prev, invoice: { ...prev.invoice, lineItems: items } }; }); }
  function addLineItem() { setInvoice((prev) => prev ? { ...prev, invoice: { ...prev.invoice, lineItems: [...(prev.invoice.lineItems ?? []), { description: "", unitPrice: 0, quantity: 1, total: 0 }] } } : prev); }
  function removeLineItem(i: number) { setInvoice((prev) => { if (!prev) return prev; const items = [...(prev.invoice.lineItems ?? [])]; items.splice(i, 1); return { ...prev, invoice: { ...prev.invoice, lineItems: items } }; }); }
  useEffect(() => { if (!invoice?.invoice?.lineItems) return; const subtotal = invoice.invoice.lineItems.reduce((s, li) => s + (Number(li.total) || 0), 0); setInvoice((prev) => (prev ? { ...prev, invoice: { ...prev.invoice, subtotal } } : prev)); }, [invoice?.invoice?.lineItems]);


  async function handleSave() {
    if (!invoice || !id) return;
    setSaving(true);
    const promise = fetch(`${API}/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoice),
    }).then(async (res) => {
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Save failed");
      return body;
    });

    toast.promise(promise, {
      loading: "Saving changes...",
      success: (data) => { setInvoice(data); return "Invoice saved successfully!"; },
      error: (err) => err.message,
      finally: () => setSaving(false),
    });
  }

  async function handleDelete() {
    if (!id) return;
    setIsAlertOpen(false); // Close the dialog first
    const promise = fetch(`${API}/invoices/${id}`, { method: "DELETE" }).then(res => {
        if (!res.ok) throw new Error("Delete failed");
    });
    
    toast.promise(promise, {
        loading: "Deleting invoice...",
        success: () => { router.push("/invoices"); return "Invoice deleted."; },
        error: (err) => err.message,
    });
  }

  if (loading) {
    return <div className="p-10 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>;
  }
  if (!invoice) {
    return <div className="p-10 text-center text-destructive">Invoice not found or failed to load.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Invoice</h1>
          <p className="text-muted-foreground">Invoice #{invoice.invoice.number}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/invoices")}><ArrowLeft className="mr-2 h-4 w-4" />Back to List</Button>
          <Button onClick={() => setIsAlertOpen(true)} variant="destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
            Save Changes
          </Button>
        </div>
      </div>
      
      {/* REFACTOR: The message/error divs are no longer needed */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <Card className="h-full">
            <CardHeader><CardTitle>PDF Preview</CardTitle></CardHeader>
            <CardContent><PDFViewer initialUrl={invoice.fileId} /></CardContent>
          </Card>
        </div>
        <div className="lg:col-span-5">
          <Card>
            <CardHeader><CardTitle>Invoice Data</CardTitle><CardDescription>Edit the fields below.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <Separator />
              <div className="space-y-2"><Label>Vendor Name</Label><Input value={invoice.vendor.name} onChange={(e) => setVendorField("name", e.g.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Invoice #</Label><Input value={invoice.invoice.number} onChange={(e) => setInvoiceField("number", e.target.value)} /></div>
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={formatDateForInput(invoice.invoice.date)} onChange={(e) => setInvoiceField("date", e.target.value)} /></div>
              </div>
              <div>
                <Label>Line Items</Label>
                <div className="space-y-2 pt-2">
                  {(invoice.invoice?.lineItems ?? []).map((li, idx) => (
                    <Card key={idx} className="p-3">
                      <Input value={li.description} placeholder="Description" onChange={(e) => setLineItem(idx, { description: e.target.value })} className="mb-2" />
                      <div className="flex gap-2">
                        <Input value={String(li.unitPrice ?? 0)} onChange={(e) => setLineItem(idx, { unitPrice: Number(e.target.value), total: Number(e.target.value) * Number(li.quantity ?? 0) })} type="number" placeholder="Price"/>
                        <Input value={String(li.quantity ?? 0)} onChange={(e) => setLineItem(idx, { quantity: Number(e.target.value), total: Number(li.unitPrice ?? 0) * Number(e.target.value) })} type="number" placeholder="Qty"/>
                        <Input value={String(li.total ?? 0)} onChange={(e) => setLineItem(idx, { total: Number(e.target.value) })} type="number" placeholder="Total" />
                        <Button variant="ghost" size="icon" onClick={() => removeLineItem(idx)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                      </div>
                    </Card>
                  ))}
                  <Button onClick={addLineItem} variant="outline" className="w-full">+ Add Line Item</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* REFACTOR: Add the AlertDialog for delete confirmation */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-destructive" />Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. This will permanently delete the invoice.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Yes, delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}