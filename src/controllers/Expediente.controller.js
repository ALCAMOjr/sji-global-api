import ExpedienteDAO from '../utils/ExpedienteDAO.js';
import AbogadoDAO from '../utils/AbogadoDAO.js';
import Expediente from '../models/Expediente.js';
import ExpedienteDetalleDAO from '../utils/ExpedienteDetDao.js';
import ExpedienteDetalle from '../models/ExpedienteDet.js';
import CreditoSialDAO from '../utils/CreditosSialDAO.js';
import { initializeBrowser, fillExpTribunalA, scrappingDet, scrappingPdf } from '../helpers/webScraping.js';
import path from "path"
import TareaDAO from '../utils/TareaDAO.js';
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import csv from 'csvtojson';
import expedienteQueue from '..//helpers/expedienteWorker.js';

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
        let page;



        if (url) {
            try {
                ({ browser, page } = await initializeBrowser());

                scrapedData = await fillExpTribunalA(page, url);
                scrapedDetails = await scrappingDet(page, url);
            } catch (scrapingError) {
                console.error(scrapingError)
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
        if (!user) {
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
            console.error(scrapingError);
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
        res.status(200).sendFile(filePath);
    } else {
        res.status(404).send({ error: 'PDF not found.' });
    }
};

export const uploadCsvExpediente = async (req, res) => {
    try {
        const { userId } = req;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const fileExtension = files[0].originalname.split('.').pop().toLowerCase();
        if (fileExtension !== 'csv') {
            return res.status(400).json({ message: 'Invalid file format. Only CSV files are allowed.' });
        }

        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        let isFirstFile = true;
        let baseHeaders = [];

        for (const file of files) {
            const csvBuffer = file.buffer.toString('utf-8');
            const jsonArray = await csv().fromString(csvBuffer);

            if (isFirstFile) {
                baseHeaders = Object.keys(jsonArray[0]);
                if (baseHeaders.length !== 2 || !baseHeaders.includes('Expediente') || !baseHeaders.includes('Url')) {
                    return res.status(400).json({ message: 'The CSV files must contain only "Expediente" and "Url" fields.' });
                }
                isFirstFile = false;
            } else {
                const currentHeaders = Object.keys(jsonArray[0]);
                if (currentHeaders.length !== baseHeaders.length || !currentHeaders.every((header, index) => header === baseHeaders[index])) {
                    return res.status(400).json({ message: 'All CSV files must have the same fields.' });
                }
            }

            for (const row of jsonArray) {
                const expediente = row['Expediente'];
                const url = row['Url'];

                const existingEntries = await ExpedienteDAO.findByNumero(expediente);

                const acreditadoData = await CreditoSialDAO.getAcreditadoByNumCredito(expediente);
                const acreditado = acreditadoData.length > 0 ? acreditadoData[0].acreditado : null;

                if (existingEntries.length > 0) {
                    const existingEntry = existingEntries[0];
                    const updatedEntry = {
                        ...existingEntry,
                        url,
                        nombre: acreditado || existingEntry.nombre,
                    };
                    await ExpedienteDAO.update(updatedEntry);
                } else {
                    const newEntry = {
                        numero: expediente,
                        nombre: acreditado,
                        url,
                        expediente: null,
                        juzgado: null,
                        juicio: null,
                        ubicacion: null,
                        partes: null,
                    };
                    await ExpedienteDAO.create(newEntry);
                }
            }
        }

        const rows = await ExpedienteDAO.findAll();
        res.status(200).json({ message: 'The CSV files have been processed and the data has been inserted/updated successfully', data: rows });
    } catch (error) {
        console.error('Error processing CSV files:', error);
        res.status(500).json({ message: 'Error processing CSV files', error });
    }
};


export const startUpdateExpedientes = async (req, res) => {
    const { userId } = req;
    const user = await AbogadoDAO.getById(userId);
    if (!user || user.user_type !== 'coordinador') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    try {
        const job = await expedienteQueue.add();
        res.status(202).send({ jobId: job.id, message: 'Expediente update process started' });
    } catch (error) {
        console.error('Error starting expediente update process:', error);
        res.status(500).send({ error: 'An error occurred while starting the expediente update process' });
    }
};

export const getJobStatus = async (req, res) => {
    const { jobId } = req.params;
    const { userId } = req;
    const user = await AbogadoDAO.getById(userId);
    if (!user || user.user_type !== 'coordinador') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    try {
        const job = await expedienteQueue.getJob(jobId);

        if (!job) {
            return res.status(404).send({ error: 'Job not found' });
        }

        const state = await job.getState();
        const progress = job.progress()

        console.log("Progreso en controlador", progress)

        let result = null;
        if (state === 'completed') {
            result = job.returnvalue; 

        }
        res.send({ state, progress, result });
    } catch (error) {
        console.error('Error retrieving job status:', error);
        res.status(500).send({ error: 'An error occurred while retrieving job status' });
    }
};
