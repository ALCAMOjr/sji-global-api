import { getNumberToWords } from "../controllers/NumberToWords.controller.js";
import { Router } from "express";
import abogadoExtractor from '../middleware/abogadoExtractor.js';

const router = Router();

router.get('/numberToWords/:number', abogadoExtractor, getNumberToWords);



export default router;
