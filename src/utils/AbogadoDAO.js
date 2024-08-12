import { pool } from "../db.js";
import Abogado from "../models/Abogado.js";

class AbogadoDAO {
    static async getById(id) {
        const [rows] = await pool.query('SELECT * FROM abogados WHERE id = ?', [id]);
        return rows.length ? new Abogado(rows[0]) : null;
    }
    static async getByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM abogados WHERE email = ?', [email]);
        return rows.length ? new Abogado(rows[0]) : null;
    }
    

    static async getAll() {
        const [rows] = await pool.query('SELECT id, username, nombre, apellido, cedula, email, telefono, user_type FROM abogados');
        return rows.map(row => new Abogado(row));
    }

    static async getByUsername(username) {
        const [rows] = await pool.query('SELECT * FROM abogados WHERE username = ?', [username]);
        return rows.length ? new Abogado(rows[0]) : null;
    }

    static async create(abogadoData) {
        const { username, password, nombre, apellido, cedula, email, telefono, userType } = abogadoData;
        const [result] = await pool.query(
            'INSERT INTO abogados (username, nombre, apellido, password, cedula, email, telefono, user_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [username, nombre, apellido, password, cedula, email, telefono, userType]
        );
        return await this.getById(result.insertId);
    }

    static async update(id, abogadoData) {
        const { username, nombre, apellido, cedula, email, telefono, user_type } = abogadoData;
        await pool.query(
            'UPDATE abogados SET username = IFNULL(?, username), nombre = IFNULL(?, nombre), apellido = IFNULL(?, apellido), cedula = IFNULL(?, cedula), email = IFNULL(?, email), telefono = IFNULL(?, telefono), user_type = IFNULL(?, user_type) WHERE id = ?',
            [username, nombre, apellido, cedula, email, telefono, user_type, id]
        );
        return await this.getById(id);
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM abogados WHERE id = ?', [id]);
        return result.affectedRows;
    }

    static async deleteAll() {
        const [result] = await pool.query('DELETE FROM abogados');
        return result.affectedRows;
    }

    static async getAllCoordinadores() {
        const query = 'SELECT id, username, nombre, apellido, email FROM abogados WHERE user_type = ?';
        const [rows] = await pool.query(query, ['coordinador']);
        return rows.map(row => new Abogado(row));
    }
    
}

export default AbogadoDAO;
