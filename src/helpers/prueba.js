import puppeteer from 'puppeteer';
import cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const username = "sji global 01";
const password = "$Infonavit2024";
const loginUrl = "https://tribunalvirtual.pjenl.gob.mx/tv20/Login.aspx";

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pdfDirectory = path.join(__dirname, 'pdfs');

if (!fs.existsSync(pdfDirectory)) {
    fs.mkdirSync(pdfDirectory);
}

// Configura la ruta de descarga
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

async function scrappingDet(page, url, browser, targetDate) {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const content = await page.content();
    const $ = cheerio.load(content);

    const rows = $('#ContentPlaceHolderPrincipal_dgDetalle_dgDetallado tr.tdatos');

    for (let i = 0; i < rows.length; i++) {
        const cells = $(rows[i]).find('td');
        const fecha = $(cells[1]).find('span').text().trim();
    
        const formattedFecha = formatDate(fecha);
        const formattedTargetDate = formatDate(targetDate);

        if (formattedFecha === formattedTargetDate) {
            const pdfInputElement = $(rows[i]).find('input[type="image"]');
            const pdfSrc = pdfInputElement.attr('src');

            if (pdfInputElement.length > 0) {
                const [newPage] = await Promise.all([
                    new Promise((resolve) => browser.once('targetcreated', target => resolve(target.page()))),
                    page.click(`input[type="image"][src="${pdfSrc}"]`)
                ]);

                await newPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });

                // Configurar la ruta de descarga
                await setDownloadBehavior(newPage);

                // Hacer clic en el botón de descarga
                await newPage.click('#download');
                
                // Espera a que se complete la descarga (podrías implementar una espera explícita si es necesario)
                await new Promise(resolve => setTimeout(resolve, 5000));

                console.log('PDF descargado con éxito.');
                return;
            }
        }
    }

    console.log('No se encontró un PDF para la fecha especificada.');
    return null;
}

const url = "https://tribunalvirtual.pjenl.gob.mx/tv20/TV/MuestraExpediente.aspx?q=fAy4Pg9Jth9Y6NzS2Khgr9b6WQdvYYDniPv/dxzJmTIVz/Tqvt0vPptiy5pSxNm7+U92btnSoAnZVhfmGPv/bQ==";

async function main(url) {
    const { browser, page } = await initializeBrowser();
    await scrappingDet(page, url, browser, '09/may./2023');
    await browser.close();
}

main(url);
