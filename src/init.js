import { pool } from "./db.js";
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

export const initializeCoordinador = async () => {
    const coordinador_username = process.env.COORDINADOR_USERNAME;
    const coordinadorPassword = process.env.COORDINADOR_PASSWORD;

    const [users] = await pool.query('SELECT * FROM abogados WHERE username = ? AND user_type = ?', [coordinador_username, 'coordinador']);
    if (users.length > 0) {
        return;
    }

    const salt = await bcryptjs.genSalt();
    const hashPassword = await bcryptjs.hash(coordinadorPassword, salt);


    const nombre = 'Gabriel';
    const apellido = 'Balsañez';
    const cedula = '1234567890';
    const email = 'gabriel.balsanez@example.com';
    const telefono = '1234567890';

    await pool.query('INSERT INTO abogados (username, nombre, apellido, password, cedula, email, telefono, user_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [coordinador_username, nombre, apellido, hashPassword, cedula, email, telefono, 'coordinador']);
}
