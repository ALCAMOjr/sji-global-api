import { createExpediente, getExpedientesByNumero,  getAllExpedientes, deleteExpediente, updateExpediente, updateExpedientes, getPdf, getFilename, deleteFilename } from "../controllers/Expediente.controller.js";
import { Router } from "express";
import abogadoExtractor from '../middleware/abogadoExtractor.js';

const router = Router();


router.post('/expedientes/create', abogadoExtractor, createExpediente);
router.get('/expedientes', abogadoExtractor, getAllExpedientes);
router.get('/expedientes/:numero', abogadoExtractor, getExpedientesByNumero);
router.patch('/expedientes/:numero', abogadoExtractor, updateExpediente);
router.patch('/expedientes', abogadoExtractor, updateExpedientes);
router.delete('/expedientes/:numero', abogadoExtractor, deleteExpediente);
router.get('/expediente/pdf', abogadoExtractor, getPdf);
router.get('/expediente/filename/:filename', abogadoExtractor, getFilename);
router.delete('/expediente/filename/:filename', abogadoExtractor, deleteFilename);


export default router;
