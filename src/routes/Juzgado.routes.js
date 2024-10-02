import { getAllJuzgados } from "../controllers/Juzgados.controller.js";
import { Router } from "express";
import abogadoExtractor from '../middleware/abogadoExtractor.js';

const router = Router();

router.get('/juzgados', abogadoExtractor, getAllJuzgados);


export default router;
