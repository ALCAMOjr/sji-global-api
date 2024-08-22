import ExpedienteDAO from '../utils/ExpedienteDAO.js';
import AbogadoDAO from '../utils/AbogadoDAO.js';
import Expediente from '../models/Expediente.js';
import ExpedienteDetalleDAO from '../utils/ExpedienteDetDao.js';
import ExpedienteDetalle from '../models/ExpedienteDet.js';
import { initializeBrowser, fillExpTribunalA, scrappingDet, scrappingPdf } from '../helpers/webScraping.js';
import path from "path"
import TareaDAO from '../utils/TareaDAO.js';
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = path.resolve(__dirname, '../');
const pdfDirectory = path.join(projectRoot, 'pdfs'); 

export const createExpediente = async (req, res) => {
    const { numero, nombre, url } = req.body;
    const { userId } = req;

    try {
        // Verificar el tipo de usuario
        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const parsedNumero = parseInt(numero, 10);
        if (!parsedNumero || !nombre) {
            return res.status(400).send({ error: 'Missing required fields: numero and nombre are required.' });
        }

        const existingExpedientes = await ExpedienteDAO.findByNumero(parsedNumero);
        if (existingExpedientes.length > 0) {
            return res.status(400).send({ error: 'An expediente with this number already exists.' });
        }

        let scrapedData = {};
        let scrapedDetails = [];
        let browser;

        if (url) {
            try {
                ({ browser, page } = await initializeBrowser());

                scrapedData = await fillExpTribunalA(page, url);
                scrapedDetails = await scrappingDet(page, url);
            } catch (scrapingError) {
                return res.status(500).send({ error: 'Scraping failed for the provided URL.' });
            } finally {
                if (browser) {
                    await browser.close();
                }
            }
        }
        const expediente = new Expediente(parsedNumero, nombre, url, scrapedData.expediente, scrapedData.juzgado, scrapedData.juicio, scrapedData.ubicacion, scrapedData.partes);
        await ExpedienteDAO.create(expediente);

        if (scrapedDetails.length > 0) {
            for (const detail of scrapedDetails) {
                const expedienteDetalle = new ExpedienteDetalle(null, detail.verAcuerdo, detail.fecha, detail.etapa, detail.termino, detail.notificacion, scrapedData.expediente, parsedNumero);
                await ExpedienteDetalleDAO.create(expedienteDetalle);
            }
        }
        const newExpedientes = await ExpedienteDAO.findByNumero(parsedNumero);
        if (newExpedientes.length <= 0) {
            return res.status(404).send({ error: 'Expediente not found after creation' });
        }
        const newExpediente = newExpedientes[0];
        const detalles = await ExpedienteDetalleDAO.findByExpTribunalANumero(parsedNumero);
        res.status(201).send({
            ...newExpediente,
            detalles
        });

    } catch (error) {
        console.error('Error en createExpediente:', error.message);
        res.status(500).send({ error: 'An error occurred while creating the expediente' });
    }
};

export const getAllExpedientes = async (req, res) => {
    try {
        const { userId } = req;
        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const expedientes = await ExpedienteDAO.findAll();

        const expedientesConDetalles = [];

        for (const expediente of expedientes) {
            const detalles = await ExpedienteDetalleDAO.findByExpTribunalANumero(expediente.numero);

            expedientesConDetalles.push({
                ...expediente,
                detalles
            });
        }

        res.status(200).send(expedientesConDetalles);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while retrieving expedientes' });
    }
};

export const getExpedientesByNumero = async (req, res) => {
    try {
        const { numero } = req.params;
        const { userId } = req;
        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const expediente = await ExpedienteDAO.findByNumero(numero);
        if (expediente.length <= 0) {
            return res.status(404).send({ error: 'Expediente not found' });
        }
        const expedienteData = expediente[0];
        const detalles = await ExpedienteDetalleDAO.findByExpTribunalANumero(numero);
        res.status(200).send({
            ...expedienteData,
            detalles
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while retrieving the expediente' });
    }
};

export const updateExpediente = async (req, res) => {
    let browser;
    let page;

    try {
        const { numero } = req.params;
        let { nombre, url } = req.body;
        const { userId } = req;

        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const existingExpedientes = await ExpedienteDAO.findByNumero(numero);
        if (existingExpedientes.length <= 0) {
            return res.status(404).send({ error: 'Expediente not found' });
        }

        if (url) {
            try {
                ({ browser, page } = await initializeBrowser());
                const scrapedData = await fillExpTribunalA(page, url);
                const { juzgado = '', juicio = '', ubicacion = '', partes = '', expediente = '' } = scrapedData;

                await ExpedienteDAO.update(new Expediente(numero, nombre, url, expediente, juzgado, juicio, ubicacion, partes));

                await ExpedienteDetalleDAO.deleteByExpTribunalANumero(numero);
                const scrapedDetails = await scrappingDet(page, url);
                if (scrapedDetails.length > 0) {
                    for (const detail of scrapedDetails) {
                        const expedienteDetalle = new ExpedienteDetalle(null, detail.verAcuerdo, detail.fecha, detail.etapa, detail.termino, detail.notificacion, expediente, numero);
                        await ExpedienteDetalleDAO.create(expedienteDetalle);
                    }
                }
            } catch (scrapingError) {
                return res.status(500).send({ error: 'Scraping failed for the provided URL.' });
            } finally {
                if (browser) await browser.close();
            }
        } else {
            await ExpedienteDAO.update(new Expediente(numero, nombre));
        }

        const updatedExpedientes = await ExpedienteDAO.findByNumero(numero);
        if (updatedExpedientes.length <= 0) {
            return res.status(404).send({ error: 'Expediente not found after update' });
        }
        const updatedExpediente = updatedExpedientes[0];

        const detalles = await ExpedienteDetalleDAO.findByExpTribunalANumero(numero);
        res.status(200).send({
            ...updatedExpediente,
            detalles
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while updating the expediente' });
    }
};
export const updateExpedientes = async (req, res) => {
    let browser;
    let page;
    const { userId } = req;
    let expedientesConDetalles = [];  
    try {
        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

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

                } catch (scrapingError) {
                    console.error(`Error during scraping for expediente number ${numero}:`, scrapingError);
                } finally {
                    if (browser) {
                        try {
                            await browser.close();
                        } catch (closeError) {
                            console.error('Error closing browser:', closeError);
                        }
                    }
                }
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

        res.status(200).send(expedientesConDetalles);

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while updating expedientes' });
    }
};


export const deleteExpediente = async (req, res) => {
    try {
        const { numero } = req.params;
        const { userId } = req;

    
        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const existingExpedientes = await ExpedienteDAO.findByNumero(numero);
        if (existingExpedientes.length <= 0) {
            return res.status(404).send({ error: 'Expediente not found' });
        }

        const pendingTasks = await TareaDAO.findPendingTasksByExpTribunalANumero(numero);
        if (pendingTasks.length > 0) {
            return res.status(400).send({ error: 'Cannot delete expediente with pending tasks' });
        }

        await ExpedienteDetalleDAO.deleteByExpTribunalANumero(numero);
        const result = await ExpedienteDAO.delete(numero);


        if (result.affectedRows <= 0) {
            return res.status(404).send({ error: 'Failed to delete expediente' });
        }

        res.sendStatus(204);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while deleting the expediente' });
    }
}; 

export const getPdf = async (req, res) => {
    const { userId } = req;
    const { url, fecha } = req.body;

    if (!url || !fecha) {
        return res.status(400).send({ error: 'URL and date are required.' });
    }

    try {
        const user = await AbogadoDAO.getById(userId);
        if (!user) {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        let browser;
        let page;

        try {
            ({ browser, page } = await initializeBrowser());

            const pdfPath = await scrappingPdf(page, url, browser, fecha);

            if (pdfPath) {
                const fileName = path.basename(pdfPath);
                res.status(200).send({ pdfPath: `/expediente/filename/${fileName}` });
            } else {
                res.status(404).send({ error: 'PDF not found.' });
            }

        } catch (scrapingError) {
            console.error('Error durante el scraping del PDF:', scrapingError.message);
            res.status(500).send({ error: 'Scraping failed for the provided URL.' });

        } finally {
            if (browser) {
                await browser.close();
            }
        }

    } catch (error) {
        console.error(error.message);
        res.status(500).send({ error: 'An error occurred while retrieving the PDF' });
    }
};

export const getFilename = async (req, res) => {
    const { filename } = req.params;
    const { userId } = req;

    const user = await AbogadoDAO.getById(userId);
    if (!user) {
        return res.status(403).send({ error: 'Unauthorized' });
    }

    const sanitizedFilename = path.basename(filename); 
    const filePath = path.join(pdfDirectory, sanitizedFilename);

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send({ error: 'PDF not found.' });
    }
};


export const deleteFilename = async (req, res) => {
    const { filename } = req.params;
    const { userId } = req
    const user = await AbogadoDAO.getById(userId);
    if (!user) {
        return res.status(403).send({ error: 'Unauthorized' });
    }
    const sanitizedFilename = path.basename(filename); 
    const filePath = path.join(pdfDirectory, sanitizedFilename);

    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            res.status(200).send({ message: 'PDF successfully deleted.' });
        } catch (error) {
            console.error(error);
            res.status(500).send({ error: 'An error occurred while deleting the PDF.' });
        }
    } else {
        res.status(404).send({ error: 'PDF not found.' });
    }
};
