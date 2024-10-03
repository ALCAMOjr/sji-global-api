import { pool } from "../db.js";

class JuzgadoDao {
    static async getAll() {
        const [rows] = await pool.query('SELECT juspos, abreviaciones FROM juzgados');
        return rows;
    }
}

export default JuzgadoDao;
