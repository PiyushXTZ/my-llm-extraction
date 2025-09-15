import { Router } from "express";
import multer from "multer";
import { handleUpload } from "../controllers/uploadController";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), handleUpload);

export default router;
