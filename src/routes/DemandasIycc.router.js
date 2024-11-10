import { createDemanda, getAllDemandas, getByCredito, updateDemanda, deleteDemanda, getDemandaPdf, getDemandaCertificate} from "../controllers/DemandaIycc.controller.js"
import { Router } from "express";
import abogadoExtractor from '../middleware/abogadoExtractor.js';
const router = Router();


router.post('/demandaIycc', abogadoExtractor, createDemanda);
router.get('/demandaIycc', abogadoExtractor, getAllDemandas);
router.get('/demandaIycc/:credito', abogadoExtractor, getByCredito);
router.patch('/demandaIycc/:credito', abogadoExtractor, updateDemanda);
router.delete('/demandaIycc/:credito', abogadoExtractor, deleteDemanda);
router.get('/demandaIycc/:credito/pdf', abogadoExtractor, getDemandaPdf);
router.get('/demandaIycc/:credito/certificate', abogadoExtractor, getDemandaCertificate);


export default router;
