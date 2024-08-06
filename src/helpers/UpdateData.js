import { pool } from "../db.js";
import { initializeBrowser, fillExpTribunalA, scrappingDet } from './webScraping.js';
import logger from './logger.js';

export const updateExpedientes = async () => {
    let browser;
    let page;
    try {
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

                    logger.info(`Expediente número ${numero} procesado correctamente.`);
                } catch (scrapingError) {
                    logger.error(`Error durante el scraping para el expediente número ${numero}: ${scrapingError}`);
                } finally {
                    if (browser) {
                        try {
                            await browser.close();
                        } catch (closeError) {
                            logger.error('Error cerrando el navegador:', closeError);
                        }
                    }
                }
            }
        }

        logger.info('Todos los expedientes han sido procesados.');
    } catch (error) {
        logger.error('Ocurrió un error actualizando los expedientes:', error);
    }
};