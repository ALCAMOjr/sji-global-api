import { NumerosALetras } from 'numero-a-letras';
import AbogadoDAO from '../daos/AbogadoDAO.js';

const getMonthInText = (month) => {
    const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return months[month - 1];
};

export const getFechaToWords = async (req, res) => {
    try {
        const { userId } = req;
        const { fecha } = req.query; 

        const user = await AbogadoDAO.getById(userId);
        if (!user) {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = fecha.match(dateRegex);
        if (!match) {
            return res.status(400).send({ error: 'Invalid date format. Use dd/mm/yyyy' });
        }

        const [_, day, month, year] = match.map(Number);

        let dayInWords = NumerosALetras(day).replace(/ pesos 00\/100 M\.N\./i, '').toLowerCase();
        const monthInWords = getMonthInText(month);
        let yearInWords = NumerosALetras(year).replace(/ pesos 00\/100 M\.N\./i, '').toLowerCase();

        const words = `${day} (${dayInWords}) de ${monthInWords} del ${year} (${yearInWords})`;

        res.status(200).send({ words });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while formatting the date' });
    }
};
