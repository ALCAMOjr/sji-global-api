import { pool } from "../db.js"
import bcryptjs from 'bcryptjs'
import jsonwebtoken from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

export const getAllAbogados = async (req, res) => {
    try {
        const { userId } = req;
        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).send({ error: 'Invalid user id' });
        }

        const user = users[0];
        if (user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const [abogados] = await pool.query('SELECT id, username, nombre, apellido, cedula, email, telefono, user_type FROM abogados');

        res.send(abogados);
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while getting the abogados' });
    }
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).send({ error: 'Missing username or password' });
        }

        const [users] = await pool.query('SELECT * FROM abogados WHERE username = ?', [username]);
        if (users.length <= 0) {
            return res.status(400).send({ error: 'Invalid username or password' });
        }
        const user = users[0];
        const hashedPassword = user.password;
        const correctPassword = await bcryptjs.compare(password, hashedPassword);

        if (!correctPassword) {
            return res.status(400).send({ error: 'Invalid username or password' });
        }

        const userForToken = {
            id: user.id,
            username: user.username,
            userType: user.user_type
        }

        const token = jsonwebtoken.sign(
            { userForToken },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION }
        );

        res.send({
            status: "ok",
            message: "logged in successfully",
            token: token,
        });
    } catch (error) {
        res.status(500).send({ error: 'An error occurred during login' });
    }
}

export const registerUser = async (req, res) => {
    try {
        const { username, password, userType, nombre, apellido, cedula, email, telefono } = req.body;
        if (!['coordinador', 'abogado'].includes(userType)) {
            return res.status(400).send({ error: 'Invalid user type' });
        }
        const { userId } = req
        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).send({ error: 'Invalid user id' });
        }

        const user = users[0];
        if (user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        if (!username || !password || !nombre || !apellido || !cedula || !email || !telefono) {
            return res.status(400).send({ error: 'All fields are required' });
        }

        const [existingUsers] = await pool.query('SELECT * FROM abogados WHERE username = ?', [username]);
        if (existingUsers.length > 0) {
            return res.status(400).send({ error: 'Username already exists' });
        }
        const salt = await bcryptjs.genSalt()
        const hashPassword = await bcryptjs.hash(password, salt)
        const [rows] = await pool.query('INSERT INTO abogados (username, nombre, apellido, password, cedula, email, telefono, user_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [username, nombre, apellido, hashPassword, cedula, email, telefono, userType]);
        const newUserId = rows.insertId;
        const [newUser] = await pool.query('SELECT * FROM abogados WHERE id = ?', [newUserId]);
        if (newUser.length > 0) {
            const newAbogado = newUser[0];
            res.status(200).send(newAbogado);
        } else {
            res.status(404).send({ error: 'Abogado registered not found' });
        }
    } catch (error) {
        res.status(500).send({ error: `An error occurred while registering the ${userType}` });
    }
}

export const updateAbogado = async (req, res) => {
    try {
        const { id } = req.params;
        let { username, password, nombre, apellido, cedula, email, telefono, userType } = req.body;

        const { userId } = req
        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).send({ error: 'Invalid user id' });
        }

        const user = users[0];
        if (user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }
        if (password) {
            const salt = await bcryptjs.genSalt()
            password = await bcryptjs.hash(password, salt)
        }
        const [result] = await pool.query('UPDATE abogados SET username = IFNULL(?, username), password = IFNULL(?, password), nombre = IFNULL(?, nombre), apellido = IFNULL(?, apellido), cedula = IFNULL(?, cedula), email = IFNULL(?, email), telefono = IFNULL(?, telefono), user_type = IFNULL(?, user_type) WHERE id = ?', [username, password, nombre, apellido, cedula, email, telefono, userType, id]);
        if (result.affectedRows === 0) return res.status(404).json({
            message: 'Abogado not found'
        })

        const [rows] = await pool.query('SELECT * FROM abogados WHERE id = ?', [id])
        res.json(rows[0]);

    } catch (error) {
        res.status(500).send({ error: 'An error occurred while updating the abogado' });
    }
}

export const deleteAbogado = async (req, res) => {
    try {
        const { userId } = req;
        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).send({ error: 'Invalid user id' });
        }

        const user = users[0];
        if (user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }
        const [pendingTasks] = await pool.query('SELECT * FROM Tareas WHERE abogado_id = ? AND estado_tarea IN ("Asignada", "Iniciada")', [req.params.id]);
        if (pendingTasks.length > 0) {
            return res.status(400).send({ error: 'Cannot delete abogado with pending tasks' });
        }

        await pool.query('UPDATE Tareas SET abogado_id = NULL WHERE abogado_id = ? AND estado_tarea = "Terminada"', [req.params.id]);
        const [result] = await pool.query('DELETE FROM abogados WHERE id = ?', [req.params.id]);

        if (result.affectedRows <= 0) {
            return res.status(404).json({ message: 'Abogado not found' });
        }

        res.sendStatus(204);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while deleting the abogado' });
    }
};


export const verify = async (req, res) => {
    const token = req.body.token;

    if (!token) {
        return res.status(400).send({ error: 'Token is required' });
    }

    try {
        jsonwebtoken.verify(token, process.env.JWT_SECRET);
        return res.send({ valid: true });
    } catch (e) {
        return res.send({ valid: false });
    }
};


