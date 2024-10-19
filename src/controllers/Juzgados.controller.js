import JuzgadoDao from "../daos/JuzgadoDAO.js";
import AbogadoDAO from "../daos/AbogadoDAO.js";


export const getAllJuzgados = async (req, res) => {
    try {
        const { userId } = req;
        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const juzgados = await JuzgadoDao.getAll();
        res.status(200).send(juzgados);
    } catch (error) {
        console.error(error); 
        res.status(500).send({ error: 'An error occurred while getting the juzgados' });
    }
};