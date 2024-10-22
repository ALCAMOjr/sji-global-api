import { getFechaToWords } from "../controllers/FechaToWords.js";
import { Router } from "express";
import abogadoExtractor from '../middleware/abogadoExtractor.js';

const router = Router();

router.get('/fechaToWords/:fecha', abogadoExtractor, getFechaToWords);

export default router;
