// daos/TareaDAO.js
import { pool } from '../db.js';
import Tarea from '../models/Tarea.js';

class TareaDAO {
    static async create(tarea) {
        const query = `
            INSERT INTO Tareas (abogado_id, exptribunalA_numero, tarea, fecha_inicio, fecha_registro, fecha_entrega, fecha_real_entrega, fecha_estimada_respuesta, fecha_cancelacion, estado_tarea, observaciones)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            tarea.abogado_id,
            tarea.exptribunalA_numero,
            tarea.tarea,
            tarea.fecha_inicio,
            tarea.fecha_registro,
            tarea.fecha_entrega,
            tarea.fecha_real_entrega,
            tarea.fecha_estimada_respuesta,
            tarea.fecha_cancelacion,
            tarea.estado_tarea,
            tarea.observaciones
        ];
        const [result] = await pool.query(query, values);
        tarea.id = result.insertId;
        return tarea;
    }

    static async findById(id) {
        const query = 'SELECT * FROM Tareas WHERE id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows.length ? new Tarea(rows[0]) : null;
    }



    static async findByExpTribunalANumero(expTribunalANumero) {
        const query = 'SELECT * FROM Tareas WHERE exptribunalA_numero = ?';
        const [rows] = await pool.query(query, [expTribunalANumero]);
        return rows.map(row => new Tarea(row));
    }

    static async findPendingTasksByExpTribunalANumero(expTribunalANumero) {
        const query = `
            SELECT * 
            FROM Tareas 
            WHERE exptribunalA_numero = ? 
              AND (estado_tarea = 'Asignada' OR estado_tarea = 'Iniciada')
        `;

        const [rows] = await pool.query(query, [expTribunalANumero]);
        return rows;
    }
    


    static async findByIdAndAbogadoId(taskId, abogadoId) {
        const query = 'SELECT * FROM Tareas WHERE id = ? AND abogado_id = ?';
        const [rows] = await pool.query(query, [taskId, abogadoId]);
        return rows.length ? new Tarea(rows[0]) : null;
    }


    static async findActiveTasksByAbogadoId(abogadoId) {
        const query = `
            SELECT Tareas.id as tareaId, Tareas.tarea, Tareas.fecha_entrega, Tareas.observaciones, 
                   Tareas.estado_tarea, expTribunalA.numero, expTribunalA.nombre, expTribunalA.url, 
                   expTribunalA.expediente, expTribunalA.juzgado
            FROM Tareas 
            JOIN expTribunalA ON Tareas.exptribunalA_numero = expTribunalA.numero
            WHERE Tareas.abogado_id = ? AND (Tareas.estado_tarea = 'Asignada' OR Tareas.estado_tarea = 'Iniciada')
        `;
        const [rows] = await pool.query(query, [abogadoId]);
        return rows;
    }
    
    static async findByExpedienteAndAbogado(expTribunalANumero, abogadoId) {
        const query = `
            SELECT 
                Tareas.id as tareaId, 
                Tareas.tarea, 
                Tareas.fecha_inicio, 
                Tareas.fecha_registro, 
                Tareas.fecha_entrega, 
                Tareas.fecha_real_entrega, 
                Tareas.fecha_estimada_respuesta, 
                Tareas.fecha_cancelacion, 
                Tareas.observaciones, 
                Tareas.estado_tarea, 
                expTribunalA.numero, 
                expTribunalA.nombre, 
                expTribunalA.url, 
                expTribunalA.expediente,
                abogados.id as abogadoId, 
                abogados.username as abogadoUsername
            FROM Tareas 
            JOIN expTribunalA ON Tareas.exptribunalA_numero = expTribunalA.numero
            JOIN abogados ON Tareas.abogado_id = abogados.id
            WHERE Tareas.exptribunalA_numero = ? AND Tareas.abogado_id = ?
        `;
        const [rows] = await pool.query(query, [expTribunalANumero, abogadoId]);
        return rows;
    }
    


    static async startTask(taskId, fecha_inicio) {
        const query = 'UPDATE Tareas SET estado_tarea = ?, fecha_inicio = ? WHERE id = ?';
        await pool.query(query, ['Iniciada', fecha_inicio, taskId]);
    }


    static async completeTask(taskId, fecha_real_entrega) {
        const query = 'UPDATE Tareas SET estado_tarea = ?, fecha_real_entrega = ? WHERE id = ?';
        await pool.query(query, ['Terminada', fecha_real_entrega, taskId]);
    }

    static async findExpedientesConTareas() {
        const query = `
            SELECT expTribunalA.numero, expTribunalA.nombre, expTribunalA.url, expTribunalA.expediente, 
                    Tareas.id as tareaId, Tareas.tarea, Tareas.fecha_inicio, Tareas.fecha_registro, 
                    Tareas.fecha_entrega, Tareas.fecha_real_entrega, Tareas.fecha_estimada_respuesta, 
                    Tareas.fecha_cancelacion, Tareas.observaciones, Tareas.estado_tarea, 
                    abogados.id as abogadoId, abogados.username as abogadoUsername
             FROM expTribunalA 
             JOIN Tareas ON expTribunalA.numero = Tareas.exptribunalA_numero
             JOIN abogados ON Tareas.abogado_id = abogados.id
        `;
        const [rows] = await pool.query(query);
        return rows;
    }

    static async findByAbogadoUsername(abogado) {
        const query = `
        SELECT Tareas.id as tareaId, Tareas.tarea, Tareas.fecha_inicio, Tareas.fecha_registro, Tareas.fecha_entrega, 
        Tareas.fecha_real_entrega, Tareas.fecha_estimada_respuesta, Tareas.fecha_cancelacion, Tareas.observaciones, Tareas.estado_tarea, 
        expTribunalA.numero, expTribunalA.nombre, expTribunalA.url, expTribunalA.expediente,
        abogados.id as abogadoId, abogados.username as abogadoUsername
        FROM Tareas 
        JOIN expTribunalA ON Tareas.exptribunalA_numero = expTribunalA.numero
        JOIN abogados ON Tareas.abogado_id = abogados.id
        WHERE abogados.username = ?
        `;
        const [rows] = await pool.query(query, [abogado]);
        return rows;
    }

    static async findByExpediente(expTribunalANumero) {
        const query = `
        SELECT Tareas.id as tareaId, Tareas.tarea, Tareas.fecha_inicio, Tareas.fecha_registro, Tareas.fecha_entrega, 
        Tareas.fecha_real_entrega, Tareas.fecha_estimada_respuesta, Tareas.fecha_cancelacion, Tareas.observaciones, Tareas.estado_tarea, 
        expTribunalA.numero, expTribunalA.nombre, expTribunalA.url, expTribunalA.expediente,
        abogados.id as abogadoId, abogados.username as abogadoUsername
        FROM Tareas 
        JOIN expTribunalA ON Tareas.exptribunalA_numero = expTribunalA.numero
        JOIN abogados ON Tareas.abogado_id = abogados.id
        WHERE Tareas.exptribunalA_numero = ?
        `;
        const [rows] = await pool.query(query, [expTribunalANumero]);
        return rows;
    }

    static async cancelTask(taskId, fecha_cancelacion) {
        const query = 'UPDATE Tareas SET estado_tarea = ?, fecha_cancelacion = ? WHERE id = ?';
        await pool.query(query, ['Cancelada', fecha_cancelacion, taskId]);
    }

    static async deleteTask(taskId) {
        const query = 'DELETE FROM Tareas WHERE id = ?';
        await pool.query(query, [taskId]);
    }

    static async hasTasksForExpediente(expTribunalANumero) {
        const query = 'SELECT * FROM Tareas WHERE exptribunalA_numero = ? AND estado_tarea IN (?, ?)';
        const [rows] = await pool.query(query, [expTribunalANumero, 'Asignada', 'Iniciada']);
        return rows.length > 0;
    }

    static async updateAbogadoId(abogadoId) {
        const query = 'UPDATE Tareas SET abogado_id = NULL WHERE abogado_id = ? AND estado_tarea = "Terminada"';
        await pool.query(query, [abogadoId]);
    }

}

export default TareaDAO;
