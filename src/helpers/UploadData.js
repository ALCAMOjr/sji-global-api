import fs from 'fs';
import csv from 'csv-parser';
import { pool } from "../db.js";

// const csvFilePath = '/home/alfredo/Documentos/sji-global-app/Sji-global-api/expTribunalF.csv';
// const csvFilePathEtapas = '/home/alfredo/Documentos/sji-global-app/Sji-global-api/etapasTV.csv';

async function readCSVToJson(filePath) {
    const results = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

async function insertData(data) {
    for (const row of data) {
        const numero = parseInt(Object.values(row)[0], 10);
        const nombre = Object.values(row)[1];
        const url = Object.values(row)[2];

        try {
            await pool.query(`
                INSERT INTO expTribunalA (numero, nombre, url)
                VALUES (?, ?, ?)
            `, [numero, nombre, url]);
    
        } catch (error) {
            console.error(`Error inserting ${numero}:`, error);
        }
    }
}

export const UploadFileasync = async () => {
    try {
        const jsonData = await readCSVToJson(csvFilePath);



        await insertData(jsonData);

        console.log('All data inserted successfully.');
    } catch (error) {
        console.error('Error:', error);
    }
}


async function insertEtapas(data) {
    for (const row of data) {
        const etapa = Object.values(row)[0];
        const termino = Object.values(row)[1];
        const notificacion = Object.values(row)[2];
        const macroetapa = Object.values(row)[3];

        try {
            await pool.query(`
                INSERT INTO EtapasTv (etapa, termino, notificacion, macroetapa)
                VALUES (?, ?, ?, ?)
            `, [etapa, termino, notificacion, macroetapa]);
    
        } catch (error) {
            console.error(`Error inserting ${etapa}:`, error);
        }
    }
}

export const uploadCSVToEtapasTv = async () => {
    try {
        const jsonData = await readCSVToJson(csvFilePathEtapas);
        await insertEtapas(jsonData);
        console.log('All data inserted successfully.');
    } catch (error) {
        console.error('Error:', error);
    }
}
