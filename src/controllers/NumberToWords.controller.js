import { NumerosALetras } from 'numero-a-letras';
import AbogadoDAO from '../daos/AbogadoDAO.js';

export const getNumberToWords = async (req, res) => {
    const { userId } = req;
    const number = Math.floor(req.params.number); 

    const user = await AbogadoDAO.getById(userId);
    if (!user) {
        return res.status(403).send({ error: 'Unauthorized' });
    }
    let words = NumerosALetras(number);
    words = words.replace(/ pesos 00\/100 M\.N\./i, '');
    return res.status(200).send({ words });
};
