import { createExpediente, getExpedientesByNumero,  getAllExpedientes, deleteExpediente, updateExpediente, updateExpedientes, getPdf, getFilename } from "../controllers/Expediente.controller.js";
import { Router } from "express";
import abogadoExtractor from '../middleware/abogadoExtractor.js';

const router = Router();


router.post('/expedientes/create', abogadoExtractor, createExpediente);
router.get('/expedientes', abogadoExtractor, getAllExpedientes);
router.get('/expedientes/:numero', abogadoExtractor, getExpedientesByNumero);
router.patch('/expedientes/:numero', abogadoExtractor, updateExpediente);
router.patch('/expedientes', abogadoExtractor, updateExpedientes);
router.delete('/expedientes/:numero', abogadoExtractor, deleteExpediente);
router.post('/expediente/pdf', abogadoExtractor, getPdf);
router.get('/expediente/pdf/:filename', abogadoExtractor, getFilename);


export default router;
