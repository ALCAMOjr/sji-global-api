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
    // ExpedienteDAO.js
static async findAllWithDetails() {
    const query = `
        SELECT 
            a.numero, a.nombre, a.url, a.expediente, a.juzgado, a.juicio, a.ubicacion, a.partes,
            d.id AS detalle_id, d.ver_acuerdo, d.fecha, d.etapa, d.termino, d.notificacion, d.expediente AS detalle_expediente
        FROM 
            expTribunalA a
        LEFT JOIN 
            expTribunalDetA d ON a.numero = d.expTribunalA_numero
    `;

    const [rows] = await pool.query(query);
    const expedientesMap = rows.reduce((map, row) => {
        if (!map[row.numero]) {
            map[row.numero] = {
                numero: row.numero,
                nombre: row.nombre,
                url: row.url,
                expediente: row.expediente,
                juzgado: row.juzgado,
                juicio: row.juicio,
                ubicacion: row.ubicacion,
                partes: row.partes,
                detalles: []  
            };
        }
        if (row.detalle_id) {
            map[row.numero].detalles.push({
                id: row.detalle_id,
                ver_acuerdo: row.ver_acuerdo,
                fecha: row.fecha,
                etapa: row.etapa,
                termino: row.termino,
                notificacion: row.notificacion,
                expediente: row.detalle_expediente
            });
        }

        return map;
    }, {});
    return Object.values(expedientesMap);
}

    
}

export default ExpedienteDAO;