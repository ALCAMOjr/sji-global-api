import AbogadoDAO from '../utils/AbogadoDAO.js';
import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import dotenv from 'dotenv';
import TareaDAO from '../utils/TareaDAO.js';
import emailQueue from '../config/emailQueque.config.js'; 
import { generateWelcomeEmail } from '../helpers/EmailFuncionts.js'; 
import { generatePassword } from '../helpers/generatePassword.js';

dotenv.config();

export const getAllAbogados = async (req, res) => {
    try {
        const { userId } = req;
        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const abogados = await AbogadoDAO.getAll();
        res.status(200).send(abogados);
    } catch (error) {
        console.error(error); 
        res.status(500).send({ error: 'An error occurred while getting the abogados' });
    }
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).send({ error: 'Missing username or password' });
        }

        const user = await AbogadoDAO.getByUsername(username);
        if (!user) {
            return res.status(400).send({ error: 'Invalid username or password' });
        }

        const correctPassword = await bcryptjs.compare(password, user.password);
        if (!correctPassword) {
            return res.status(400).send({ error: 'Invalid username or password' });
        }

        const userForToken = {
            id: user.id,
            username: user.username,
            userType: user.user_type,
        };

        const token = jsonwebtoken.sign(
            { userForToken },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION }
        );

        res.status(200).send({ status: "ok", message: "logged in successfully", token: token });
    } catch (error) {
        console.error(error); 
        res.status(500).send({ error: 'An error occurred during login' });
    }
};
export const registerUser = async (req, res) => {
    try {
        const { username, userType, nombre, apellido, cedula, email, telefono } = req.body;
        const { userId } = req;

        if (!username || !email) {
            return res.status(400).send({ error: 'Username and email are required' });
        }

        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const existingUser = await AbogadoDAO.getByUsername(username);
        if (existingUser) {
            return res.status(400).send({ error: 'Username already exists' });
        }

        const existingEmail = await AbogadoDAO.getByEmail(email);
        if (existingEmail) {
            return res.status(400).send({ error: 'Email is already registered' });
        }

        const generatedPassword = generatePassword();
        const salt = await bcryptjs.genSalt();
        const hashedPassword = await bcryptjs.hash(generatedPassword, salt);

        const newUser = await AbogadoDAO.create({
            username,
            password: hashedPassword,
            userType,
            nombre,
            apellido,
            cedula,
            email,
            telefono
        });

        const { subject, text } = generateWelcomeEmail(nombre, username, generatedPassword);

        const emailData = {
            to: email,
            subject,
            text
        };
        await emailQueue.add(emailData);

        res.status(201).send(newUser);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while registering the abogado', details: error.message });
    }
};

export const updateAbogado = async (req, res) => {
    try {
        const { id } = req.params;
        let { username, nombre, apellido, cedula, email, telefono, userType } = req.body;
        const { userId } = req;

        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const updatedAbogado = await AbogadoDAO.update(id, { username, nombre, apellido, cedula, email, telefono, userType });
        if (!updatedAbogado) {
            return res.status(404).json({ message: 'Abogado not found' });
        }

        res.status(200).json(updatedAbogado);

        
    } catch (error) {
        console.error(error); 
        res.status(500).send({ error: 'An error occurred while updating the abogado' });
    }
};
export const deleteAbogado = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req;
        const user = await AbogadoDAO.getById(userId);

        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const pendingTasks = await TareaDAO.findActiveTasksByAbogadoId(id);
        if (pendingTasks.length > 0) {
            return res.status(400).send({ error: 'Cannot delete abogado with active tasks' });
        }

        await TareaDAO.deleteTasksByAbogadoId(id);

        
        const affectedRows = await AbogadoDAO.delete(id);
        if (affectedRows <= 0) {
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
        return res.status(200).send({ valid: true });
    } catch (error) {
        console.error(error); 
        return res.send({ valid: false });
    }
};
