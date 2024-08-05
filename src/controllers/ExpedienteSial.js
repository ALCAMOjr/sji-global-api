import csv from 'csvtojson';
import { pool } from "../db.js";
import path from 'path';

export const uploadAndConvertCsv = async (req, res) => {
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
  
      const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
      if (users.length <= 0) {
        return res.status(400).json({ message: 'Invalid user id' });
      }
  
      const user = users[0];
      if (user.user_type !== 'coordinador') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
  
      await pool.query('DELETE FROM CreditosSIAL');
  
      const fieldMapping = {
        id: 'id',
        num_credito: 'num_credito',
        estatus: 'estatus',
        acreditado: 'acreditado',
        omisos: 'omisos',
        estado: 'estado',
        municipio: 'municipio',
        calle_y_numero: 'calle_y_numero',
        fraccionamiento_o_colonia: 'fraccionamiento_o_colonia',
        codigo_postal: 'codigo_postal',
        ultima_etapa_reportada: 'Ultima_etapa_reportada',
        fecha_ultima_etapa_reportada: 'Fecha_ultima_etapa_reportada',
        estatus_ultima_etapa: 'Estatus_ultima_etapa',
        macroetapa_aprobada: 'macroetapa_aprobada',
        ultima_etapa_aprobada: 'Ultima_etapa_aprobada',
        fecha_ultima_etapa_aprobada: 'Fecha_ultima_etapa_aprobada',
        siguiente_etapa: 'siguiente_etapa',
        despacho: 'despacho',
        semaforo: 'semaforo',
        descorto: 'DESCORTO',
        abogado: 'abogado',
        expediente: 'expediente',
        juzgado: 'juzgado'
      };
  
      let isFirstFile = true;
      let baseHeaders = [];
  
      for (const file of files) {
        const csvBuffer = file.buffer.toString('utf-8');
        const jsonArray = await csv().fromString(csvBuffer);
  
        if (isFirstFile) {
          baseHeaders = Object.keys(jsonArray[0]);
          isFirstFile = false;
        } else {
          const currentHeaders = Object.keys(jsonArray[0]);
          if (currentHeaders.length !== baseHeaders.length || !currentHeaders.every((header, index) => header === baseHeaders[index])) {
            return res.status(400).json({ message: 'Los archivos no tienen los mismos campos.' });
          }
        }
  
        const insertPromises = jsonArray.map(row => {
          const values = {};
          for (const [key, value] of Object.entries(fieldMapping)) {
            values[key] = row[value];
          }
          return pool.query('INSERT INTO CreditosSIAL SET ?', values);
        });
  
        await Promise.all(insertPromises);
      }
  
      const [rows] = await pool.query('SELECT * FROM CreditosSIAL');
      res.status(200).json({ message: 'The CSV files have been processed and the data has been inserted successfully', data: rows });
  
    } catch (error) {
      console.error('Error converting CSV to JSON:', error);
      res.status(500).json({ message: 'Error converting CSV to JSON', error });
    }
  };


export const getAllCreditsSial = async (req, res) => {
    try {
        const { userId } = req;
        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).json({ message: 'Invalid user id' });
        }

        const user = users[0];
        if (user.user_type !== 'coordinador') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const [rows] = await pool.query('SELECT * FROM CreditosSIAL');
        res.status(200).json({ data: rows });
    } catch (error) {
        console.error('Error retrieving data from CreditosSIAL:', error);
        res.status(500).json({ message: 'Error retrieving data from CreditosSIAL', error });
    }
};


export const getNombrebyNumero = async (req, res) => {
    try {
        const { userId } = req;
        const { number } = req.params;
        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).json({ message: 'Invalid user id' });
        }

        const user = users[0];
        if (user.user_type !== 'coordinador') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const [rows] = await pool.query('SELECT acreditado FROM CreditosSIAL WHERE num_credito = ?', [number]);
        if (rows.length <= 0) {
            return res.status(404).json({ message: 'Credit number not found' });
        }

        res.status(200).json({ acreditado: rows[0].acreditado });
    } catch (error) {
        console.error('Error retrieving acreditado from CreditosSIAL:', error);
        res.status(500).json({ message: 'Error retrieving acreditado from CreditosSIAL', error });
    }
};


export const getExpedientesByNumero = async (req, res) => {
    try {
        const { number } = req.params;
        const { userId } = req;
        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).send({ error: 'Invalid user id' });
        }
        const user = users[0];
        if (user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }
      

        const [expedientes] = await pool.query('SELECT * FROM CreditosSIAL WHERE num_credito = ?', [Number(number)]);
        if (expedientes.length <= 0) {
            return res.status(404).send({ error: 'Expediente not found' });
        }
        const expediente = expedientes[0];
        return res.status(200).send(expediente);
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: 'An error occurred while retrieving the expediente' });
    }
};
