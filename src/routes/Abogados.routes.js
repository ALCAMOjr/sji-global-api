import { login, deleteAbogado, getAllAbogados, updateAbogado, registerUser, verify } from "../controllers/Abogados.controller.js";
import { Router } from "express";
import abogadoExtractor from '../middleware/abogadoExtractor.js';

const router = Router();

router.get('/abogados', abogadoExtractor, getAllAbogados);

router.post('/abogados/login', login);

router.post('/abogados/register', abogadoExtractor, registerUser);

router.patch('/abogados/:id', abogadoExtractor, updateAbogado);

router.delete('/abogados/:id', abogadoExtractor, deleteAbogado);

router.post('/abogados/verify', verify);

export default router;
