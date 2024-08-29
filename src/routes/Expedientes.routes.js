import { createExpediente, getExpedientesByNumero, getAllExpedientes, deleteExpediente, updateExpediente, startUpdateExpedientes, getJobStatus, getPdf, getFilename, uploadCsvExpediente } from "../controllers/Expediente.controller.js";
import { Router } from "express";
import abogadoExtractor from '../middleware/abogadoExtractor.js';
import multer from 'multer';
const router = Router();



const storage = multer.memoryStorage();
const upload = multer({ storage });


router.post('/expedientes/create', abogadoExtractor, createExpediente);
router.get('/expedientes', abogadoExtractor, getAllExpedientes);
router.get('/expedientes/:numero', abogadoExtractor, getExpedientesByNumero);
router.patch('/expedientes/:numero', abogadoExtractor, updateExpediente);
router.delete('/expedientes/:numero', abogadoExtractor, deleteExpediente);
router.post('/expediente/pdf', abogadoExtractor, getPdf);
router.get('/expediente/pdf/:filename', abogadoExtractor, getFilename);
router.post('/expedientes/upload-csv', abogadoExtractor, upload.array('files'), uploadCsvExpediente);
router.patch('/expedientes', abogadoExtractor, startUpdateExpedientes);
router.get('/expedientes/status/:jobId', abogadoExtractor, getJobStatus);


export default router;
