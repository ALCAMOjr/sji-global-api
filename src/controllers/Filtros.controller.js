import FiltrosDAO from "../daos/FiltrosDAO.js";
import AbogadoDAO from "../daos/AbogadoDAO.js";

export const getAllFiltros = async (req, res) => {
    try {
        const { userId } = req;
        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const filtros = await FiltrosDAO.getAll();
        res.status(200).send(filtros);
    } catch (error) {
        console.error(error); 
        res.status(500).send({ error: 'An error occurred while getting the filtros' });
    }
};
