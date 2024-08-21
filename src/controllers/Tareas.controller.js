import Tarea from '../models/Tarea.js';
import TareaDAO from '../utils/TareaDAO.js';
import AbogadoDAO from "../utils/AbogadoDAO.js";
import ExpedienteDAO from "../utils/ExpedienteDAO.js";
import { format } from 'date-fns';
import { sendEmail, generateTaskAssignmentEmail, generateTaskCompletionEmail, generateTaskCancellationEmail, getMexicoCityDate } from '../helpers/Mailer.js';

export const createTask = async (req, res) => {
    try {
        const { exptribunalA_numero, abogado_id, tarea, fecha_entrega, observaciones } = req.body;
        const { userId } = req;

        if (!exptribunalA_numero) {
            return res.status(400).send({ error: 'Cannot assign a task to a non-existent expediente.' });
        }
        const expedienteTribunal = await ExpedienteDAO.findByNumero(exptribunalA_numero);
        
        if (!expedienteTribunal) {
            return res.status(400).send({ error: 'Cannot assign a task to a non-existent expediente.' });
        }
        
        if (!abogado_id || !fecha_entrega || !tarea) {
            return res.status(400).send({ error: 'Missing required fields: abogado_id, fecha_entrega and tarea are required.' });
        }

        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const abogado = await AbogadoDAO.getById(abogado_id);
        if (!abogado || abogado.user_type !== 'abogado') {
            return res.status(400).send({ error: 'Invalid abogado id or the user is not an abogado.' });
        }


        const existingTasks = await TareaDAO.findByExpTribunalANumero(exptribunalA_numero);
        const activeTask = existingTasks.find(task => task.estado_tarea === 'Asignada' || task.estado_tarea === 'Iniciada');
        if (activeTask) {
            return res.status(400).send({ error: 'There is already an active task assigned to this expediente.' });
        }

        const fecha_registro = getMexicoCityDate(new Date());

        const fecha_entrega_formatted = getMexicoCityDate(new Date(fecha_entrega));

        const nuevaTarea = new Tarea({
            abogado_id,
            exptribunalA_numero,
            tarea,
            fecha_registro,
            fecha_entrega: fecha_entrega_formatted,
            estado_tarea: 'Asignada',
            observaciones
        });

        const tareaCreada = await TareaDAO.create(nuevaTarea);

        const { subject, text } = generateTaskAssignmentEmail(abogado, exptribunalA_numero);
        await sendEmail(abogado.email, subject, text);

        res.status(201).send(tareaCreada);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while creating the tarea', details: error.message });
    }
};


export const getTareasUser = async (req, res) => {
    try {
        const { userId } = req;

        const user = await AbogadoDAO.getById(userId);
        if (!user) {
            return res.status(400).send({ error: 'Invalid user id' });
        }

        const tareas = await TareaDAO.findActiveTasksByAbogadoId(userId);

        const expedienteMap = {};
        tareas.forEach(tarea => {
            const { numero, nombre, url, expediente, tareaId, tarea: tareaDesc, fecha_entrega, observaciones, estado_tarea } = tarea;
            if (!expedienteMap[numero]) {
                expedienteMap[numero] = { numero, nombre, url, expediente, tareas: [] };
            }
            expedienteMap[numero].tareas.push({ tareaId, tarea: tareaDesc, fecha_entrega, observaciones, estado_tarea });
        });

        const result = Object.values(expedienteMap);

        res.status(200).send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while retrieving the tasks', details: error.message });
    }
};


export const startTask = async (req, res) => {
    try {
        const { userId } = req;
        const { taskId } = req.params;

        const user = await AbogadoDAO.getById(userId);
        if (!user) {
            return res.status(400).send({ error: 'Invalid user id' });
        }

        const tarea = await TareaDAO.findByIdAndAbogadoId(taskId, userId);
        if (!tarea) {
            return res.status(400).send({ error: 'Task not found or you are not authorized to start this task' });
        }

        const fecha_inicio = getMexicoCityDate(new Date());
        await TareaDAO.startTask(taskId, fecha_inicio);

        res.status(200).send({ message: 'Task started successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while starting the task', details: error.message });
    }
};

export const completeTask = async (req, res) => {
    try {
        const { userId } = req;
        const { taskId } = req.params;

        const user = await AbogadoDAO.getById(userId);
        if (!user) {
            return res.status(400).send({ error: 'Invalid user id' });
        }

        const tarea = await TareaDAO.findByIdAndAbogadoId(taskId, userId);
        if (!tarea) {
            return res.status(400).send({ error: 'Task not found or you are not authorized to complete this task' });
        }

        const fecha_real_entrega = getMexicoCityDate(new Date());
        await TareaDAO.completeTask(taskId, fecha_real_entrega);

        const coordinadores = await AbogadoDAO.getAllCoordinadores();
        const { subject, text } = generateTaskCompletionEmail(user, taskId);
        for (const coordinador of coordinadores) {
            await sendEmail(coordinador.email, subject, text);
        }

        res.status(200).send({ message: 'Task completed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while completing the task', details: error.message });
    }
};

export const getExpedientesConTareas = async (req, res) => {
    try {
        const { userId } = req;

        const user = await AbogadoDAO.getById(userId);
        if (!user) {
            return res.status(400).send({ error: 'Invalid user id' });
        }
        if (user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const expedientes = await TareaDAO.findExpedientesConTareas();

        const expedienteMap = {};
        expedientes.forEach(expediente => {
            const { numero, nombre, url, expediente: expedienteDesc, tareaId, tarea, fecha_inicio, fecha_registro, fecha_entrega, fecha_real_entrega, fecha_estimada_respuesta, fecha_cancelacion, observaciones, estado_tarea, abogadoId, abogadoUsername } = expediente;
            if (!expedienteMap[numero]) {
                expedienteMap[numero] = { numero, nombre, url, expediente: expedienteDesc, tareas: [] };
            }
            expedienteMap[numero].tareas.push({ tareaId, tarea, fecha_inicio, fecha_registro, fecha_entrega, fecha_real_entrega, fecha_estimada_respuesta, fecha_cancelacion, observaciones, estado_tarea, abogadoId, abogadoUsername });
        });

        const result = Object.values(expedienteMap);

        res.status(200).send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while retrieving the expedientes with tasks', details: error.message });
    }
};

export const getTareasByAbogado = async (req, res) => {
    try {
        const { userId } = req;
        const { abogado_username } = req.params;

        const user = await AbogadoDAO.getById(userId);
        if (!user) {
            return res.status(400).send({ error: 'Invalid user id' });
        }
        if (user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const abogado = await AbogadoDAO.getByUsername(abogado_username);
        if (!abogado || abogado.user_type !== 'abogado') {
            return res.status(200).send([]);
        }

        const tareas = await TareaDAO.findActiveTasksByAbogadoId(abogado.id);

        const expedienteMap = {};
        tareas.forEach(tarea => {
            const { numero, nombre, url, expediente, tareaId, tarea: tareaDesc, fecha_inicio, fecha_registro, fecha_entrega, fecha_real_entrega, fecha_estimada_respuesta, fecha_cancelacion, observaciones, estado_tarea } = tarea;
            if (!expedienteMap[numero]) {
                expedienteMap[numero] = { numero, nombre, url, expediente, tareas: [] };
            }
            expedienteMap[numero].tareas.push({ tareaId, tarea: tareaDesc, fecha_inicio, fecha_registro, fecha_entrega, fecha_real_entrega, fecha_estimada_respuesta, fecha_cancelacion, observaciones, estado_tarea });
        });

        const result = Object.values(expedienteMap);

        res.status(200).send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while retrieving the tasks', details: error.message });
    }
};



export const getTareasByExpediente = async (req, res) => {
    try {
        const { userId } = req;
        const { exptribunalA_numero } = req.params;

        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const expedientes = await ExpedienteDAO.findByNumero(exptribunalA_numero);
        if (!expedientes.length) {
            return res.status(400).send({ error: 'Expediente not found' });
        }

        const tareas = await TareaDAO.findByExpediente(exptribunalA_numero);

        const expedienteMap = {};
        tareas.forEach(tarea => {
            const { numero, nombre, url, expediente, tareaId, tarea: tareaDesc, fecha_inicio, fecha_registro, fecha_entrega, fecha_real_entrega, fecha_estimada_respuesta, fecha_cancelacion, observaciones, estado_tarea, abogadoId, abogadoUsername } = tarea;
            if (!expedienteMap[numero]) {
                expedienteMap[numero] = { numero, nombre, url, expediente, tareas: [] };
            }
            expedienteMap[numero].tareas.push({ tareaId, tarea: tareaDesc, fecha_inicio, fecha_registro, fecha_entrega, fecha_real_entrega, fecha_estimada_respuesta, fecha_cancelacion, observaciones, estado_tarea, abogadoId, abogadoUsername });
        });

        const result = Object.values(expedienteMap);

        res.status(200).send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while retrieving the tasks for the specified expediente', details: error.message });
    }
};

export const cancelTask = async (req, res) => {
    try {
        const { userId } = req;
        const { taskId } = req.params;

        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const tarea = await TareaDAO.findById(taskId);
        if (!tarea) {
            return res.status(400).send({ error: 'Task not found' });
        }

        if (tarea.estado_tarea === 'Cancelada') {
            return res.status(400).send({ error: 'Task already canceled' });
        }

        const fecha_cancelacion = getMexicoCityDate(new Date());
        await TareaDAO.cancelTask(taskId, fecha_cancelacion);

        const abogado = await AbogadoDAO.getById(tarea.abogado_id);
        if (!abogado) {
            return res.status(400).send({ error: 'Associated lawyer not found' });
        }

        const { subject, text } = generateTaskCancellationEmail(abogado, taskId);
        await sendEmail(abogado.email, subject, text);

        res.status(200).send({ message: 'Task canceled and notification sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while canceling the task', details: error.message });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const { userId } = req;
        const { taskId } = req.params;

        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const tarea = await TareaDAO.findById(taskId);
        if (!tarea) {
            return res.status(400).send({ error: 'Task not found' });
        }

        const allowedStatuses = ['Cancelada', 'Terminada'];
        if (!allowedStatuses.includes(tarea.estado_tarea)) {
            return res.status(400).send({ error: 'Task cannot be deleted in the current status' });
        }

        await TareaDAO.deleteTask(taskId);

        res.status(204).send({ message: 'task deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while deleting the task', details: error.message });
    }
};



export const hasTareasForExpediente = async (req, res) => {
    try {
        const { userId } = req;
        const { exptribunalA_numero } = req.params;

        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const hasTasks = await TareaDAO.hasTasksForExpediente(exptribunalA_numero);

        res.status(200).send({ hasTasks });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while checking tasks for the expediente', details: error.message });
    }
};
