import { createTemplate } from "../controllers/TemplatesIycc.controller.js";
import { Router } from "express";
import abogadoExtractor from '../middleware/abogadoExtractor.js';
import multer from "multer";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/templateIycc', abogadoExtractor, upload.single('template'), createTemplate);

export default router;
