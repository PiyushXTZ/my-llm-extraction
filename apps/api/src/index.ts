import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import invoiceRoutes from "./routes/invoiceRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import extractRoutes from "./routes/extractRoutes";
import { connectDB } from "./utils/db";
dotenv.config();

const app = express();
app.use(cors({
  origin: "http://localhost:3000", 
  methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use(express.json());

// routes
app.use("/invoices", invoiceRoutes);
app.use("/upload", uploadRoutes);
app.use("/extract", extractRoutes);

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`✅ API running on http://localhost:${PORT}`));
});
