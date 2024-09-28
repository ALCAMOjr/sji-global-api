import { getPositionExpedientes, getPositionExpedienteByNumber, getPositionExpedienteByMacroetapa, getPositionExpedienteByFiltros, getPositionExpedientesByFecha } from "../controllers/PosicionExpediente.controller.js";
import { Router } from "express";
import abogadoExtractor from '../middleware/abogadoExtractor.js';

const router = Router();

router.get('/position', abogadoExtractor, getPositionExpedientes);
router.get('/position/:number', abogadoExtractor, getPositionExpedienteByNumber);
router.get('/position/etapa/:etapa', abogadoExtractor, getPositionExpedienteByMacroetapa);
router.get('/position/tribunal/virtual', abogadoExtractor, getPositionExpedienteByFiltros);
router.get('/position/fecha/:fecha', abogadoExtractor, getPositionExpedientesByFecha);

export default router;
