import { Router } from "express";
import { extractData } from "../controllers/extractController";

const router = Router();

router.post("/", extractData);

export default router;
