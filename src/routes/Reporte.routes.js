import { getReporte, getReporteDetalle } from "../controllers/Reporte.controller.js";
import { Router } from "express";
import abogadoExtractor from '../middleware/abogadoExtractor.js';

const router = Router();

router.get('/reporte', abogadoExtractor, getReporte);
router.get('/reporte/details', abogadoExtractor, getReporteDetalle);


export default router;
