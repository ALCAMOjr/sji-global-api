import FileService from "../services/fileService.js";
import AbogadoDAO from "../daos/AbogadoDAO.js";
import TemplatesIyccDAO from "../daos/TemplatesIyccDAO.js";

export const createTemplate = async (req, res) => {
    try {
        const { userId } = req;
        const { subtipo, nombre_template, descripcion } = req.body;
        const template = req.file;

        const user = await AbogadoDAO.getById(userId);
        if (!user) {
            return res.status(403).send({ error: 'Unauthorized' });
        }
        if (!subtipo || !nombre_template || !descripcion || !template) {
            return res.status(400).send({ error: 'Missing required fields: subtipo, nombre_template, descripcion and template are required.' });
        }
        const validSubtipos = ['Pesos', 'VSSM'];
        if (!validSubtipos.includes(subtipo)) {
            return res.status(400).send({ error: `Invalid subtipo. Allowed values are: ${validSubtipos.join(', ')}.` });
        }
        if (template.mimetype !== 'application/pdf') {
            return res.status(400).send({ error: 'The file must be a PDF.' });
        }
        let templateKey = null;
        try {
            const uploadResponse = await FileService.uploadFile(template);
            if (uploadResponse.response.$metadata.httpStatusCode === 200) {
                templateKey = uploadResponse.uniqueFileName;
            } else {
                return res.status(500).send({ error: 'Failed to upload the template file.' });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).send({ error: 'Error uploading the file.' });
        }

        const newTemplate = await TemplatesIyccDAO.create({
            subtipo,
            nombre_template,
            descripcion,
            url_template: templateKey
        });

        res.status(201).json(newTemplate);

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while creating the template.' });
    }
};



export const getAllTemplates = async (req, res) => {
    try {
        const { userId } = req;
    

        const user = await AbogadoDAO.getById(userId);
        if (!user) {
            return res.status(403).send({ error: 'Unauthorized' });
        }
   
        const templates = await TemplatesIyccDAO.getAll()

        res.status(201).json(templates);

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while getting the templates.' });
    }
};




export const deleteTemplate = async (req, res) => {
    try {
        const { userId } = req;
        const { id } = req.params;


        const user = await AbogadoDAO.getById(userId);
        if (!user) {
            return res.status(403).send({ error: 'Unauthorized' });
        }
        const affectedRows = await TemplatesIyccDAO.delete(id);
        if (affectedRows <= 0) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.sendStatus(204);

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while deleting the template.' });
    }
};



