import { isBefore, startOfDay, format } from 'date-fns';
import { sendEmail } from './Mailer.js';
import TareaDAO from '../utils/TareaDAO.js';
import AbogadoDAO from '../utils/AbogadoDAO.js';
import { generateTaskCancellationEmail, generateTaskCancellationForCoordinatorEmail } from '../helpers/Mailer.js'; // Ajusta la ruta según sea necesario

export const checkAndCancelOverdueTasks = async () => {
    try {
        const today = startOfDay(new Date()); 

        const overdueTasks = await TareaDAO.findExpedientesConTareas();

        const filteredOverdueTasks = overdueTasks.filter(task => {
            const fechaEntrega = new Date(task.fecha_entrega);
            return isBefore(fechaEntrega, today) && (task.estado_tarea === 'Asignada' || task.estado_tarea === 'Iniciada');
        });

        if (filteredOverdueTasks.length > 0) {
            for (const task of filteredOverdueTasks) {
                const { tareaId: taskId, abogadoId, exptribunalA_numero } = task;
                const fecha_cancelacion = format(new Date(), 'yyyy-MM-dd');

                await TareaDAO.cancelTask(taskId, fecha_cancelacion);

                const abogado = await AbogadoDAO.getById(abogadoId);
                if (abogado) {
                    const { subject, text } = generateTaskCancellationEmail(abogado, exptribunalA_numero, taskId);
                    await sendEmail(abogado.email, subject, text);

                    const coordinadores = await AbogadoDAO.getAllCoordinadores();
                    const { subject: coordSubject, text: coordText } = generateTaskCancellationForCoordinatorEmail(taskId, exptribunalA_numero, abogado);

                    for (const coordinador of coordinadores) {
                        await sendEmail(coordinador.email, coordSubject, coordText);
                    }
                }
            }
           
        }
    } catch (error) {
        console.error('Error al verificar y cancelar tareas vencidas:', error);
    }
};
