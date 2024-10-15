import { createDemanda } from "../controllers/Demandas.controller.js"
import { Router } from "express";
import abogadoExtractor from '../middleware/abogadoExtractor.js';
import multer from 'multer';
const router = Router();



const storage = multer.memoryStorage();
const upload = multer({ storage });


router.post('/demanda/create', abogadoExtractor, createDemanda);


export default router;
