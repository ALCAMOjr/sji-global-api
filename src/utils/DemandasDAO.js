import { pool } from "../db.js";
import Demanda from "../models/Demanda.js";

class DemandaDAO {
    static async create(demandaData) {
        const {
            Credito, Acreditado, Escritura, Fecha_escritura, Inscripcion, Volumen, Libro,
            Seccion, Unidad, Fecha, Monto_otorgado, Mes_primer_adeudo, Mes_ultimo_adeudo,
            Adeudo_en_pesos, Adeudo, Calle, Numero, Colonia_fraccionamiento, Codigo_postal,
            Municipio, Estado, Nomenclatura, Interes_ordinario, Interes_moratorio, Juzgado,
            Hora_requerimiento, Fecha_requerimiento, Tipo_demanda, Subtipo, Categoria
        } = demandaData;
        
        const [result] = await pool.query(
            `INSERT INTO Demandas (
                Credito, Acreditado, Escritura, Fecha_escritura, Inscripcion, Volumen, Libro,
                Seccion, Unidad, Fecha, Monto_otorgado, Mes_primer_adeudo, Mes_ultimo_adeudo,
                Adeudo_en_pesos, Adeudo, Calle, Numero, Colonia_fraccionamiento, Codigo_postal,
                Municipio, Estado, Nomenclatura, Interes_ordinario, Interes_moratorio, Juzgado,
                Hora_requerimiento, Fecha_requerimiento, Tipo_demanda, Subtipo, Categoria
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [Credito, Acreditado, Escritura, Fecha_escritura, Inscripcion, Volumen, Libro,
             Seccion, Unidad, Fecha, Monto_otorgado, Mes_primer_adeudo, Mes_ultimo_adeudo,
             Adeudo_en_pesos, Adeudo, Calle, Numero, Colonia_fraccionamiento, Codigo_postal,
             Municipio, Estado, Nomenclatura, Interes_ordinario, Interes_moratorio, Juzgado,
             Hora_requerimiento, Fecha_requerimiento, Tipo_demanda, Subtipo, Categoria]
        );
        
        return await this.getByCredito(Credito);
    }

    static async assignTemplate(credito, templateId) {
        await pool.query(
            `UPDATE Demandas SET Template_id = ? WHERE Credito = ?`,
            [templateId, credito]
        );
        return await this.getByCredito(credito);
    }

    static async update(credito, demandaData) {
        const {
            Acreditado, Escritura, Fecha_escritura, Inscripcion, Volumen, Libro,
            Seccion, Unidad, Fecha, Monto_otorgado, Mes_primer_adeudo, Mes_ultimo_adeudo,
            Adeudo_en_pesos, Adeudo, Calle, Numero, Colonia_fraccionamiento, Codigo_postal,
            Municipio, Estado, Nomenclatura, Interes_ordinario, Interes_moratorio, Juzgado,
            Hora_requerimiento, Fecha_requerimiento, Tipo_demanda, Subtipo, Categoria, Template_id
        } = demandaData;

        await pool.query(
            `UPDATE Demandas SET
                Acreditado = IFNULL(?, Acreditado), Escritura = IFNULL(?, Escritura), 
                Fecha_escritura = IFNULL(?, Fecha_escritura), Inscripcion = IFNULL(?, Inscripcion), 
                Volumen = IFNULL(?, Volumen), Libro = IFNULL(?, Libro), Seccion = IFNULL(?, Seccion), 
                Unidad = IFNULL(?, Unidad), Fecha = IFNULL(?, Fecha), Monto_otorgado = IFNULL(?, Monto_otorgado), 
                Mes_primer_adeudo = IFNULL(?, Mes_primer_adeudo), Mes_ultimo_adeudo = IFNULL(?, Mes_ultimo_adeudo),
                Adeudo_en_pesos = IFNULL(?, Adeudo_en_pesos), Adeudo = IFNULL(?, Adeudo), Calle = IFNULL(?, Calle), 
                Numero = IFNULL(?, Numero), Colonia_fraccionamiento = IFNULL(?, Colonia_fraccionamiento), 
                Codigo_postal = IFNULL(?, Codigo_postal), Municipio = IFNULL(?, Municipio), Estado = IFNULL(?, Estado), 
                Nomenclatura = IFNULL(?, Nomenclatura), Interes_ordinario = IFNULL(?, Interes_ordinario), 
                Interes_moratorio = IFNULL(?, Interes_moratorio), Juzgado = IFNULL(?, Juzgado), 
                Hora_requerimiento = IFNULL(?, Hora_requerimiento), Fecha_requerimiento = IFNULL(?, Fecha_requerimiento), 
                Tipo_demanda = IFNULL(?, Tipo_demanda), Subtipo = IFNULL(?, Subtipo), Categoria = IFNULL(?, Categoria), 
                Template_id = IFNULL(?, Template_id)
            WHERE Credito = ?`,
            [Acreditado, Escritura, Fecha_escritura, Inscripcion, Volumen, Libro, Seccion, Unidad,
             Fecha, Monto_otorgado, Mes_primer_adeudo, Mes_ultimo_adeudo, Adeudo_en_pesos, Adeudo,
             Calle, Numero, Colonia_fraccionamiento, Codigo_postal, Municipio, Estado, Nomenclatura,
             Interes_ordinario, Interes_moratorio, Juzgado, Hora_requerimiento, Fecha_requerimiento, 
             Tipo_demanda, Subtipo, Categoria, Template_id, credito]
        );
        
        return await this.getByCredito(credito);
    }

    static async getByCredito(credito) {
        const [rows] = await pool.query(`SELECT * FROM Demandas WHERE Credito = ?`, [credito]);
        return rows.length ? new Demanda(rows[0]) : null;
    }

    static async getAll() {
        const [rows] = await pool.query(`SELECT * FROM Demandas`);
        return rows.map(row => new Demanda(row));
    }

    static async delete(credito) {
        const [result] = await pool.query(`DELETE FROM Demandas WHERE Credito = ?`, [credito]);
        return result.affectedRows;
    }
}

export default DemandaDAO;
