import { pool } from "../db.js";
import { format } from 'date-fns';
import { sendEmail } from './Mailer.js';

export const checkAndCancelOverdueTasks = async () => {
    try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const [overdueTasks] = await pool.query(
            'SELECT * FROM Tareas WHERE fecha_entrega < ? AND estado_tarea IN (?, ?)',
            [today, 'Asignada', 'Iniciada']
        );

        if (overdueTasks.length > 0) {
            for (const task of overdueTasks) {
                const { id: taskId, abogado_id, exptribunalA_numero } = task;
                const fecha_cancelacion = format(new Date(), 'yyyy-MM-dd');
                await pool.query('UPDATE Tareas SET estado_tarea = ?, fecha_cancelacion = ? WHERE id = ?', ['Cancelada', fecha_cancelacion, taskId]);

                const [abogados] = await pool.query('SELECT * FROM abogados WHERE id = ?', [abogado_id]);
                if (abogados.length > 0) {
                    const abogado = abogados[0];
                    const subject = 'Tarea Cancelada por Vencimiento';
                    const text = `Hola ${abogado.nombre} ${abogado.apellido},\n\nLa tarea asignada al expediente ${exptribunalA_numero} ha sido cancelada debido al vencimiento de la fecha de entrega.\n\nSaludos,\nEquipo de Gestión de Tareas`;

                    await sendEmail(abogado.email, subject, text);

                    const [coordinadores] = await pool.query('SELECT * FROM abogados WHERE user_type = "coordinador"');
                    const coordSubject = 'Tarea Cancelada por Vencimiento';
                    const coordText = `Hola,\n\nLa tarea con ID ${taskId}, asignada al expediente ${exptribunalA_numero}, ha sido cancelada debido al vencimiento de la fecha de entrega. El abogado responsable era ${abogado.nombre} ${abogado.apellido}.\n\nSaludos,\nEquipo de Gestión de Tareas`;

                    for (const coordinador of coordinadores) {
                        await sendEmail(coordinador.email, coordSubject, coordText);
                    }
                }
            }
        } else {
            console.log('No hay tareas vencidas para cancelar.');
        }
    } catch (error) {
        console.error('Error al verificar y cancelar tareas vencidas:', error);
    }
};
