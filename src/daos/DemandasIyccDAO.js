import { pool } from "../db.js";
import Demandas_iycc from "../models/DemandasIycc.js"; 

class DemandaIyccDAO {

    static async create(demandaData) {
        const {
            credito, subtipo, template_id, acreditado, categoria, escritura, escritura_ft, fecha, fecha_ft,
            inscripcion, volumen, libro, seccion, unidad, fecha1, fecha1_ft, monto_otorgado, monto_otorgado_ft,
            mes_primer_adeudo, mes_ultimo_adeudo, adeudo, adeudo_ft, calle, numero, colonia_fraccionamiento,
            municipio, estado, codigo_postal, interes_ordinario, interes_moratorio, juzgado, hora_requerimiento,
            fecha_requerimiento, fecha_requerimiento_ft
        } = demandaData;
        await pool.query(
            `INSERT INTO Demandas_iycc (
                credito, subtipo, template_id, acreditado, categoria, escritura, escritura_ft, fecha, fecha_ft,
                inscripcion, volumen, libro, seccion, unidad, fecha1, fecha1_ft, monto_otorgado, monto_otorgado_ft,
                mes_primer_adeudo, mes_ultimo_adeudo, adeudo, adeudo_ft, calle, numero, colonia_fraccionamiento,
                municipio, estado, codigo_postal, interes_ordinario, interes_moratorio, juzgado, hora_requerimiento,
                fecha_requerimiento, fecha_requerimiento_ft
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                credito, subtipo, template_id, acreditado, categoria, escritura, escritura_ft, fecha, fecha_ft,
                inscripcion, volumen, libro, seccion, unidad, fecha1, fecha1_ft, monto_otorgado, monto_otorgado_ft,
                mes_primer_adeudo, mes_ultimo_adeudo, adeudo, adeudo_ft, calle, numero, colonia_fraccionamiento,
                municipio, estado, codigo_postal, interes_ordinario, interes_moratorio, juzgado, hora_requerimiento,
                fecha_requerimiento, fecha_requerimiento_ft
            ]
        );
        return await this.getByCredito(credito);
    }
    
    

    static async getAll() {
        const [rows] = await pool.query(`SELECT * FROM Demandas_iycc`);
        return rows.map(row => new Demandas_iycc(row));
    }

    static async getByCredito(credito) {
        const [rows] = await pool.query(
            `SELECT * FROM Demandas_iycc WHERE credito = ?`,
            [credito]
        );
        return rows.map(row => new Demandas_iycc(row));
    }
    

    static async update(credito, updatedData) {
        const {
            subtipo, template_id, acreditado, categoria, escritura, escritura_ft, fecha, fecha_ft,
            inscripcion, volumen, libro, seccion, unidad, fecha1, fecha1_ft, monto_otorgado, monto_otorgado_ft,
            mes_primer_adeudo, mes_ultimo_adeudo, adeudo, adeudo_ft, calle, numero, colonia_fraccionamiento,
            municipio, estado, codigo_postal, interes_ordinario, interes_moratorio, juzgado, hora_requerimiento,
            fecha_requerimiento, fecha_requerimiento_ft
        } = updatedData;
    
          await pool.query(
            `UPDATE Demandas_iycc SET 
                subtipo = IFNULL(?, subtipo), 
                template_id = IFNULL(?, template_id), 
                acreditado = IFNULL(?, acreditado), 
                categoria = IFNULL(?, categoria), 
                escritura = IFNULL(?, escritura), 
                escritura_ft = IFNULL(?, escritura_ft), 
                fecha = IFNULL(?, fecha), 
                fecha_ft = IFNULL(?, fecha_ft), 
                inscripcion = IFNULL(?, inscripcion), 
                volumen = IFNULL(?, volumen), 
                libro = IFNULL(?, libro), 
                seccion = IFNULL(?, seccion), 
                unidad = IFNULL(?, unidad), 
                fecha1 = IFNULL(?, fecha1), 
                fecha1_ft = IFNULL(?, fecha1_ft), 
                monto_otorgado = IFNULL(?, monto_otorgado), 
                monto_otorgado_ft = IFNULL(?, monto_otorgado_ft), 
                mes_primer_adeudo = IFNULL(?, mes_primer_adeudo), 
                mes_ultimo_adeudo = IFNULL(?, mes_ultimo_adeudo), 
                adeudo = IFNULL(?, adeudo), 
                adeudo_ft = IFNULL(?, adeudo_ft), 
                calle = IFNULL(?, calle), 
                numero = IFNULL(?, numero), 
                colonia_fraccionamiento = IFNULL(?, colonia_fraccionamiento), 
                municipio = IFNULL(?, municipio), 
                estado = IFNULL(?, estado), 
                codigo_postal = IFNULL(?, codigo_postal), 
                interes_ordinario = IFNULL(?, interes_ordinario), 
                interes_moratorio = IFNULL(?, interes_moratorio), 
                juzgado = IFNULL(?, juzgado), 
                hora_requerimiento = IFNULL(?, hora_requerimiento), 
                fecha_requerimiento = IFNULL(?, fecha_requerimiento), 
                fecha_requerimiento_ft = IFNULL(?, fecha_requerimiento_ft)
            WHERE credito = ?`,
            [
                subtipo, template_id, acreditado, categoria, escritura, escritura_ft, fecha, fecha_ft,
                inscripcion, volumen, libro, seccion, unidad, fecha1, fecha1_ft, monto_otorgado, monto_otorgado_ft,
                mes_primer_adeudo, mes_ultimo_adeudo, adeudo, adeudo_ft, calle, numero, colonia_fraccionamiento,
                municipio, estado, codigo_postal, interes_ordinario, interes_moratorio, juzgado, hora_requerimiento,
                fecha_requerimiento, fecha_requerimiento_ft, credito
            ]
        );
    
        return await this.getByCredito(credito);
    }
    

    static async delete(credito) {
        const [result] = await pool.query(
            `DELETE FROM Demandas_iycc WHERE credito = ?`,
            [credito]
        );

        return result.affectedRows;
    }
}

export default DemandaIyccDAO;
