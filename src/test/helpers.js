import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import AbogadoDAO from "../utils/AbogadoDAO.js";
dotenv.config();

const coordinadorUsername = process.env.COORDINADOR_USERNAME_TEST;
const coordinadorPassword = process.env.COORDINADOR_PASSWORD_TEST;


export const testInitializeCoordinador = async () => {
    const coordinador = await AbogadoDAO.getByUsername(coordinadorUsername);
    if (coordinador) {
        return;
    }

    const salt = await bcryptjs.genSalt();
    const hashPassword = await bcryptjs.hash(coordinadorPassword, salt);

    await AbogadoDAO.create({
        username: coordinadorUsername,
        password: hashPassword,
        nombre: 'AdminNombre',
        apellido: 'AdminApellido',
        cedula: 'AdminCedula',
        email: 'admin@example.com',
        telefono: '1234567890',
        userType: 'coordinador'
    });
};


export const DeleteAllAbogados = async () => {
    await AbogadoDAO.deleteAll()
}
