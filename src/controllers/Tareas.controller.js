import { pool } from "../db.js";
import dotenv from 'dotenv';
import { format } from 'date-fns';
import { sendEmail } from '../helpers/Mailer.js';

dotenv.config();


export const createTask = async (req, res) => {
    try {
        const { exptribunalA_numero, abogado_id, tarea, fecha_entrega, observaciones } = req.body;
        const { userId } = req;

        if (!exptribunalA_numero || !abogado_id || !fecha_entrega || !tarea) {
            return res.status(400).send({ error: 'Missing required fields: exptribunalA_numero, abogado_id, fecha_entrega and tarea are required.' });
        }

        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).send({ error: 'Invalid user id' });
        }

        const user = users[0];
        if (user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const [abogados] = await pool.query('SELECT * FROM abogados WHERE id = ?', [abogado_id]);
        if (abogados.length <= 0 || abogados[0].user_type !== 'abogado') {
            return res.status(400).send({ error: 'Invalid abogado id or the user is not an abogado.' });
        }

        const abogado = abogados[0];
        const [expTribunalA] = await pool.query('SELECT * FROM expTribunalA WHERE numero = ?', [exptribunalA_numero]);
        if (expTribunalA.length <= 0) {
            return res.status(400).send({ error: 'Cannot assign a task to a non-existent expediente.' });
        }

        const [existingTasks] = await pool.query(
            'SELECT * FROM Tareas WHERE exptribunalA_numero = ? AND estado_tarea IN (?, ?)',
            [exptribunalA_numero, 'Asignada', 'Iniciada']
        );
        if (existingTasks.length > 0) {
            return res.status(400).send({ error: 'There is already an active task assigned to this expediente.' });
        }

        const fecha_registro = format(new Date(), 'yyyy-MM-dd');
        const fecha_entrega_formatted = format(new Date(fecha_entrega), 'yyyy-MM-dd');

        const [result] = await pool.query(
            'INSERT INTO Tareas (exptribunalA_numero, abogado_id, tarea, fecha_registro, fecha_entrega, estado_tarea, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [exptribunalA_numero, abogado_id, tarea, fecha_registro, fecha_entrega_formatted, 'Asignada', observaciones]
        );

        const newTareaId = result.insertId;
        const [newTarea] = await pool.query('SELECT * FROM Tareas WHERE id = ?', [newTareaId]);
        if (newTarea.length > 0) {
            const tarea = newTarea[0];
            const subject = 'Nueva tarea asignada';
            const text = `Hola ${abogado.nombre},\n\nSe te ha asignado una nueva tarea para el expediente ${exptribunalA_numero}.\n\nSaludos,\nEquipo de Gestión de Tareas`;

            await sendEmail(abogado.email, subject, text);

            res.status(200).send(tarea);
        } else {
            res.status(404).send({ error: 'Tarea not found after creation' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while creating the tarea', details: error.message });
    }
};


export const getTareasUser = async (req, res) => {
    try {
        const { userId } = req;

        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).send({ error: 'Invalid user id' });
        }

        const [tareas] = await pool.query(
            `SELECT Tareas.id as tareaId, Tareas.tarea, Tareas.fecha_entrega, Tareas.observaciones, 
                    Tareas.estado_tarea, expTribunalA.numero, expTribunalA.nombre, expTribunalA.url, expTribunalA.expediente
             FROM Tareas 
             JOIN expTribunalA ON Tareas.exptribunalA_numero = expTribunalA.numero
             WHERE Tareas.abogado_id = ? AND (Tareas.estado_tarea = 'Asignada' OR Tareas.estado_tarea = 'Iniciada')`,
            [userId]
        );

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
        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).send({ error: 'Invalid user id' });
        }

        const user = users[0];
        const [tasks] = await pool.query('SELECT * FROM Tareas WHERE id = ? AND abogado_id = ?', [taskId, userId]);
        if (tasks.length <= 0) {
            return res.status(400).send({ error: 'Task not found or you are not authorized to start this task' });
        }

        const fecha_inicio = format(new Date(), 'yyyy-MM-dd');
        await pool.query('UPDATE Tareas SET estado_tarea = ?, fecha_inicio = ? WHERE id = ?', ['Iniciada', fecha_inicio, taskId]);

        res.status(200).send({ message: 'Task started successfully' });
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while starting the task', details: error.message });
    }
};

export const completeTask = async (req, res) => {
    try {
        const { userId } = req;
        const { taskId } = req.params;
        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).send({ error: 'Invalid user id' });
        }

        const user = users[0];
        const [tasks] = await pool.query('SELECT * FROM Tareas WHERE id = ? AND abogado_id = ?', [taskId, userId]);
        if (tasks.length <= 0) {
            return res.status(400).send({ error: 'Task not found or you are not authorized to complete this task' });
        }

        const fecha_real_entrega = format(new Date(), 'yyyy-MM-dd');
        await pool.query('UPDATE Tareas SET estado_tarea = ?, fecha_real_entrega = ? WHERE id = ?', ['Terminada', fecha_real_entrega, taskId]);
        const [coordinadores] = await pool.query('SELECT * FROM abogados WHERE user_type = "coordinador"');
        const subject = 'Tarea completada';
        const text = `Hola,\n\nEl abogado ${user.nombre} ${user.apellido} ha completado la tarea con ID ${taskId}.\n\nSaludos,\nEquipo de Gestión de Tareas`;
        for (const coordinador of coordinadores) {
            await sendEmail(coordinador.email, subject, text);
        }

        res.status(200).send({ message: 'Task completed successfully' });
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while completing the task', details: error.message });
    }
};

export const getExpedientesConTareas = async (req, res) => {
    try {
        const { userId } = req;
        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).send({ error: 'Invalid user id' });
        }
        const user = users[0];
        if (user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const [expedientes] = await pool.query(
            `SELECT expTribunalA.numero, expTribunalA.nombre, expTribunalA.url, expTribunalA.expediente, 
                    Tareas.id as tareaId, Tareas.tarea, Tareas.fecha_inicio, Tareas.fecha_registro, 
                    Tareas.fecha_entrega, Tareas.fecha_real_entrega, Tareas.fecha_estimada_respuesta, 
                    Tareas.observaciones, Tareas.estado_tarea, 
                    abogados.id as abogadoId, abogados.username as abogadoUsername
             FROM expTribunalA 
             JOIN Tareas ON expTribunalA.numero = Tareas.exptribunalA_numero
             JOIN abogados ON Tareas.abogado_id = abogados.id`
        );

        const expedienteMap = {};
        expedientes.forEach(expediente => {
            const { numero, nombre, url, expediente: expedienteDesc, tareaId, tarea, fecha_inicio, fecha_registro, fecha_entrega, fecha_real_entrega, fecha_estimada_respuesta, observaciones, estado_tarea, abogadoId, abogadoUsername } = expediente;
            if (!expedienteMap[numero]) {
                expedienteMap[numero] = { numero, nombre, url, expediente: expedienteDesc, tareas: [] };
            }
            expedienteMap[numero].tareas.push({ tareaId, tarea, fecha_inicio, fecha_registro, fecha_entrega, fecha_real_entrega, fecha_estimada_respuesta, observaciones, estado_tarea, abogadoId, abogadoUsername });
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
        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).send({ error: 'Invalid user id' });
        }
        const user = users[0];
        if (user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }
        const [abogados] = await pool.query('SELECT * FROM abogados WHERE username = ?', [abogado_username]);
        if (abogados.length <= 0 || abogados[0].user_type !== 'abogado') {
            return res.status(200).send([]); 
        }

        const abogado = abogados[0];
        const [tareas] = await pool.query(
            `SELECT Tareas.id as tareaId, Tareas.tarea, Tareas.fecha_inicio, Tareas.fecha_registro, Tareas.fecha_entrega, 
                    Tareas.fecha_real_entrega, Tareas.fecha_estimada_respuesta, Tareas.observaciones, Tareas.estado_tarea, 
                    expTribunalA.numero, expTribunalA.nombre, expTribunalA.url, expTribunalA.expediente
             FROM Tareas 
             JOIN expTribunalA ON Tareas.exptribunalA_numero = expTribunalA.numero
             WHERE Tareas.abogado_id = ?`,
            [abogado.id]
        );

        const expedienteMap = {};
        tareas.forEach(tarea => {
            const { numero, nombre, url, expediente, tareaId, tarea: tareaDesc, fecha_inicio, fecha_registro, fecha_entrega, fecha_real_entrega, fecha_estimada_respuesta, observaciones, estado_tarea } = tarea;
            if (!expedienteMap[numero]) {
                expedienteMap[numero] = { numero, nombre, url, expediente, tareas: [] };
            }
            expedienteMap[numero].tareas.push({ tareaId, tarea: tareaDesc, fecha_inicio, fecha_registro, fecha_entrega, fecha_real_entrega, fecha_estimada_respuesta, observaciones, estado_tarea });
        });

        const result = Object.values(expedienteMap);

        res.status(200).send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while retrieving the tasks for the specified abogado', details: error.message });
    }
};

export const getTareasByExpediente = async (req, res) => {
    try {
        const { userId } = req;
        const { exptribunalA_numero } = req.params;

        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).send({ error: 'Invalid user id' });
        }

        const user = users[0];
        if (user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const [expedientes] = await pool.query('SELECT * FROM expTribunalA WHERE numero = ?', [exptribunalA_numero]);
        if (expedientes.length <= 0) {
            return res.status(400).send({ error: 'Expediente not found' });
        }

        const [tareas] = await pool.query(
            `SELECT Tareas.id as tareaId, Tareas.tarea, Tareas.fecha_inicio, Tareas.fecha_registro, Tareas.fecha_entrega, 
                    Tareas.fecha_real_entrega, Tareas.fecha_estimada_respuesta, Tareas.observaciones, Tareas.estado_tarea, 
                    expTribunalA.numero, expTribunalA.nombre, expTribunalA.url, expTribunalA.expediente,
                    abogados.id as abogadoId, abogados.username as abogadoUsername
             FROM Tareas 
             JOIN expTribunalA ON Tareas.exptribunalA_numero = expTribunalA.numero
             JOIN abogados ON Tareas.abogado_id = abogados.id
             WHERE Tareas.exptribunalA_numero = ?`,
            [exptribunalA_numero]
        );

        const expedienteMap = {};
        tareas.forEach(tarea => {
            const { numero, nombre, url, expediente, tareaId, tarea: tareaDesc, fecha_inicio, fecha_registro, fecha_entrega, fecha_real_entrega, fecha_estimada_respuesta, observaciones, estado_tarea, abogadoId, abogadoUsername } = tarea;
            if (!expedienteMap[numero]) {
                expedienteMap[numero] = { numero, nombre, url, expediente, tareas: [] };
            }
            expedienteMap[numero].tareas.push({ tareaId, tarea: tareaDesc, fecha_inicio, fecha_registro, fecha_entrega, fecha_real_entrega, fecha_estimada_respuesta, observaciones, estado_tarea, abogadoId, abogadoUsername });
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

        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).send({ error: 'Invalid user id' });
        }

        const user = users[0];
        if (user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const [tasks] = await pool.query('SELECT * FROM Tareas WHERE id = ?', [taskId]);
        if (tasks.length <= 0) {
            return res.status(400).send({ error: 'Task not found' });
        }

        const tarea = tasks[0];
        if (tarea.estado_tarea === 'Cancelada') {
            return res.status(400).send({ error: 'Task already canceled' });
        }


        const fecha_cancelacion = format(new Date(), 'yyyy-MM-dd');
        await pool.query('UPDATE Tareas SET estado_tarea = ?, fecha_cancelacion = ? WHERE id = ?', ['Cancelada', fecha_cancelacion, taskId]);

        const [abogados] = await pool.query('SELECT * FROM abogados WHERE id = ?', [tarea.abogado_id]);
        if (abogados.length <= 0) {
            return res.status(400).send({ error: 'Associated lawyer not found' });
        }

        const abogado = abogados[0];

        const subject = 'Tarea Cancelada';
        const text = `Hola ${abogado.nombre} ${abogado.apellido},\n\nMalas noticias, se te ha cancelado la tarea con el ID ${taskId}.\n\nSaludos,\nEquipo de Gestión de Tareas`;

        await sendEmail(abogado.email, subject, text);

        res.status(200).send({ message: 'Task canceled and notification sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while canceling the task', details: error.message });
    }
};

export const hasTareasForExpediente = async (req, res) => {
    try {
        const { userId } = req;
        const { exptribunalA_numero } = req.params;


        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).send({ error: 'Invalid user id' });
        }
        const user = users[0];
        if (user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }
        const [tasks] = await pool.query(
            'SELECT * FROM Tareas WHERE exptribunalA_numero = ? AND estado_tarea IN (?, ?)',
            [exptribunalA_numero, 'Asignada', 'Iniciada']
        );
        const hasTasks = tasks.length > 0;

        res.status(200).send({ hasTasks });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while checking tasks for the expediente', details: error.message });
    }
};