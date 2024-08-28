import CreditoSialDAO from '../utils/CreditosSialDAO.js';
import AbogadoDAO from '../utils/AbogadoDAO.js';
import csv from 'csvtojson';

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

    const user = await AbogadoDAO.getById(userId);
    if (!user || user.user_type !== 'coordinador') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await CreditoSialDAO.deleteAll();

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
          return res.status(400).json({ message: 'All CSV files must have the same fields.' });
        }
      }

      const insertPromises = jsonArray.map(row => {
        const values = {};
        for (const [key, value] of Object.entries(fieldMapping)) {
          values[key] = row[value];
        }
        return CreditoSialDAO.insert(values);
      });

      await Promise.all(insertPromises);
    }

    const rows = await CreditoSialDAO.getAll();
    res.status(200).json({ message: 'The CSV files have been processed and the data has been inserted successfully', data: rows });
  } catch (error) {
    console.error('Error converting CSV to JSON:', error);
    res.status(500).json({ message: 'Error converting CSV to JSON', error });
  }
};


export const getAllCreditsSial = async (req, res) => {
  try {
    const { userId } = req;
    const user = await AbogadoDAO.getById(userId);
    if (!user || user.user_type !== 'coordinador') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const rows = await CreditoSialDAO.getAll();
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

    const user = await AbogadoDAO.getById(userId);
    if (!user || user.user_type !== 'coordinador') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const rows = await CreditoSialDAO.getAcreditadoByNumCredito(number);
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
    const { userId } = req;
    const { number } = req.params;

    const user = await AbogadoDAO.getById(userId);
    if (!user || user.user_type !== 'coordinador') {
      return res.status(403).send({ error: 'Unauthorized' });
    }

    const expedientes = await CreditoSialDAO.getByNumCredito(Number(number));
    if (expedientes.length <= 0) {
      return res.status(404).send({ error: 'Expediente not found' });
    }

    res.status(200).send(expedientes[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while retrieving the expediente' });
  }


  
};
export const getAllEtapas = async (req, res) => {
  try {
    const { userId } = req;

    const user = await AbogadoDAO.getById(userId);
    if (!user || user.user_type !== 'coordinador') {
      return res.status(403).send({ error: 'Unauthorized' });
    }

    const etapas = await CreditoSialDAO.getAllMacroetapas()

    res.status(200).json({ data: etapas })
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while retrieving the expediente' });
  }


  
};