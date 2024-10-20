import { getFechaToWords } from "../controllers/FechaToWords.js";
import { Router } from "express";
import abogadoExtractor from '../middleware/abogadoExtractor.js';

const router = Router();

router.get('/fechaToWords', abogadoExtractor, getFechaToWords);

export default router;
