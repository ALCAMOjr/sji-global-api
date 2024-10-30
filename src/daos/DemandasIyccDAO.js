import { pool } from "../db.js";
import Demandas_iycc from "../models/DemandasIycc.js"; 

class DemandaIyccDAO {

    static async create(demandaData) {
        const {
            credito, subtipo, acreditado, categoria, escritura, escritura_ft, fecha_escritura, fecha_escritura_ft,
            inscripcion, volumen, libro, seccion, unidad, fecha, fecha_ft, monto_otorgado, monto_otorgado_ft,
            mes_primer_adeudo, mes_ultimo_adeudo, adeudo, adeudo_ft, adeudo_pesos, adeudo_pesos_ft, calle, numero,
            colonia_fraccionamiento, municipio, estado, codigo_postal, interes_ordinario, interes_moratorio,
            juzgado, hora_requerimiento, fecha_requerimiento, fecha_requerimiento_ft, folio, numero_ss
        } = demandaData;
    
        const values = [
            credito, subtipo, acreditado || null, categoria, escritura || null, escritura_ft || null, 
            fecha_escritura || null, fecha_escritura_ft || null, inscripcion || null, volumen || null, libro || null, 
            seccion, unidad || null, fecha || null, fecha_ft || null, monto_otorgado || null, monto_otorgado_ft || null,
            mes_primer_adeudo || null, mes_ultimo_adeudo || null, adeudo || null, adeudo_ft || null, adeudo_pesos || null, 
            adeudo_pesos_ft || null, calle || null, numero || null, colonia_fraccionamiento || null, municipio || null, 
            estado || null, codigo_postal || null, interes_ordinario || null, interes_moratorio || null, juzgado || null, 
            hora_requerimiento || null, fecha_requerimiento || null, fecha_requerimiento_ft || null, folio || null, numero_ss || null
        ];
    
        await pool.query(
            `INSERT INTO Demandas_iycc (
                credito, subtipo, acreditado, categoria, escritura, escritura_ft, fecha_escritura, fecha_escritura_ft,
                inscripcion, volumen, libro, seccion, unidad, fecha, fecha_ft, monto_otorgado, monto_otorgado_ft,
                mes_primer_adeudo, mes_ultimo_adeudo, adeudo, adeudo_ft, adeudo_pesos, adeudo_pesos_ft, calle, numero,
                colonia_fraccionamiento, municipio, estado, codigo_postal, interes_ordinario, interes_moratorio,
                juzgado, hora_requerimiento, fecha_requerimiento, fecha_requerimiento_ft, folio, numero_ss
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            values
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
            subtipo, acreditado, categoria, escritura, escritura_ft, fecha_escritura, fecha_escritura_ft,
            inscripcion, volumen, libro, seccion, unidad, fecha, fecha_ft, monto_otorgado, monto_otorgado_ft,
            mes_primer_adeudo, mes_ultimo_adeudo, adeudo, adeudo_ft, adeudo_pesos, adeudo_pesos_ft, calle, numero,
            colonia_fraccionamiento, municipio, estado, codigo_postal, interes_ordinario, interes_moratorio, juzgado,
            hora_requerimiento, fecha_requerimiento, fecha_requerimiento_ft, folio, numero_ss
        } = updatedData;
    
        await pool.query(
            `UPDATE Demandas_iycc SET 
                subtipo = IFNULL(?, subtipo), 
                acreditado = IFNULL(?, acreditado), 
                categoria = IFNULL(?, categoria), 
                escritura = IFNULL(?, escritura), 
                escritura_ft = IFNULL(?, escritura_ft), 
                fecha_escritura = IFNULL(?, fecha_escritura), 
                fecha_escritura_ft = IFNULL(?, fecha_escritura_ft), 
                inscripcion = IFNULL(?, inscripcion), 
                volumen = IFNULL(?, volumen), 
                libro = IFNULL(?, libro), 
                seccion = IFNULL(?, seccion), 
                unidad = IFNULL(?, unidad), 
                fecha = IFNULL(?, fecha), 
                fecha_ft = IFNULL(?, fecha_ft), 
                monto_otorgado = IFNULL(?, monto_otorgado), 
                monto_otorgado_ft = IFNULL(?, monto_otorgado_ft), 
                mes_primer_adeudo = IFNULL(?, mes_primer_adeudo), 
                mes_ultimo_adeudo = IFNULL(?, mes_ultimo_adeudo), 
                adeudo = IFNULL(?, adeudo), 
                adeudo_ft = IFNULL(?, adeudo_ft), 
                adeudo_pesos = IFNULL(?, adeudo_pesos), 
                adeudo_pesos_ft = IFNULL(?, adeudo_pesos_ft), 
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
                fecha_requerimiento_ft = IFNULL(?, fecha_requerimiento_ft),
                folio = IFNULL(?, folio), 
                numero_ss = IFNULL(?, numero_ss)
            WHERE credito = ?`,
            [
                subtipo, acreditado, categoria, escritura, escritura_ft, fecha_escritura, fecha_escritura_ft,
                inscripcion, volumen, libro, seccion, unidad, fecha, fecha_ft, monto_otorgado, monto_otorgado_ft,
                mes_primer_adeudo, mes_ultimo_adeudo, adeudo, adeudo_ft, adeudo_pesos, adeudo_pesos_ft, calle, numero,
                colonia_fraccionamiento, municipio, estado, codigo_postal, interes_ordinario, interes_moratorio, 
                juzgado, hora_requerimiento, fecha_requerimiento, fecha_requerimiento_ft, folio, numero_ss, credito
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
