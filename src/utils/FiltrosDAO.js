import { pool } from "../db.js";

class FiltrosDAO {
    static async getAll() {
        const [rows] = await pool.query('SELECT name, etapa, termino, notificacion FROM Filtros');
        return rows.map(row => ({
            name: row.name,
            value: {
                etapa: row.etapa,
                termino: row.termino,
                notificacion: row.notificacion
            }
        }));
    }
}

export default FiltrosDAO;
