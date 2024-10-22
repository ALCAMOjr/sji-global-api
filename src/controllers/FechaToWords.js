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
        const { fecha } = req.params; 

        const user = await AbogadoDAO.getById(userId);
        if (!user) {
            return res.status(403).send({ error: 'Unauthorized' });
        }
        const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
        const match = fecha.match(dateRegex);
        if (!match) {
            return res.status(400).send({ error: 'Invalid date format. Use yyyy-mm-dd' });
        }
        const [_, year, month, day] = match;

        const dayNum = parseInt(day, 10);
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);

        const dayInWords = NumerosALetras(dayNum).replace(/ pesos 00\/100 M\.N\./i, '').toLowerCase();
        const monthInWords = getMonthInText(monthNum);
        const yearInWords = NumerosALetras(yearNum).replace(/ pesos 00\/100 M\.N\./i, '').toLowerCase();
        const words = `${dayNum} (${dayInWords}) de ${monthInWords} del ${yearNum} (${yearInWords})`;

        res.status(200).send({ words });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while formatting the date' });
    }
};
