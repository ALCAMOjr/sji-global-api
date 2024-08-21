import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const { NODE_ENV } = process.env;

const isDevelopmentOrTest = NODE_ENV === 'development' || NODE_ENV === 'test';

const transporter = nodemailer.createTransport({
    host: isDevelopmentOrTest ? 'smtp.gmail.com' : 'mail.sjiglobal.com',
    port: isDevelopmentOrTest ? 587 : 465,
    secure: NODE_ENV === 'production', 
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

export default transporter;

transporter.verify().then(() => {
    console.log("Ready to send emails");
}).catch((error) => {
    console.error("Error verifying SMTP connection:", error);
});

export const sendEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: to,
            subject: subject,
            text: text,
        };

        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};


export const generateWelcomeEmail = (nombre, username, password) => {
    const subject = 'Bienvenido';
    const text = `Hola ${nombre},\n\nTe damos la bienvenida. Tu usuario es ${username} y tu contraseña es ${password}.\n\nSaludos,\nEl equipo de Tareas`;
    return { subject, text };
};

export const generateTaskCancellationEmail = (abogado, exptribunalA_numero, taskId) => {
    const subject = 'Tarea Cancelada por Vencimiento';
    const text = `Hola ${abogado.nombre} ${abogado.apellido},\n\nLa tarea asignada al expediente ${exptribunalA_numero} ha sido cancelada debido al vencimiento de la fecha de entrega.\n\nSaludos,\nEquipo de Gestión de Tareas`;
    return { subject, text };
};


export const generateTaskCancellationForCoordinatorEmail = (taskId, exptribunalA_numero, abogado) => {
    const subject = 'Tarea Cancelada por Vencimiento';
    const text = `Hola,\n\nLa tarea con ID ${taskId}, asignada al expediente ${exptribunalA_numero}, ha sido cancelada debido al vencimiento de la fecha de entrega. El abogado responsable era ${abogado.nombre} ${abogado.apellido}.\n\nSaludos,\nEquipo de Gestión de Tareas`;
    return { subject, text };
};

export const generateTaskAssignmentEmail = (abogado, exptribunalA_numero) => {
    const subject = 'Nueva tarea asignada';
    const text = `Hola ${abogado.nombre},\n\nSe te ha asignado una nueva tarea para el expediente ${exptribunalA_numero}.\n\nSaludos,\nEquipo de Gestión de Tareas`;
    return { subject, text };
};

export const generateTaskCompletionEmail = (user, taskId) => {
    const subject = 'Tarea completada';
    const text = `Hola,\n\nEl abogado ${user.nombre} ${user.apellido} ha completado la tarea con ID ${taskId}.\n\nSaludos,\nEquipo de Gestión de Tareas`;
    return { subject, text };
};



export const getMexicoCityDate = (date) => {
    const timeZone = 'America/Mexico_City';
    const zonedDate = toZonedTime(date, timeZone);
    return formatInTimeZone(zonedDate, timeZone, 'yyyy-MM-dd');
};