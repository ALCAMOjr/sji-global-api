import { getPositionExpedientes, getPositionExpedienteByNumber, getPositionExpedienteByMacroetapa, getPositionExpedienteByFiltros } from "../controllers/PosicionExpediente.controller.js";
import { Router } from "express";
import abogadoExtractor from '../middleware/abogadoExtractor.js';

const router = Router();

router.get('/position', abogadoExtractor, getPositionExpedientes);
router.get('/position/:number', abogadoExtractor, getPositionExpedienteByNumber);
router.get('/position/etapa/:etapa', abogadoExtractor, getPositionExpedienteByMacroetapa);
router.get('/position/tribunal/virtual', abogadoExtractor, getPositionExpedienteByFiltros);


export default router;
