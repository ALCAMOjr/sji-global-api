import { pool } from "../db.js";
import Templates_iycc from "../models/TemplatesIycc.js";

class TemplatesIyccDAO {

    static async create(templateData) {
        const { subtipo, nombre_template, descripcion, template_pdf } = templateData;

        const [result] = await pool.query(
            `INSERT INTO Templates_iycc (
                subtipo, nombre_template, descripcion, template_pdf
            ) VALUES (?, ?, ?, ?)`,
            [subtipo, nombre_template, descripcion, template_pdf]
        );

        return await this.getById(result.insertId);
    }

    static async getTemplateIdBySubtipo(subtipo) {
        const [rows] = await pool.query(
            `SELECT template_id FROM Templates_iycc WHERE subtipo = ? LIMIT 1`,
            [subtipo]
        );
        return rows.length > 0 ? rows[0].template_id : null;
    }

    static async getAll() {
        const [rows] = await pool.query(`SELECT * FROM Templates_iycc`);
        return rows.map(row => new Templates_iycc(row));
    }

    static async getById(template_id) {
        const [rows] = await pool.query(
            `SELECT * FROM Templates_iycc WHERE template_id = ?`,
            [template_id]
        );
        return rows.map(row => new Templates_iycc(row));
    }

    static async update(template_id, updatedData) {
        const { subtipo, nombre_template, descripcion, template_pdf } = updatedData;

        await pool.query(
            `UPDATE Templates_iycc SET 
                subtipo = IFNULL(?, subtipo), 
                nombre_template = IFNULL(?, nombre_template), 
                descripcion = IFNULL(?, descripcion), 
                template_pdf = IFNULL(?, template_pdf) 
            WHERE template_id = ?`,
            [subtipo, nombre_template, descripcion, template_pdf, template_id]
        );

        return await this.getById(template_id);
    }

    static async delete(template_id) {
        const [result] = await pool.query(
            `DELETE FROM Templates_iycc WHERE template_id = ?`,
            [template_id]
        );

        return result.affectedRows;
    }
}

export default TemplatesIyccDAO;
