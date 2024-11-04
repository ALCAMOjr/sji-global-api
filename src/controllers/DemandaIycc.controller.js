import DemandaIyccDAO from "../daos/DemandasIyccDAO.js";
import AbogadoDAO from "../daos/AbogadoDAO.js";
import CreditoSialDAO from "../daos/CreditosSialDAO.js";
import DemandaIyccVSMMPdfService from "../services/DemandaIyccVSMMPdfService.js";
import DemandaIyccPesosPdfService from "../services/DemandasIyccPesosPdfService.js"

export const createDemanda = async (req, res) => {
    try {
        const { userId } = req;
        const body = req.body;

        const user = await AbogadoDAO.getById(userId);
        if (!user) {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        if (!body.credito || !body.subtipo) {
            return res.status(400).send({ error: 'Missing required fields: credito and subtipo are required.' });
        }
        const expedientInSial = await CreditoSialDAO.getByNumCredito(body.credito);

        if (expedientInSial.length === 0) {
            return res.status(400).send({ error: 'The expediente does not exist in CreditosSIAL.' });
        }

        const existingDemandas = await DemandaIyccDAO.getByCredito(body.credito);
        if (existingDemandas.length > 0) {
            return res.status(400).send({ error: 'An demanda with this credito already exists.' });
        }

        const createdDemanda = await DemandaIyccDAO.create(body)

        res.status(200).json(createdDemanda);

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while creating the demanda' });
    }
};
export const getDemandaPdf = async (req, res) => {
    try {
        const { userId } = req;
        const { credito } = req.params;
        const user = await AbogadoDAO.getById(userId);

        if (!user) {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const data = await DemandaIyccDAO.getByCredito(credito);
        if (!data || data.length === 0) {
            return res.status(404).send({ error: 'Demanda not found' });
        }
        let pdfBuffer;
        if (data[0].subtipo === "VSMM") {
            const pdfService = new DemandaIyccVSMMPdfService(data[0]);
            pdfBuffer = await pdfService.generatePdf();
        } else if (data[0].subtipo === "Pesos") {
            const pdfService = new DemandaIyccPesosPdfService(data[0]);
            pdfBuffer = await pdfService.generatePdf();
        }
        res.status(200).send(pdfBuffer);  
    } catch (error) {
        console.error("Error generating the PDF:", error);
        res.status(500).send({ error: 'An error occurred while generating the PDF' });
    }
};


export const getAllDemandas = async (req, res) => {
    try {
        const { userId } = req;
        const user = await AbogadoDAO.getById(userId);
        if (!user) {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const demandasIycc = await DemandaIyccDAO.getAll()
        res.status(200).send(demandasIycc);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while getting the demanda' });
    }
};


export const getByCredito = async (req, res) => {
    try {
        const { userId } = req;
        const { credito } = req.params;
        const user = await AbogadoDAO.getById(userId);
        if (!user) {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const demandasIycc = await DemandaIyccDAO.getByCredito(credito)
        res.status(200).send(demandasIycc);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while getting the demanda' });
    }
};

export const updateDemanda = async (req, res) => {
    try {
        const { userId } = req;
        const { credito } = req.params;
        const body = req.body;
        const user = await AbogadoDAO.getById(userId);
        if (!user) {
            return res.status(403).send({ error: 'Unauthorized' });
        }
        const existingDemanda = await DemandaIyccDAO.getByCredito(credito);
        if (existingDemanda.length === 0) {
            return res.status(404).send({ error: 'Demanda not found' });
        }
        const updatedDemanda = await DemandaIyccDAO.update(credito, body);
        res.status(200).json(updatedDemanda);

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while updating the demanda' });
    }
};


export const deleteDemanda = async (req, res) => {
    try {
        const { userId } = req;
        const { credito } = req.params;
        const user = await AbogadoDAO.getById(userId);
        if (!user) {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const affectedRows = await DemandaIyccDAO.delete(credito);
        if (affectedRows <= 0) {
            return res.status(404).json({ message: 'Demanda not found' });
        }

        res.sendStatus(204);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while deleting the demanda' });
    }
};

