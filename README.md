# Internship Assignment – PDF Viewer + Data Extraction Dashboard

A monorepo project to upload, view, and extract invoice data from PDFs using **Google Gemini**, with a **MongoDB backend**, **Vercel Blob storage**, and a **Next.js dashboard**.  
Deployed entirely on **Vercel** (web + API).

---

## 🎯 Features

- **PDF Viewer**
  - Upload PDFs (≤25 MB) and render with zoom + page navigation.
  - Stored securely in **Vercel Blob**.

- **AI Data Extraction (Gemini)**
  - Extracts key invoice fields (vendor, invoice details, line items).
  - Uses **Gemini API** for structured data extraction.

- **Editable Dashboard**
  - Right panel with editable form for extracted fields.
  - Full CRUD (create, read, update, delete) on MongoDB.
  - Search invoices by vendor name or invoice number.

- **API (REST)**
  - Endpoints for upload, extract, list, update, and delete invoices.
  - Consistent JSON schema with validation.

---

## 📦 Tech Stack

- **Monorepo**: Turborepo / pnpm workspaces  
- **Frontend**: Next.js (App Router) + TypeScript + [shadcn/ui]
- **Backend**: Node.js (TypeScript) REST API  
- **Database**: MongoDB Atlas  
- **AI**: Google Gemini API  
- **File Storage**: Vercel Blob  
- **PDF Viewer**: [pdf.js]
- **Deploy**: Vercel for web + Render for api 

---

## 📂 Repo Structure

```bash
.
├── apps/
│   ├── web     # Next.js frontend
│   └── api     # Node.js backend
├── packages/   # (optional) shared types / utils
└── README.md
```

---

## ⚙️ Setup & Installation

### 1. Clone repo
```bash
git clone https://github.com/PiyushXTZ/my-llm-extraction.git
cd my-llm-extraction
```
### 2.Install dependencies (monorepo root)
```bash
pnpm install
```

### 3.Environment variables
```bash
For apps/web/.env.local
NEXT_PUBLIC_API_URL=https://<your-api-url>.vercel.app

For apps/api/.env
MONGODB_URI=<your-mongodb-atlas-uri>
GEMINI_API_KEY=<your-gemini-api-key>
BLOB_READ_WRITE_TOKEN=<vercel-blob-token>

```
### 4. Run locally
```bash
Start frontend (Next.js):
pnpm --filter web dev
# http://localhost:3000

Start backend (API):
pnpm --filter api dev
# http://localhost:4000 (default)
```

## 📑 API Documentation

---

### 1. **Upload PDF**
**Endpoint:**  POST /upload
Response:

```bash
{
  "fileId": "abc123",
  "fileName": "invoice.pdf"
}
```
### 2. **Extract Data (Gemini)**
**Endpoint:**  POST /extract
Response:

```bash
{
  "vendor": {
    "name": "ACME Corp",
    "address": "123 Street",
    "taxId": "TAX123"
  },
  "invoice": {
    "number": "INV-001",
    "date": "2023-12-01",
    "currency": "USD",
    "subtotal": 100,
    "taxPercent": 10,
    "total": 110,
    "poNumber": "PO-567",
    "poDate": "2023-11-28",
    "lineItems": [
      {
        "description": "Widget",
        "unitPrice": 50,
        "quantity": 2,
        "total": 100
      }
    ]
  }
}

```
### **3. Get All Invoices**
**Endpoint:**  GET /invoices

```bash
Query Params
q → search by vendor.name or invoice.number
```
### **4. Get Invoice by ID**
**Endpoint:**  GET /invoices/:id
```bash
The Document
```

### **5. Update Invoice**
**Endpoint:**  PUT /invoices/:id
Response:
```bash
{
  "success": true,
  "message": "Invoice updated successfully"
}

```
### **6. Delete Invoice**
**Endpoint:**  DELETE /invoices/:id
Response:
```bash
{
  "success": true,
  "message": "Invoice deleted successfully"
}

```
## 💾 Minimal Data Schema
```bash
{
  fileId: string,
  fileName: string,
  vendor: {
    name: string,
    address?: string,
    taxId?: string
  },
  invoice: {
    number: string,
    date: string,
    currency?: string,
    subtotal?: number,
    taxPercent?: number,
    total?: number,
    poNumber?: string,
    poDate?: string,
    lineItems: Array<{
      description: string,
      unitPrice: number,
      quantity: number,
      total: number
    }>
  },
  createdAt: string,
  updatedAt?: string
}
```
## 🚀 Deployment & Deliverables

- **GitHub Monorepo**: [PiyushXTZ/my-llm-extraction](https://github.com/PiyushXTZ/my-llm-extraction)  
- **Web Application**: [my-llm-extraction-web.vercel.app](https://my-llm-extraction-web.vercel.app/)  
- **API Endpoint**: [my-llm-extraction-1.onrender.com](https://my-llm-extraction-1.onrender.com/)  
- **Demo Video**: [Watch here](https://drive.google.com/file/d/1HVdOAtI27MC4l-_KZySFqx5eE_YQk2a2/view)  

---
