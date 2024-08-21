import AbogadoDAO from "../utils/AbogadoDAO.js";
import PositionDao from "../utils/PositionDAO.js";

export const getPositionExpedientes = async (req, res) => {
    try {
        const { userId } = req;

        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const results = await PositionDao.getAll();
        res.status(200).json(results);

    } catch (error) {
        console.error('Error retrieving position expedientes:', error);
        res.status(500).json({ message: 'Error retrieving position expedientes', error });
    }
};

export const getPositionExpedienteByNumber = async (req, res) => {
    try {
        const { userId } = req;
        const { number } = req.params;  

  
        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const results = await PositionDao.getAllbyNumber(number);
        res.status(200).json(results);

    } catch (error) {
        console.error('Error retrieving position expedientes:', error);
        res.status(500).json({ message: 'Error retrieving position expedientes', error });
    }

    
};

export const getPositionExpedienteByMacroetapa = async (req, res) => {
    try {
        const { userId } = req;
        const { etapa } = req.params;  

  
        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const results = await PositionDao.getAllByMacroetapa(etapa);
        res.status(200).json(results);

    } catch (error) {
        console.error('Error retrieving position expedientes:', error);
        res.status(500).json({ message: 'Error retrieving position expedientes', error });
    }
};
