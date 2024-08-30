import Queue from 'bull';
import { initializeBrowser, fillExpTribunalA, scrappingDet } from '../helpers/webScraping.js';
import Expediente from '../models/Expediente.js';
import ExpedienteDetalleDAO from '../utils/ExpedienteDetDao.js';
import ExpedienteDetalle from '../models/ExpedienteDet.js';
import ExpedienteDAO from '../utils/ExpedienteDAO.js';
import dotenv from 'dotenv';

dotenv.config();



    const expedienteQueue = new Queue('expedienteQueue', {
        redis: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            password: process.env.REDIS_PASS,
            username: process.env.REDIS_USER,
            db: 0,
            connectTimeout: 10000,
            
        }
    });




expedienteQueue.process(5, async (job) => {
    let browser, page;
    let expedientesConDetalles = [];
    let processedCount = 0;

    try {
        const expedientes = await ExpedienteDAO.findAll();
        for (const expediente of expedientes) {
            const { numero, url } = expediente;
            if (url) {
                try {
                    ({ browser, page } = await initializeBrowser());
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

                } finally {
                    if (browser) await browser.close();
                }
                processedCount++;
                
                const progress = Math.round((processedCount / expedientes.length) * 100);

                console.log("Progeso en iteracion", progress)
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
        return expedientesConDetalles;

    } catch (error) {
        console.error('Error during the expediente update process:', error);
        throw new Error('Error during the expediente update process');
    }
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
