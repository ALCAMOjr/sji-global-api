import Queue from 'bull';
import { initializeBrowserBatch ,fillExpTribunalA, scrappingDet } from '../helpers/webScraping.js';
import Expediente from '../models/Expediente.js';
import ExpedienteDetalleDAO from '../utils/ExpedienteDetDao.js';
import ExpedienteDetalle from '../models/ExpedienteDet.js';
import ExpedienteDAO from '../utils/ExpedienteDAO.js';
import { sendEmail, generateEmailContentScrapingFailUser, generateEmailContentCriticalError, generateEmailContentScrapingFailSupport, generateEmailContentSuccess, generateEmailContentPartialSuccess } from './Mailer.js';

const SupprtGmail = process.env.SUPORT_GMAIL
const env = process.env.NODE_ENV || 'development';

let redisConfig;


if (env === 'production') {
    redisConfig = {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASS,
        username: process.env.REDIS_USER,
        db: 0,
        connectTimeout: 10000,
    };
} else {
    redisConfig = {
        host: process.env.REDIS_HOST_DEV || 'localhost', 
        port: process.env.REDIS_PORT_DEV || 6379,
        password: process.env.REDIS_PASS_DEV, 
        username: process.env.REDIS_USER_DEV || 'default', 
        db: 0,
        connectTimeout: 10000,
    };
}

const expedienteQueue = new Queue('expedienteQueue', {
    redis: redisConfig,
    settings: {
        lockDuration: 10800000  
    }
});

expedienteQueue.process(5, async (job) => {
    let browser, page;
    let expedientesConDetalles = [];
    let expedientesFallidos = [];
    let processedCount = 0;
    const { userEmail } = job.data;
    try {
        ({ browser, page } = await initializeBrowserBatch());
    } catch (error) {
        const userEmailContent = generateEmailContentScrapingFailUser(error.message);
        const supportEmailContent = generateEmailContentScrapingFailSupport(error.message);
        await sendEmail(userEmail, userEmailContent.subject, userEmailContent.text);
        await sendEmail(SupprtGmail, supportEmailContent.subject, supportEmailContent.text);
        await job.moveToFailed({ message: 'Tribunal doesn\'t work' });
        if (browser) await browser.close();
        return;
    } 
    try {
        const expedientes = await ExpedienteDAO.findAll();
        for (const expediente of expedientes) {
            const { numero, url } = expediente;
            if (url) {
                try {
                    const scrapedData = await fillExpTribunalA(page, url);
                    const { juzgado = '', juicio = '', ubicacion = '', partes = '', expediente: scrapedExpediente = '' } = scrapedData;

                    await ExpedienteDAO.update(new Expediente(numero, expediente.nombre, url, scrapedExpediente, juzgado, juicio, ubicacion, partes));
                    await ExpedienteDetalleDAO.deleteByExpTribunalANumero(numero);

                    const scrapedDetails = await scrappingDet(page, url);
                    if (scrapedDetails.length > 0) {
                        for (const detail of scrapedDetails) {
                            const expedienteDetalle = new ExpedienteDetalle(null, detail.verAcuerdo, detail.fecha, detail.etapa, detail.termino, detail.notificacion, scrapedExpediente, numero);
                            await ExpedienteDetalleDAO.create(expedienteDetalle);
                        }
                    }

                } catch (error) {
                    expedientesFallidos.push({
                        numero,
                        error: error.message
                    });
                    continue;
                }
                processedCount++;
                const progress = Math.round((processedCount / expedientes.length) * 100);
                job.progress(progress);
            }
        }
        const updatedExpedientes = await ExpedienteDAO.findAll();
        for (const expediente of updatedExpedientes) {
            const detalles = await ExpedienteDetalleDAO.findByExpTribunalANumero(expediente.numero);
            expedientesConDetalles.push({
                ...expediente,
                detalles
            });
        }

    } catch (error) {
  
        const userErrorEmailContent = generateEmailContentCriticalError(error.message, false);
        await sendEmail(userEmail, userErrorEmailContent.subject, userErrorEmailContent.text);
    
        const supportErrorEmailContent = generateEmailContentCriticalError(error.message, true);
        await sendEmail(SupprtGmail, supportErrorEmailContent.subject, supportErrorEmailContent.text);
    
        await job.moveToFailed({ message: `Something was wrong ${error.message}` });
    } finally {
        if (browser) await browser.close();
    }
    if (expedientesFallidos.length === 0) {
        const successEmailContent = generateEmailContentSuccess();
        await sendEmail(userEmail, successEmailContent.subject, successEmailContent.text);
        await sendEmail(SupprtGmail, successEmailContent.subject, successEmailContent.text);
    } else {
        const partialSuccessEmailContent = generateEmailContentPartialSuccess(expedientesFallidos);
        await sendEmail(userEmail, partialSuccessEmailContent.subject, partialSuccessEmailContent.text);
        await sendEmail(SupprtGmail, partialSuccessEmailContent.subject, partialSuccessEmailContent.text);
    }

    return {
        expedientesConDetalles,
    };
});






export const cleanJobs = async (states) => {
    try {
        const jobs = await expedienteQueue.getJobs(states);
        for (const job of jobs) {
            await job.remove();
        }
    } catch (error) {
        console.error(`Error cleaning jobs in states ${states}:`, error);
    }
};


export const clearWorkspace = async () => {
    try {

        await expedienteQueue.empty(); 
        await expedienteQueue.clean(0, 'completed'); 
        await expedienteQueue.clean(0, 'failed');
        await expedienteQueue.clean(0, 'delayed'); 
        await expedienteQueue.clean(0, 'wait');
        await expedienteQueue.clean(0, 'active'); 
        await expedienteQueue.clean(0, 'paused'); 
        const repeatableJobs = await expedienteQueue.getRepeatableJobs();
        for (const job of repeatableJobs) {
            await expedienteQueue.removeRepeatableByKey(job.key);
        }

        console.log('Workspace has been successfully cleared.');
    } catch (error) {
        console.error('Error clearing workspace:', error);
    }
};


export default expedienteQueue;
