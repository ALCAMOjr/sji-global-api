import { pool } from "../db.js";
import dotenv from 'dotenv';
import { initializeBrowser, fillExpTribunalA, scrappingDet } from '../helpers/webScraping.js';

dotenv.config();

export const createExpediente = async (req, res) => {
    const { numero, nombre, url } = req.body;
    const { userId } = req;

    try {
        const parsedNumero = parseInt(numero, 10);

        if (!parsedNumero || !nombre) {
            return res.status(400).send({ error: 'Missing required fields: numero and nombre are required.' });
        }
        const [existingExpedientes] = await pool.query('SELECT * FROM expTribunalA WHERE numero = ?', [parsedNumero]);
        if (existingExpedientes.length > 0) {
            return res.status(400).send({ error: 'An expediente with this number already exists.' });
        }

        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).send({ error: 'Invalid user id' });
        }
        const user = users[0];
        if (user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        let scrapedData = {};
        let scrapedDetails = [];
        if (url) {
            try {
                const { browser, page } = await initializeBrowser();
                scrapedData = await fillExpTribunalA(page, url);
                scrapedDetails = await scrappingDet(page, url);
                await browser.close();
            } catch (scrapingError) {
                console.error('Error during scraping:', scrapingError);
                return res.status(500).send({ error: 'Scraping failed for the provided URL.' });
            }
        }

        const { juzgado = '', juicio = '', ubicacion = '', partes = '', expediente = '' } = scrapedData;

        await pool.query(
            'INSERT INTO expTribunalA (numero, nombre, url, expediente, juzgado, juicio, ubicacion, partes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [parsedNumero, nombre, url, expediente, juzgado, juicio, ubicacion, partes]
        );

        if (scrapedDetails.length > 0) {
            const detalleValues = scrapedDetails.map(detail => [
                detail.verAcuerdo,
                detail.fecha,
                detail.etapa,
                detail.termino,
                detail.notificacion,
                expediente,
                parsedNumero 
            ]);

            const insertDetalleQuery = `
                INSERT INTO expTribunalDetA (ver_acuerdo, fecha, etapa, termino, notificacion, expediente, expTribunalA_numero)
                VALUES ?
            `;
            await pool.query(insertDetalleQuery, [detalleValues]);
        }

        const [newExpedientes] = await pool.query('SELECT * FROM expTribunalA WHERE numero = ?', [parsedNumero]);
        if (newExpedientes.length <= 0) {
            return res.status(404).send({ error: 'Expediente not found after creation' });
        }
        const newExpediente = newExpedientes[0];

        const [detalles] = await pool.query('SELECT * FROM expTribunalDetA WHERE expTribunalA_numero = ?', [parsedNumero]);
        res.status(200).send({
            ...newExpediente,
            detalles
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while creating the expediente' });
    }
};

export const getAllExpedientes = async (req, res) => {
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

        const [expedientes] = await pool.query('SELECT * FROM expTribunalA');

        const expedientesConDetalles = [];

        for (const expediente of expedientes) {
            const [detalles] = await pool.query('SELECT * FROM expTribunalDetA WHERE expTribunalA_numero = ?', [expediente.numero]);

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
        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).send({ error: 'Invalid user id' });
        }
        const user = users[0];
        if (user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const [expedientes] = await pool.query('SELECT * FROM expTribunalA WHERE numero = ?', [numero]);
        if (expedientes.length <= 0) {
            return res.status(404).send({ error: 'Expediente not found' });
        }
        const expediente = expedientes[0];
        const [detalles] = await pool.query('SELECT * FROM expTribunalDetA WHERE expTribunalA_numero = ?', [numero]);
        res.status(200).send({
            ...expediente,
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

        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).send({ error: 'Invalid user id' });
        }
        const user = users[0];
        if (user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const [existingExpedientes] = await pool.query('SELECT * FROM expTribunalA WHERE numero = ?', [numero]);
        if (existingExpedientes.length <= 0) {
            return res.status(404).send({ error: 'Expediente not found' });
        }

        if (url) {
            try {
                ({ browser, page } = await initializeBrowser());
                const scrapedData = await fillExpTribunalA(page, url);
                const { juzgado = '', juicio = '', ubicacion = '', partes = '', expediente = '' } = scrapedData;

                await pool.query(
                    'UPDATE expTribunalA SET nombre = IFNULL(?, nombre), url = IFNULL(?, url), expediente = IFNULL(?, expediente), juzgado = ?, juicio = ?, ubicacion = ?, partes = ? WHERE numero = ?',
                    [nombre, url, expediente, juzgado, juicio, ubicacion, partes, numero]
                );

                await pool.query('DELETE FROM expTribunalDetA WHERE expTribunalA_numero = ?', [numero]);
                const scrapedDetails = await scrappingDet(page, url);
                if (scrapedDetails.length > 0) {
                    const detalleValues = scrapedDetails.map(detail => [
                        detail.verAcuerdo,
                        detail.fecha,
                        detail.etapa,
                        detail.termino,
                        detail.notificacion,
                        expediente,
                        numero
                    ]);
                    const insertDetalleQuery = `
                        INSERT INTO expTribunalDetA (ver_acuerdo, fecha, etapa, termino, notificacion, expediente, expTribunalA_numero)
                        VALUES ?
                    `;
                    await pool.query(insertDetalleQuery, [detalleValues]);
                }
            } catch (scrapingError) {
                if (!res.headersSent) {
                    return res.status(500).send({ error: 'Scraping failed for the provided URL.' });
                }
            } finally {
                if (browser) {
                    try {
                        await browser.close();
                    } catch (closeError) {
                        console.error('Error closing browser:', closeError);
                    }
                }
            }
        } else {
            await pool.query(
                'UPDATE expTribunalA SET nombre = IFNULL(?, nombre), url = IFNULL(?, url), expediente = IFNULL(?, expediente) WHERE numero = ?',
                [nombre, url, expediente, numero]
            );
        }
        const [updatedExpedientes] = await pool.query('SELECT * FROM expTribunalA WHERE numero = ?', [numero]);
        if (updatedExpedientes.length <= 0) {
            return res.status(404).send({ error: 'Expediente not found' });
        }
        const updatedExpediente = updatedExpedientes[0];
        const [detalles] = await pool.query('SELECT * FROM expTribunalDetA WHERE expTribunalA_numero = ?', [numero]);
        res.status(200).send({
            ...updatedExpediente,
            detalles
        });
    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            res.status(500).send({ error: 'An error occurred while updating the expediente' });
        }
    }
};

export const updateExpedientes = async (req, res) => {
    let browser;
    let page;
    const { userId } = req;
    try {
     
        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).send({ error: 'Invalid user id' });
        }
        const user = users[0];
        if (user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const [expedientes] = await pool.query('SELECT * FROM expTribunalA');

        for (const expediente of expedientes) {
            const { numero, url } = expediente;
            if (url) {
                try {
                    ({ browser, page } = await initializeBrowser());

                    const scrapedData = await fillExpTribunalA(page, url);
                    const { juzgado = '', juicio = '', ubicacion = '', partes = '', expediente: scrapedExpediente = '' } = scrapedData;
                    await pool.query(
                        'UPDATE expTribunalA SET nombre = IFNULL(?, nombre), url = IFNULL(?, url), expediente = IFNULL(?, expediente), juzgado = ?, juicio = ?, ubicacion = ?, partes = ? WHERE numero = ?',
                        [expediente.nombre, url, scrapedExpediente, juzgado, juicio, ubicacion, partes, numero]
                    );
                    await pool.query('DELETE FROM expTribunalDetA WHERE expTribunalA_numero = ?', [numero]);
                    const scrapedDetails = await scrappingDet(page, url);
                    if (scrapedDetails.length > 0) {
                        const detalleValues = scrapedDetails.map(detail => [
                            detail.verAcuerdo,
                            detail.fecha,
                            detail.etapa,
                            detail.termino,
                            detail.notificacion,
                            scrapedExpediente,
                            numero
                        ]);
                        const insertDetalleQuery = `
                            INSERT INTO expTribunalDetA (ver_acuerdo, fecha, etapa, termino, notificacion, expediente, expTribunalA_numero)
                            VALUES ?
                        `;
                        await pool.query(insertDetalleQuery, [detalleValues]);
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

        res.status(200).send({ message: 'All expedientes processed.' });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while updating expedientes' });
    }
};


export const deleteExpediente = async (req, res) => {
    try {
        const { numero } = req.params;
        const { userId } = req;

        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).send({ error: 'Invalid user id' });
        }
        const user = users[0];
        if (user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }
        const [existingExpedientes] = await pool.query('SELECT * FROM expTribunalA WHERE numero = ?', [numero]);
        if (existingExpedientes.length <= 0) {
            return res.status(404).send({ error: 'Expediente not found' });
        }
        await pool.query('DELETE FROM expTribunalDetA WHERE expTribunalA_numero = ?', [numero]);
        const [result] = await pool.query('DELETE FROM expTribunalA WHERE numero = ?', [numero]);

        if (result.affectedRows <= 0) {
            return res.status(404).send({ error: 'Failed to delete expediente' });
        }

        res.sendStatus(204); 
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while deleting the expediente' });
    }
};
