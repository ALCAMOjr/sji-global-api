import { initializeBrowser, fillExpTribunalA, scrappingDet } from './webScraping.js';
import ExpedienteDAO from '../utils/ExpedienteDAO.js';
import Expediente from '../models/Expediente.js';
import ExpedienteDetalleDAO from '../utils/ExpedienteDetDao.js';
import ExpedienteDetalle from '../models/ExpedienteDet.js';
export const updateExpedientes = async () => {
    let browser;
    let page;
    
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
                } catch (scrapingError) {
                    console.error(`Error durante el scraping para el expediente número ${numero}:`, scrapingError);
                } finally {
                    if (browser) {
                        try {
                            await browser.close();
                        } catch (closeError) {
                            console.error('Error cerrando el navegador:', closeError);
                        }
                    }
                }
            }
        }

        console.info('Todos los expedientes han sido procesados.');
    } catch (error) {
        console.error('Ocurrió un error actualizando los expedientes:', error);
    }
};
