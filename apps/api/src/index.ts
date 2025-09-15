import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import extractRoutes from "./routes/extractRoutes.js";
import { connectDB } from "./utils/db.js";
import serverless from "serverless-http";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use(express.json());

// routes
app.use("/invoices", invoiceRoutes);
app.use("/upload", uploadRoutes);
app.use("/extract", extractRoutes);

// connect DB once at cold start
await connectDB();

// export a handler for Vercel
export const handler = serverless(app);
