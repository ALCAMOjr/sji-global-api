import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

export const generateWelcomeEmail = (nombre, username, password) => {
    const subject = 'Bienvenido';
    const text = `Hola ${nombre},\n\nTe damos la bienvenida. Tu usuario es ${username} y tu contraseña es ${password}.\n\nSaludos,\nEquipo de Soporte Técnico`;
    return { subject, text };
};

export const generateTaskAssignmentEmail = (abogado, exptribunalA_numero) => {
    const subject = 'Nueva asignación de expediente';
    const text = `Hola ${abogado.nombre},\n\nSe te ha asignado un nuevo expediente con el número ${exptribunalA_numero}.\n\nSaludos,\nEquipo de Soporte Técnico`;
    return { subject, text };
};

export const generateTaskCompletionEmail = (user, taskId) => {
    const subject = 'Expediente actualizado';
    const text = `Hola,\n\nEl usuario ${user.nombre} ${user.apellido} ha completado la actualización del expediente con ID ${taskId}.\n\nSaludos,\nEquipo de Soporte Técnico`;
    return { subject, text };
};

export const getMexicoCityDate = (date) => {
    const timeZone = 'America/Mexico_City';
    return formatInTimeZone(date, timeZone, 'yyyy-MM-dd');
};

export const generateEmailContentScrapingFailUser = (errorMessage) => {
    const subject = 'Error en el proceso de actualización de expedientes';
    const text = `Hubo un error durante el proceso de actualización de expedientes. Detalles del error: ${errorMessage}.\n\nPor favor, intente de nuevo o contacte al soporte técnico.`;
    
    return { subject, text };
};

export const generateEmailContentScrapingFailSupport = (errorMessage) => {
    const subject = 'Error en el proceso de actualización de expedientes';
    const text = `Hubo un error durante el proceso de actualización de expedientes. Detalles del error: ${errorMessage}.\n\nPor favor, revisa este fallo lo antes posible.`;
    
    return { subject, text };
};

export const generateEmailContentSuccess = () => {
    const subject = 'Proceso de actualización de expedientes completado';
    const text = 'El proceso de actualización de expedientes se completó exitosamente sin errores.';

    return { subject, text };
};

export const generateEmailContentPartialSuccess = (expedientesFallidos) => {
    const subject = 'Proceso de actualización de expedientes completado con fallos';
    const fallidosList = expedientesFallidos.map(exp => `Número: ${exp.numero}, Error: ${exp.error}`).join('\n');
    const text = `El proceso de actualización se ejecutó correctamente excepto para los siguientes expedientes:\n${fallidosList}.`;

    return { subject, text };
};

export const generateEmailContentCriticalError = (errorMessage, isForSupport = false) => {
    const subject = 'Error Crítico en el Proceso de Actualización de Expedientes';
    const textForUser = `
        Estimado usuario,

        Ocurrió un error inesperado durante el proceso de actualización de expedientes. 
        El sistema no pudo completar la operación debido a un fallo crítico.

        Detalles del error:
        ${errorMessage}

        Por favor, contacte al equipo de soporte técnico para obtener más información y asistencia.

        Atentamente,
        Equipo de Soporte Técnico
    `;

    const textForSupport = `
        Estimado equipo de soporte,

        Ocurrió un error crítico durante el proceso de actualización de expedientes.
        El sistema se detuvo de forma inesperada.

        Detalles del error:
        ${errorMessage}

        Por favor, revisen este problema lo antes posible.

        Atentamente,
        Sistema de monitoreo
    `;

    const text = isForSupport ? textForSupport : textForUser;

    return { subject, text };
};
