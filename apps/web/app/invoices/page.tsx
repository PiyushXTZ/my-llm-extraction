"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// REFACTOR: Import AlertDialog components
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, PlusCircle, RefreshCw, XCircle, FileText, Loader2, AlertTriangle } from "lucide-react";

// ... (Invoice type and API constant remain the same)
type Invoice = { _id?: string; fileId: string; fileName: string; vendor: { name: string; }; invoice: { number: string; date: string; currency?: string; total?: number; }; createdAt?: string; };
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function InvoicesListPage() {
  const [q, setQ] = useState("");
  const [rawQuery, setRawQuery] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // REFACTOR: State for controlling the confirmation dialog
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [invoiceToDeleteId, setInvoiceToDeleteId] = useState<string | null>(null);
  
  // ... (useEffect for search and data loading remains the same)
  useEffect(() => { const t = setTimeout(() => setQ(rawQuery.trim()), 350); return () => clearTimeout(t); }, [rawQuery]);
  useEffect(() => { let cancelled = false; async function load() { setLoading(true); try { const params = new URLSearchParams(); if (q) params.set("q", q); const res = await fetch(`${API}/invoices?${params.toString()}`); const body = await res.json(); if (!res.ok) throw new Error(body?.error || "Failed to load invoices"); const list: Invoice[] = Array.isArray(body) ? body : body.invoices ?? body.data ?? []; if (!cancelled) { setInvoices(list); setTotal(list.length); setPage(1); } } catch (err: any) { if (!cancelled) { toast.error("Failed to load invoices", { description: err.message }); setInvoices([]); setTotal(null); } } finally { if (!cancelled) setLoading(false); } } load(); return () => { cancelled = true; }; }, [q, refreshKey]);

  // ... (useMemo hooks for pagination remain the same)
  const pagedInvoices = useMemo(() => { const start = (page - 1) * pageSize; return invoices.slice(start, start + pageSize); }, [invoices, page, pageSize]);
  const totalPages = useMemo(() => { if (total == null) return 1; return Math.max(1, Math.ceil(total / pageSize)); }, [total, pageSize]);

  // REFACTOR: This function now just opens the dialog
  function handleDeleteClick(id?: string) {
    if (!id) return;
    setInvoiceToDeleteId(id);
    setIsAlertOpen(true);
  }

  // REFACTOR: This function contains the actual deletion logic
  async function executeDelete() {
    if (!invoiceToDeleteId) return;

    const promise = fetch(`${API}/invoices/${invoiceToDeleteId}`, { method: "DELETE" }).then(res => {
        if (!res.ok) throw new Error("Delete failed");
    });

    toast.promise(promise, {
        loading: "Deleting invoice...",
        success: () => {
            setInvoices((prev) => prev.filter((it) => it._id !== invoiceToDeleteId));
            setTotal((prev) => (prev != null ? Math.max(0, prev - 1) : null));
            return "Invoice deleted.";
        },
        error: (err) => err.message,
    });

    setIsAlertOpen(false); // Close the dialog
    setInvoiceToDeleteId(null);
  }
  
  const handleRefresh = () => setRefreshKey((k) => k + 1);
  const handleClear = () => { setRawQuery(""); setQ(""); handleRefresh(); };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Search, view, and manage all your invoices.</p>
        </div>
        <Button asChild><Link href="/review"><PlusCircle className="mr-2 h-4 w-4" />Create From PDF</Link></Button>
      </div>

      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
                <Input value={rawQuery} onChange={(e) => setRawQuery(e.target.value)} placeholder="Search by vendor or invoice number..." className="flex-1" />
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleRefresh}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
                    <Button variant="ghost" onClick={handleClear}><XCircle className="mr-2 h-4 w-4" />Clear</Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[80px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center p-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : pagedInvoices.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center p-10">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                    <h3 className="mt-4 text-lg font-semibold">No Invoices Found</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or create a new invoice.</p>
                </TableCell></TableRow>
              ) : (
                pagedInvoices.map((inv) => (
                  <TableRow key={inv._id}>
                    <TableCell className="font-medium">{inv.vendor.name}</TableCell>
                    <TableCell>{inv.invoice.number}</TableCell>
                    <TableCell>{new Date(inv.invoice.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">{inv.invoice.total?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem asChild><Link href={`/invoices/${inv._id}`}>View / Edit</Link></DropdownMenuItem>
                          {/* REFACTOR: The delete button now triggers the dialog */}
                          <DropdownMenuItem onClick={() => handleDeleteClick(inv._id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="mt-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }} disabled={page <= 1} /></PaginationItem>
            <PaginationItem><PaginationLink isActive>{page}</PaginationLink></PaginationItem>
            <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage(p => Math.min(totalPages, p + 1)); }} disabled={page >= totalPages} /></PaginationItem>
          </PaginationContent>
        </Pagination>
        <p className="text-center text-sm text-muted-foreground mt-2">Page {page} of {totalPages}</p>
      </div>

      {/* REFACTOR: Add the AlertDialog component to the page */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
                    Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the invoice
                    and remove its data from our servers.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    Yes, delete invoice
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}