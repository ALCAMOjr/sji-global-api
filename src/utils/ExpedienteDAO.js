// daos/ExpedienteDAO.js
import { pool } from '../db.js';
import  Expediente  from '../models/Expediente.js';

 class ExpedienteDAO {
    static async create(expediente) {
        const query = 'INSERT INTO expTribunalA (numero, nombre, url, expediente, juzgado, juicio, ubicacion, partes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [expediente.numero, expediente.nombre, expediente.url, expediente.expediente, expediente.juzgado, expediente.juicio, expediente.ubicacion, expediente.partes];
        await pool.query(query, values);
        const queryDetA = 'INSERT INTO expTribunalDetA (expTribunalA_numero) VALUES (?)';
        const valuesDetA = [expediente.numero];
        await pool.query(queryDetA, valuesDetA);
    }

    static async findByNumero(numero) {
        const [rows] = await pool.query('SELECT * FROM expTribunalA WHERE numero = ?', [numero]);
        return rows.map(row => new Expediente(row.numero, row.nombre, row.url, row.expediente, row.juzgado, row.juicio, row.ubicacion, row.partes));
    }

    static async findAll() {
        const [rows] = await pool.query('SELECT * FROM expTribunalA');
        return rows.map(row => new Expediente(row.numero, row.nombre, row.url, row.expediente, row.juzgado, row.juicio, row.ubicacion, row.partes));
    }

    static async update(expediente) {
        const query = 'UPDATE expTribunalA SET nombre = ?, url = ?, expediente = ?, juzgado = ?, juicio = ?, ubicacion = ?, partes = ? WHERE numero = ?';
        const values = [expediente.nombre, expediente.url, expediente.expediente, expediente.juzgado, expediente.juicio, expediente.ubicacion, expediente.partes, expediente.numero];
        await pool.query(query, values);
    }

    static async delete(numero) {
       const [result] = await pool.query('DELETE FROM expTribunalA WHERE numero = ?', [numero]);
       return result;
    }
}

export default ExpedienteDAO;