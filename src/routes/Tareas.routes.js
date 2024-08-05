import { createTask, getTareasUser, startTask, completeTask, getExpedientesConTareas, getTareasByAbogado, cancelTask, hasTareasForExpediente, getTareasByExpediente } from "../controllers/Tareas.controller.js";
import { Router } from "express";
import abogadoExtractor from '../middleware/abogadoExtractor.js';

const router = Router();

router.post('/tarea/create', abogadoExtractor, createTask);
router.get('/tarea', abogadoExtractor, getExpedientesConTareas);
router.post('/tarea/start/:taskId', abogadoExtractor, startTask);
router.post('/tarea/complete/:taskId', abogadoExtractor, completeTask);
router.post('/tarea/cancel/:taskId', abogadoExtractor, cancelTask);
router.get('/tarea/user', abogadoExtractor, getTareasUser);
router.get('/tarea/:abogado_username', abogadoExtractor, getTareasByAbogado);
router.get('/tarea/expediente/:exptribunalA_numero', abogadoExtractor, getTareasByExpediente);
router.get('/tarea/hasTareas/:exptribunalA_numero', abogadoExtractor, hasTareasForExpediente);


export default router;
