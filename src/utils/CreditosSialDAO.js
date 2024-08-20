// utils/CreditoSialDAO.js
import { pool } from "../db.js";

class CreditoSialDAO {
  static async deleteAll() {
    const query = 'DELETE FROM CreditosSIAL';
    await pool.query(query);
  }

  static async insert(values) {
    const query = 'INSERT INTO CreditosSIAL SET ?';
    await pool.query(query, values);
  }

  static async getAll() {
    const query = 'SELECT * FROM CreditosSIAL';
    const [rows] = await pool.query(query);
    return rows;
  }

  static async getByNumCredito(numCredito) {
    const query = 'SELECT * FROM CreditosSIAL WHERE num_credito = ?';
    const [rows] = await pool.query(query, [numCredito]);
    return rows;
  }

  static async getAcreditadoByNumCredito(numCredito) {
    const query = 'SELECT acreditado FROM CreditosSIAL WHERE num_credito = ?';
    const [rows] = await pool.query(query, [numCredito]);
    return rows;
  }
}

export default CreditoSialDAO;
