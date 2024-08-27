import puppeteer from 'puppeteer';
import cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'node:path';

const username = process.env.TRIBUNAL_USERNAME;
const password = process.env.TRIBUNAL_PASSWORD;
const loginUrl = process.env.TRIBUNAL_URL;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const parentDir = path.dirname(__dirname);
const pdfDirectory = path.join(parentDir, 'pdfs');


if (!fs.existsSync(pdfDirectory)) {
    fs.mkdirSync(pdfDirectory);
}

async function initializeBrowser() {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: null,
    });
    const page = await browser.newPage();
    await page.goto(loginUrl);
    await page.waitForSelector('#UserName');
    await page.type('#UserName', username);
    await page.type('#Password', password);
    await page.click('#Usuario_btnSesion');
    await page.waitForNavigation();

    return { browser, page };
}

async function fillExpTribunalA(page, url) {
    let navigated = false;
    let attempts = 0;
    while (!navigated && attempts < 3) {
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
            navigated = true;
        } catch (error) {
            attempts++;
            if (attempts >= 3) {
                throw new Error(`No se pudo navegar a la URL: ${url} después de 3 intentos.`);
            }
        }
    }

    try {
        await page.click('#plus');
    } catch (error) {
        throw new Error('Error al hacer clic en el botón plus', error);
    }

    try {
        await page.waitForSelector('.show-hide-content.slidingDiv', { timeout: 90000 });
    } catch (error) {
        throw new Error('Error esperando al contenido expandido', error);
    }

    const expandedContent = await page.content();
    const $expanded = cheerio.load(expandedContent);

    const juzgado = $expanded('#ContentPlaceHolderPrincipal_lblJuzgado').text().trim();
    const juicio = $expanded('#ContentPlaceHolderPrincipal_lblJuicio').text().trim();
    const ubicacion = $expanded('#ContentPlaceHolderPrincipal_lblUbicacion').text().trim();
    const partes = $expanded('#ContentPlaceHolderPrincipal_lblPartes').text().trim();
    const expediente = $expanded('#ContentPlaceHolderPrincipal_lblExpediente').text().trim();

    return { juzgado, juicio, ubicacion, partes, expediente };
}

async function scrappingDet(page, url) {
    let attempts = 0;
    let navigated = false;
    while (!navigated && attempts < 3) {
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
            navigated = true;
        } catch (error) {
            attempts++;
            if (attempts >= 3) {
                throw new Error(`No se pudo navegar a la URL: ${url} después de 3 intentos.`);
            }
        }
    }

    const content = await page.content();
    const $ = cheerio.load(content);

    const rows = $('#ContentPlaceHolderPrincipal_dgDetalle_dgDetallado tr.tdatos');
    const data = [];

    for (let i = 0; i < rows.length; i++) {
        const cells = $(rows[i]).find('td');
        const verAcuerdo = $(cells[0]).find('a').attr('title');
        const fecha = $(cells[1]).find('span').text();
        const etapa = $(cells[2]).text().trim();
        const termino = $(cells[3]).text().trim();
        const notificacion = $(cells[4]).find('a').text().trim();

        data.push({
            verAcuerdo,
            fecha,
            etapa,
            termino,
            notificacion,
        });



    }

    return data;
}
async function scrappingPdf(page, url, browser, targetDate) {
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        const content = await page.content();
        const $ = cheerio.load(content);

        const rows = $('#ContentPlaceHolderPrincipal_dgDetalle_dgDetallado tr.tdatos');

        const initialFiles = new Set(fs.readdirSync(pdfDirectory));

        const formattedTargetDate = formatDate(targetDate);

        for (let i = 0; i < rows.length; i++) {
            const cells = $(rows[i]).find('td');
            const fecha = $(cells[1]).find('span').text().trim();

            const formattedFecha = formatDate(fecha);

            if (formattedFecha === formattedTargetDate) {
                const checkboxSelector = `#ContentPlaceHolderPrincipal_dgDetalle_dgDetallado_chkIns_${i}`;
                await page.click(checkboxSelector);
                const viewDocsButtonSelector = '#ContentPlaceHolderPrincipal_dgDetalle_btnVerDocumentos2';
                const [newPage] = await Promise.all([
                    new Promise((resolve) => browser.once('targetcreated', target => resolve(target.page()))),
                    page.click(viewDocsButtonSelector)
                ]);
                await newPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
                await setDownloadBehavior(newPage);
                await newPage.evaluate(() => {
                    const downloadLink = document.querySelector('#download');
                    if (downloadLink) {
                        downloadLink.click();
                    } else {
                        throw new Error('No se encontró el enlace de descarga.');
                    }
                });
                await new Promise(resolve => setTimeout(resolve, 1000));
                const finalFiles = new Set(fs.readdirSync(pdfDirectory));
                const newFiles = Array.from(finalFiles).filter(file => !initialFiles.has(file));

                if (newFiles.length > 0) {
                    const pdfFile = newFiles[0];
                    const pdfPath = path.join(pdfDirectory, pdfFile);
                    return pdfPath;
                } else {
                    throw new Error('El archivo PDF no fue descargado.');
                }
            }
        }

        throw new Error('No se encontró ningún PDF para la fecha objetivo.');

    } catch (error) {
        console.error('Error durante el scraping del PDF:', error.message);
        return null;
    }
}



export { initializeBrowser, fillExpTribunalA, scrappingDet, scrappingPdf };



async function setDownloadBehavior(page) {
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: pdfDirectory,
    });
}

const formatDate = (dateString) => {
    return dateString.trim().replace(/\./g, '').toLowerCase();
};