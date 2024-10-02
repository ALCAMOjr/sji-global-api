import AbogadoDAO from "../utils/AbogadoDAO.js";
import PositionDao from "../utils/PositionDAO.js";
import ExpedienteDetalleDAO from "../utils/ExpedienteDetDao.js";

export const getPositionExpedientes = async (req, res) => {
    try {
        const { userId } = req;
        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }
        const expedientes = await PositionDao.getAll();
        res.status(200).json(expedientes);
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

        const expedientes = await PositionDao.getAllbyNumber(number);

        const resultsWithDetails = await Promise.all(expedientes.map(async expediente => {
            const detalles = await ExpedienteDetalleDAO.findByExpTribunalANumero(expediente.num_credito);
            return {
                ...expediente,
                detalles
            };
        }));

        res.status(200).json(resultsWithDetails);

    } catch (error) {
        console.error('Error retrieving position expediente by number:', error);
        res.status(500).json({ message: 'Error retrieving position expediente by number', error });
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

        const expedientes = await PositionDao.getAllByMacroetapa(etapa);
        res.status(200).json(expedientes);

    } catch (error) {
        console.error('Error retrieving position expediente by macroetapa:', error);
        res.status(500).json({ message: 'Error retrieving position expediente by macroetapa', error });
    }
};
export const getPositionExpedienteByFiltros = async (req, res) => {
    try {
        const { userId } = req;
        const { etapa, termino, notificacion } = req.query;

        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).send({ error: 'Unauthorized' });
        }
        const expedientes = await PositionDao.getAllByEtapa(etapa, termino, notificacion);
        res.status(200).json(expedientes);

    } catch (error) {
        console.error('Error retrieving position expediente by filtros:', error);
        res.status(500).json({ message: 'Error retrieving position expediente by filtros', error });
    }
};

export const getPositionExpedientesByFecha = async (req, res) => {
    try {
        const { userId } = req;
        const { fecha } = req.params;

        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const expedientes = await PositionDao.getPositionByFecha(fecha);
        res.status(200).json({ data: expedientes });

    } catch (error) {
        console.error('Error retrieving expedientes by fecha:', error);
        res.status(500).json({ message: 'Error retrieving expedientes by fecha', error });
    }
};

export const getPositionExpedienteMultipleFilters = async (req, res) => {
    try {
        const { userId } = req;
        const { desde, hasta, juzgado, etapa, termino, notificacion } = req.query;
          
        console.log( desde, hasta, juzgado, etapa, termino, notificacion)
        if (!desde || !hasta) {
            return res.status(400).json({ message: 'The "from" and "to" fields are required' });
        }

        const user = await AbogadoDAO.getById(userId);
        if (!user || user.user_type !== 'coordinador') {
            return res.status(403).json({ message: 'No autorizado' });
        }

        const expedientes = await PositionDao.getFilteredRecords(desde, hasta, juzgado, etapa, termino, notificacion);
        res.status(200).json({ data: expedientes });

    } catch (error) {
        console.error('Error retrieving expedientes:', error);
        res.status(500).json({ message: 'Error retrieving expedientes', error });
    }
};