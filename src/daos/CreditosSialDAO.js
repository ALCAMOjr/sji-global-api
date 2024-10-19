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
  static async getAllMacroetapas() {
    const query = `
        SELECT DISTINCT macroetapa_aprobada 
        FROM CreditosSIAL 
        WHERE macroetapa_aprobada IS NOT NULL 
        ORDER BY FIELD(macroetapa_aprobada, 
            '01. Asignación',
            '02. Convenios previos a demanda',
            '03. Demanda sin emplazamiento',
            '04. Emplazamiento sin sentencia',
            '06. Convenio Judicial',
            '07. Juicio con sentencia',
            '08. Proceso de ejecución',
            '09. Adjudicación',
            '10. Escrituración en proceso',
            '15. Autoseguros',
            '16. Liquidación',
            '17. Entrega por Poder Notarial',
            '18. Irrecuperabilidad'
        )`;
    const [rows] = await pool.query(query);
    return rows;
}

}

export default CreditoSialDAO;
