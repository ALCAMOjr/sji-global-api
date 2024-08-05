import { getPositionExpedientes, getPositionExpedienteByNumber } from "../controllers/PosicionExpediente.controller.js";
import { Router } from "express";
import abogadoExtractor from '../middleware/abogadoExtractor.js';

const router = Router();

router.get('/position', abogadoExtractor, getPositionExpedientes);
router.get('/position/:number', abogadoExtractor, getPositionExpedienteByNumber);


export default router;
