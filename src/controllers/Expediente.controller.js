import ExpedienteDAO from '../daos/ExpedienteDAO.js';
import AbogadoDAO from '../daos/AbogadoDAO.js';
import Expediente from '../models/Expediente.js';
import ExpedienteDetalleDAO from '../daos/ExpedienteDetDao.js';
import ExpedienteDetalle from '../models/ExpedienteDet.js';
import CreditoSialDAO from '../daos/CreditosSialDAO.js';
import { initializeBrowser, fillExpTribunalA, scrappingDet, scrappingPdf } from '../helpers/webScraping.js';
import path from "path"
import TareaDAO from '../daos/TareaDAO.js';
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import csv from 'csvtojson';
import expedienteQueue from '../workers/expedienteWorker.js';
import emailQueue from '../workers/EmailWorker.js';

import { generateMissingExpedientesEmailContent } from '../helpers/EmailFuncionts.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = path.resolve(__dirname, '../');
const pdfDirectory = path.join(projectRoot, 'pdfs');

export const createExpediente = async (req, res) => {
    const { numero, nombre, url } = req.body;
    const { userId } = req;

    let browser;
    let page;

    try {
        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const parsedNumero = parseInt(numero, 10);
        if (!parsedNumero || !nombre) {
            return res.status(400).send({ error: 'Missing required fields: numero and nombre are required.' });
        }

        const expedientInSial = await CreditoSialDAO.getByNumCredito(parsedNumero);

        if (expedientInSial.length === 0) {
            return res.status(400).send({ error: 'The expediente does not exist in CreditosSIAL.' });
        }

        const existingExpedientes = await ExpedienteDAO.findByNumero(parsedNumero);
        if (existingExpedientes.length > 0) {
            return res.status(400).send({ error: 'An expediente with this number already exists.' });
        }

        let scrapedData = {};
        let scrapedDetails = [];

        if (url) {
            try {
                ({ browser, page } = await initializeBrowser());

                scrapedData = await fillExpTribunalA(page, url);
                if (!scrapedData || Object.keys(scrapedData).length === 0) {
                    return res.status(500).send({ error: 'Scraping failed for the provided URL.' });
                }

                const { juzgado = '', expediente = '' } = scrapedData;

                if (!expediente || !juzgado) {
                    return res.status(500).send({ error: 'Scraping failed for the provided URL.' });
                }

                scrapedDetails = await scrappingDet(page, url);
            } catch (scrapingError) {
                console.error(scrapingError);
                return res.status(500).send({ error: 'Tribunal doesn\'t work' });
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
        const expedientesConDetalles = await ExpedienteDAO.findAllWithDetails();

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
                if (!scrapedData || Object.keys(scrapedData).length === 0) {
                    return res.status(500).send({ error: 'Scraping failed for the provided URL.' });
                }

                const { juzgado = '', juicio = '', ubicacion = '', partes = '', expediente = '' } = scrapedData;

                if (!expediente || !juzgado) {
                    return res.status(500).send({ error: 'Scraping failed for the provided URL.' });
                }

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
                return res.status(500).send({ error: 'Tribunal doesn\'t work' });
            } finally {
                if (browser) await browser.close();
            }
        } else {
            return res.status(400).send({ error: 'URL does not exist' });
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

        await TareaDAO.deleteNonPendingTasksByExpTribunalANumero(numero);

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
            res.status(500).send({ error: 'Tribunal doesn\'t work' });

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
        let { isUpdatable } = req.body;
        const files = req.files;

        isUpdatable = isUpdatable === 'true' || isUpdatable === true;

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
        const requiredHeaders = ['expediente', 'url'];
        let expedientestoUpdate = [];
        let missingExpedientes = [];

        for (const file of files) {
            const csvBuffer = file.buffer.toString('utf-8');
            const jsonArray = await csv().fromString(csvBuffer);
            const currentHeaders = Object.keys(jsonArray[0]).map(header => header.toLowerCase());
            const missingFields = requiredHeaders.filter(header => !currentHeaders.includes(header));

            if (missingFields.length > 0) {
                return res.status(400).json({ message: 'Invalid Fields in the files' });
            }

            for (const row of jsonArray) {
                const expediente = row['Expediente'] || row['expediente'] || row['EXPEDIENTE'];
                const url = row['Url'] || row['url'] || row['URL'];

                if (!expediente || !url) {
                    continue; 
                }

                const acreditadoData = await CreditoSialDAO.getAcreditadoByNumCredito(expediente);

                if (acreditadoData.length === 0) {
                    missingExpedientes.push(expediente);
                    continue;
                }

                const acreditado = acreditadoData[0].acreditado;
                const existingEntries = await ExpedienteDAO.findByNumero(expediente);

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

                expedientestoUpdate.push({ numero: expediente, url, nombre: acreditado });
            }
        }

        if (missingExpedientes.length > 0) {
            const { subject, text } = generateMissingExpedientesEmailContent(missingExpedientes);
            await emailQueue.add({
                to: user.email,
                subject,
                text,
            });
        }

        if (isUpdatable) {
            const job = await expedienteQueue.add({
                userEmail: user.email,
                expedientes: expedientestoUpdate
            });
            return res.status(202).json({ jobId: job.id, message: 'Expedientes update process started with the provided CSV expedientes' });
        }

        res.status(200).json({ message: 'The CSV files have been processed successfully without updating expedientes via worker.' });
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
        const job = await expedienteQueue.add({
            userEmail: user.email
        });
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

        let result = null;
        if (state === 'completed') {
            result = job.returnvalue;
        }

        else if (state === 'failed') {
            result = job.failedReason;
        }

        res.send({ state, progress, result });
    } catch (error) {
        console.error('Error retrieving job status:', error);
        res.status(500).send({ error: 'An error occurred while retrieving job status' });
    }
};

