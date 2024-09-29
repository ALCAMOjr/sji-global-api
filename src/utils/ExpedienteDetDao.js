import { pool } from "../db.js";
import ExpedienteDetalle from "../models/ExpedienteDet.js";
import { parse, format } from 'date-fns';
import { es } from 'date-fns/locale';

class ExpedienteDetalleDAO {
    static async create(expedienteDetalle) {
        const query = `
            INSERT INTO expTribunalDetA (ver_acuerdo, fecha, etapa, termino, notificacion, expediente, expTribunalA_numero, format_fecha)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const parsedFecha = parse(expedienteDetalle.fecha, 'dd/MMM./yyyy', new Date(), { locale: es });
        const formattedFecha = format(parsedFecha, 'yyyy-MM-dd');

        const values = [
            expedienteDetalle.verAcuerdo,
            expedienteDetalle.fecha,  
            expedienteDetalle.etapa,
            expedienteDetalle.termino,
            expedienteDetalle.notificacion,
            expedienteDetalle.expediente,
            expedienteDetalle.expTribunalANumero,
            formattedFecha  
        ];
        await pool.query(query, values);
    }

    static async findByExpTribunalANumero(expTribunalANumero) {
        const query = 'SELECT * FROM expTribunalDetA WHERE expTribunalA_numero = ?';
        const [results] = await pool.query(query, [expTribunalANumero]);
        return results.map(result => new ExpedienteDetalle(
            result.id, 
            result.ver_acuerdo, 
            result.fecha,  
            result.etapa, 
            result.termino, 
            result.notificacion, 
            result.expediente, 
            result.expTribunalA_numero,
            result.format_fecha  
        ));
    }

    static async deleteByExpTribunalANumero(expTribunalANumero) {
        const query = 'DELETE FROM expTribunalDetA WHERE expTribunalA_numero = ?';
        await pool.query(query, [expTribunalANumero]);
    }
}

export default ExpedienteDetalleDAO;
