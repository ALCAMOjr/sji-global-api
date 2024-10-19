import { pool } from "../db.js";

class TemplatesIyccDAO {
    static async getTemplateIdBySubtipo(subtipo) {
        const [rows] = await pool.query(
            `SELECT template_id FROM Templates_iycc WHERE subtipo = ? LIMIT 1`,
            [subtipo]
        );
        return rows.length > 0 ? rows[0].template_id : null;
    }
}

export default TemplatesIyccDAO;
