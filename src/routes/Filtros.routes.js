import { Router } from "express";
import abogadoExtractor from '../middleware/abogadoExtractor.js';
import { getAllFiltros } from "../controllers/Filtros.controller.js";

const router = Router();

router.get('/filtros', abogadoExtractor, getAllFiltros);

export default router;
