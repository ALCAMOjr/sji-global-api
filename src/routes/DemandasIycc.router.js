import { createDemanda, getAllDemandas, getByCredito, updateDemanda, deleteDemanda } from "../controllers/DemandaIycc.controller.js"
import { Router } from "express";
import abogadoExtractor from '../middleware/abogadoExtractor.js';
const router = Router();


router.post('/demandaIycc', abogadoExtractor, createDemanda);
router.get('/demandaIycc', abogadoExtractor, getAllDemandas);
router.get('/demandaIycc/:credito', abogadoExtractor, getByCredito);
router.patch('/demandaIycc/:credito', abogadoExtractor, updateDemanda);
router.delete('/demandaIycc/:credito', abogadoExtractor, deleteDemanda);


export default router;
