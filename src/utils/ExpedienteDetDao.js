
import { pool } from "../db.js";
import ExpedienteDetalle from "../models/ExpedienteDet.js";

class ExpedienteDetalleDAO {
    static async create(expedienteDetalle) {
        const query = `
            INSERT INTO expTribunalDetA (ver_acuerdo, fecha, etapa, termino, notificacion, expediente, expTribunalA_numero)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            expedienteDetalle.verAcuerdo,
            expedienteDetalle.fecha,
            expedienteDetalle.etapa,
            expedienteDetalle.termino,
            expedienteDetalle.notificacion,
            expedienteDetalle.expediente,
            expedienteDetalle.expTribunalANumero
        ];
        await pool.query(query, values);
    }

    static async findByExpTribunalANumero(expTribunalANumero) {
        const query = 'SELECT * FROM expTribunalDetA WHERE expTribunalA_numero = ?';
        const [results] = await pool.query(query, [expTribunalANumero]);
        return results.map(result => new ExpedienteDetalle(result.id, result.ver_acuerdo, result.fecha, result.etapa, result.termino, result.notificacion, result.expediente, result.expTribunalA_numero));
    }

    static async deleteByExpTribunalANumero(expTribunalANumero) {
        const query = 'DELETE FROM expTribunalDetA WHERE expTribunalA_numero = ?';
        await pool.query(query, [expTribunalANumero]);
    }
    static async findByExpTribunalANumeros(expTribunalANumeros) {
        const query = `
            SELECT * 
            FROM expTribunalDetA 
            WHERE expTribunalA_numero IN (?)
        `;
        const [results] = await pool.query(query, [expTribunalANumeros]);
        return results.map(result => new ExpedienteDetalle(result.id, result.ver_acuerdo, result.fecha, result.etapa, result.termino, result.notificacion, result.expediente, result.expTribunalA_numero));
    }
    
}

export default ExpedienteDetalleDAO;
