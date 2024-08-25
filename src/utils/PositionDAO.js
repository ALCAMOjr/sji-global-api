import { pool } from "../db.js";

class PositionDao {
    static async getAll() {
        const [results] = await pool.query(`
        -- Consulta 1: Tomar datos de CreditosSIAL
        WITH CreditosEtapas AS (
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                macroetapa_aprobada
            FROM CreditosSIAL
        ),
        
        ExpTribunalEtapas AS (
            SELECT 
                etd.expTribunalA_numero,
                etd.fecha AS fecha_original,  -- Mantener el campo original
                etd.etapa,
                etd.termino,
                etd.notificacion,
                -- Convertir fecha de formato con meses en español a formato de fecha
                STR_TO_DATE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        REPLACE(
                                            REPLACE(
                                                REPLACE(
                                                    REPLACE(
                                                        REPLACE(
                                                            REPLACE(
                                                                REPLACE(etd.fecha, 'ene.', '01'),
                                                                'feb.', '02'),
                                                            'mar.', '03'),
                                                        'abr.', '04'),
                                                    'may.', '05'),
                                                'jun.', '06'),
                                            'jul.', '07'),
                                        'ago.', '08'),
                                    'sep.', '09'),
                                'oct.', '10'),
                            'nov.', '11'),
                        'dic.', '12'),
                    '%d/%m/%Y') AS fecha_formateada,  -- Campo adicional para trabajar internamente
                ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY STR_TO_DATE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        REPLACE(
                                            REPLACE(
                                                REPLACE(
                                                    REPLACE(
                                                        REPLACE(
                                                            REPLACE(
                                                                REPLACE(etd.fecha, 'ene.', '01'),
                                                                'feb.', '02'),
                                                            'mar.', '03'),
                                                        'abr.', '04'),
                                                    'may.', '05'),
                                                'jun.', '06'),
                                            'jul.', '07'),
                                        'ago.', '08'),
                                    'sep.', '09'),
                                'oct.', '10'),
                            'nov.', '11'),
                        'dic.', '12'),
                    '%d/%m/%Y') DESC) AS row_num
            FROM expTribunalDetA etd
            LEFT JOIN EtapasTv etv ON etd.etapa = etv.etapa AND etd.termino = etv.termino
        ),
        
        Coincidentes AS (
            SELECT 
                ce.num_credito,
                ce.ultima_etapa_aprobada,
                ce.fecha_ultima_etapa_aprobada,
                ce.macroetapa_aprobada,
                ete.expTribunalA_numero,
                ete.fecha_original AS fecha,  -- Mantener la fecha original
                ete.etapa,
                ete.termino,
                ete.notificacion
            FROM CreditosEtapas ce
            JOIN ExpTribunalEtapas ete ON ce.num_credito = ete.expTribunalA_numero
            WHERE ete.row_num = 1
        ),
        
        NoCoincidentes AS (
            SELECT 
                c.num_credito,
                c.ultima_etapa_aprobada,
                c.fecha_ultima_etapa_aprobada,
                c.macroetapa_aprobada,
                NULL AS expTribunalA_numero,
                NULL AS fecha,
                NULL AS etapa,
                NULL AS termino,
                NULL AS notificacion
            FROM CreditosSIAL c
            LEFT JOIN expTribunalDetA etd ON c.num_credito = etd.expTribunalA_numero
            WHERE etd.expTribunalA_numero IS NULL
        )
        
        -- Combinar ambos resultados
        SELECT 
            num_credito,
            ultima_etapa_aprobada,
            fecha_ultima_etapa_aprobada,
            macroetapa_aprobada,
            expTribunalA_numero,
            fecha,  -- Fecha original en formato español
            etapa,
            termino,
            notificacion
        FROM Coincidentes
        
        UNION ALL
        
        SELECT 
            num_credito,
            ultima_etapa_aprobada,
            fecha_ultima_etapa_aprobada,
            macroetapa_aprobada,
            expTribunalA_numero,
            fecha,
            etapa,
            termino,
            notificacion
        FROM NoCoincidentes;        
        `);
        return results;
    }



    static async getAllbyNumber(number) {
        const [results] = await pool.query(`
        -- Consulta 1: Tomar datos de CreditosSIAL filtrados por número de crédito
        WITH CreditosEtapas AS (
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                macroetapa_aprobada
            FROM CreditosSIAL
            WHERE num_credito = ?  -- Filtrar por el número de crédito específico
        ),
        
        -- Consulta 2: Tomar datos de expTribunalDetA filtrados por número de expediente y convertir fechas
        ExpTribunalEtapas AS (
            SELECT 
                etd.expTribunalA_numero,
                etd.fecha AS fecha_original,  -- Mantener el campo original
                etd.etapa,
                etd.termino,
                etd.notificacion,
                -- Convertir fecha de formato con meses en español a formato de fecha
                STR_TO_DATE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        REPLACE(
                                            REPLACE(
                                                REPLACE(
                                                    REPLACE(
                                                        REPLACE(
                                                            REPLACE(
                                                                REPLACE(etd.fecha, 'ene.', '01'),
                                                                'feb.', '02'),
                                                            'mar.', '03'),
                                                        'abr.', '04'),
                                                    'may.', '05'),
                                                'jun.', '06'),
                                            'jul.', '07'),
                                        'ago.', '08'),
                                    'sep.', '09'),
                                'oct.', '10'),
                            'nov.', '11'),
                        'dic.', '12'),
                    '%d/%m/%Y') AS fecha_formateada,  -- Campo adicional para trabajar internamente
                ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY STR_TO_DATE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        REPLACE(
                                            REPLACE(
                                                REPLACE(
                                                    REPLACE(
                                                        REPLACE(
                                                            REPLACE(
                                                                REPLACE(etd.fecha, 'ene.', '01'),
                                                                'feb.', '02'),
                                                            'mar.', '03'),
                                                        'abr.', '04'),
                                                    'may.', '05'),
                                                'jun.', '06'),
                                            'jul.', '07'),
                                        'ago.', '08'),
                                    'sep.', '09'),
                                'oct.', '10'),
                            'nov.', '11'),
                        'dic.', '12'),
                    '%d/%m/%Y') DESC) AS row_num
            FROM expTribunalDetA etd
            LEFT JOIN EtapasTv etv ON etd.etapa = etv.etapa AND etd.termino = etv.termino
            WHERE etd.expTribunalA_numero = ?  -- Filtrar por el número de expediente específico
        ),
        
        -- Consulta 3: Coincidentes
        Coincidentes AS (
            SELECT 
                ce.num_credito,
                ce.ultima_etapa_aprobada,
                ce.fecha_ultima_etapa_aprobada,
                ce.macroetapa_aprobada,
                ete.expTribunalA_numero,
                ete.fecha_original AS fecha,  -- Mantener la fecha original
                ete.etapa,
                ete.termino,
                ete.notificacion
            FROM CreditosEtapas ce
            JOIN ExpTribunalEtapas ete ON ce.num_credito = ete.expTribunalA_numero
            WHERE ete.row_num = 1
        ),
        
        -- Consulta 4: No Coincidentes
        NoCoincidentes AS (
            SELECT 
                c.num_credito,
                c.ultima_etapa_aprobada,
                c.fecha_ultima_etapa_aprobada,
                c.macroetapa_aprobada,
                NULL AS expTribunalA_numero,
                NULL AS fecha,
                NULL AS etapa,
                NULL AS termino,
                NULL AS notificacion
            FROM CreditosSIAL c
            LEFT JOIN expTribunalDetA etd ON c.num_credito = etd.expTribunalA_numero
            WHERE etd.expTribunalA_numero IS NULL
            AND c.num_credito = ?  -- Filtrar por el número de crédito específico
        )
        
        -- Combinar ambos resultados
        SELECT 
            num_credito,
            ultima_etapa_aprobada,
            fecha_ultima_etapa_aprobada,
            macroetapa_aprobada,
            expTribunalA_numero,
            fecha,  -- Fecha original en formato español
            etapa,
            termino,
            notificacion
        FROM Coincidentes
        
        UNION ALL
        
        SELECT 
            num_credito,
            ultima_etapa_aprobada,
            fecha_ultima_etapa_aprobada,
            macroetapa_aprobada,
            expTribunalA_numero,
            fecha,
            etapa,
            termino,
            notificacion
        FROM NoCoincidentes;
        `, [number, number, number]);
        
        return results;
    }
    
static async getAllByMacroetapa(macroetapa) {
    const [results] = await pool.query(`
    WITH CreditosEtapas AS (
        SELECT 
            num_credito,
            ultima_etapa_aprobada,
            fecha_ultima_etapa_aprobada,
            macroetapa_aprobada
        FROM CreditosSIAL
        WHERE macroetapa_aprobada = ?  -- Filtrar por la macroetapa específica
    ),
    
    ExpTribunalEtapas AS (
        SELECT 
            etd.expTribunalA_numero,
            etd.fecha AS fecha_original,  -- Mantener el campo original
            etd.etapa,
            etd.termino,
            etd.notificacion,
            -- Convertir fecha de formato con meses en español a formato de fecha
            STR_TO_DATE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        REPLACE(
                                            REPLACE(
                                                REPLACE(
                                                    REPLACE(
                                                        REPLACE(
                                                            REPLACE(etd.fecha, 'ene.', '01'),
                                                            'feb.', '02'),
                                                        'mar.', '03'),
                                                    'abr.', '04'),
                                                'may.', '05'),
                                            'jun.', '06'),
                                        'jul.', '07'),
                                    'ago.', '08'),
                                'sep.', '09'),
                            'oct.', '10'),
                        'nov.', '11'),
                    'dic.', '12'),
                '%d/%m/%Y') AS fecha_formateada,  -- Campo adicional para trabajar internamente
            ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY STR_TO_DATE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        REPLACE(
                                            REPLACE(
                                                REPLACE(
                                                    REPLACE(
                                                        REPLACE(
                                                            REPLACE(etd.fecha, 'ene.', '01'),
                                                            'feb.', '02'),
                                                        'mar.', '03'),
                                                    'abr.', '04'),
                                                'may.', '05'),
                                            'jun.', '06'),
                                        'jul.', '07'),
                                    'ago.', '08'),
                                'sep.', '09'),
                            'oct.', '10'),
                        'nov.', '11'),
                    'dic.', '12'),
                '%d/%m/%Y') DESC) AS row_num
        FROM expTribunalDetA etd
        LEFT JOIN EtapasTv etv ON etd.etapa = etv.etapa AND etd.termino = etv.termino
    ),
    
    Coincidentes AS (
        SELECT 
            ce.num_credito,
            ce.ultima_etapa_aprobada,
            ce.fecha_ultima_etapa_aprobada,
            ce.macroetapa_aprobada,
            ete.expTribunalA_numero,
            ete.fecha_original AS fecha,  -- Mantener la fecha original
            ete.etapa,
            ete.termino,
            ete.notificacion
        FROM CreditosEtapas ce
        JOIN ExpTribunalEtapas ete ON ce.num_credito = ete.expTribunalA_numero
        WHERE ete.row_num = 1
    ),
    
    NoCoincidentes AS (
        SELECT 
            c.num_credito,
            c.ultima_etapa_aprobada,
            c.fecha_ultima_etapa_aprobada,
            c.macroetapa_aprobada,
            NULL AS expTribunalA_numero,
            NULL AS fecha,
            NULL AS etapa,
            NULL AS termino,
            NULL AS notificacion
        FROM CreditosSIAL c
        LEFT JOIN expTribunalDetA etd ON c.num_credito = etd.expTribunalA_numero
        WHERE etd.expTribunalA_numero IS NULL
        AND c.macroetapa_aprobada = ?  -- Filtrar por la macroetapa específica
    )
    
    -- Combinar ambos resultados
    SELECT 
        num_credito,
        ultima_etapa_aprobada,
        fecha_ultima_etapa_aprobada,
        macroetapa_aprobada,
        expTribunalA_numero,
        fecha,  -- Fecha original en formato español
        etapa,
        termino,
        notificacion
    FROM Coincidentes
    
    UNION ALL
    
    SELECT 
        num_credito,
        ultima_etapa_aprobada,
        fecha_ultima_etapa_aprobada,
        macroetapa_aprobada,
        expTribunalA_numero,
        fecha,
        etapa,
        termino,
        notificacion
    FROM NoCoincidentes;
    
    `, [macroetapa, macroetapa]);
    
    return results;
}
static async getAllByEtapa(etapa, termino, notificacion) {
    const [results] = await pool.query(`
    WITH CreditosEtapas AS (
        SELECT 
            num_credito,
            ultima_etapa_aprobada,
            fecha_ultima_etapa_aprobada,
            macroetapa_aprobada
        FROM CreditosSIAL
    ),
    
    ExpTribunalEtapas AS (
        SELECT 
            etd.expTribunalA_numero,
            etd.fecha AS fecha_original,  
            etd.etapa,
            etd.termino,
            etd.notificacion,
            STR_TO_DATE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        REPLACE(
                                            REPLACE(
                                                REPLACE(
                                                    REPLACE(
                                                        REPLACE(
                                                            REPLACE(etd.fecha, 'ene.', '01'),
                                                            'feb.', '02'),
                                                        'mar.', '03'),
                                                    'abr.', '04'),
                                                'may.', '05'),
                                            'jun.', '06'),
                                        'jul.', '07'),
                                    'ago.', '08'),
                                'sep.', '09'),
                            'oct.', '10'),
                        'nov.', '11'),
                    'dic.', '12'),
                '%d/%m/%Y') AS fecha_formateada, 
            ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY STR_TO_DATE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        REPLACE(
                                            REPLACE(
                                                REPLACE(
                                                    REPLACE(
                                                        REPLACE(
                                                            REPLACE(etd.fecha, 'ene.', '01'),
                                                            'feb.', '02'),
                                                        'mar.', '03'),
                                                    'abr.', '04'),
                                                'may.', '05'),
                                            'jun.', '06'),
                                        'jul.', '07'),
                                    'ago.', '08'),
                                'sep.', '09'),
                            'oct.', '10'),
                        'nov.', '11'),
                    'dic.', '12'),
                '%d/%m/%Y') DESC) AS row_num
        FROM expTribunalDetA etd
        LEFT JOIN EtapasTv etv ON etd.etapa = etv.etapa AND etd.termino = etv.termino
        WHERE etd.etapa = ? AND etd.termino = ? AND etd.notificacion = ?  
    ),
    
    Coincidentes AS (
        SELECT 
            ce.num_credito,
            ce.ultima_etapa_aprobada,
            ce.fecha_ultima_etapa_aprobada,
            ce.macroetapa_aprobada,
            ete.expTribunalA_numero,
            ete.fecha_original AS fecha,  
            ete.etapa,
            ete.termino,
            ete.notificacion
        FROM CreditosEtapas ce
        JOIN ExpTribunalEtapas ete ON ce.num_credito = ete.expTribunalA_numero
        WHERE ete.row_num = 1
    ),
    
    NoCoincidentes AS (
        SELECT 
            c.num_credito,
            c.ultima_etapa_aprobada,
            c.fecha_ultima_etapa_aprobada,
            c.macroetapa_aprobada,
            NULL AS expTribunalA_numero,
            NULL AS fecha,
            NULL AS etapa,
            NULL AS termino,
            NULL AS notificacion
        FROM CreditosSIAL c
        LEFT JOIN expTribunalDetA etd ON c.num_credito = etd.expTribunalA_numero
        WHERE etd.expTribunalA_numero IS NULL 
        AND etd.etapa = ? 
        AND etd.termino = ? 
        AND etd.notificacion = ?
    )
    
    SELECT 
        num_credito,
        ultima_etapa_aprobada,
        fecha_ultima_etapa_aprobada,
        macroetapa_aprobada,
        expTribunalA_numero,
        fecha,  
        etapa,
        termino,
        notificacion
    FROM Coincidentes
    
    UNION ALL
    
    SELECT 
        num_credito,
        ultima_etapa_aprobada,
        fecha_ultima_etapa_aprobada,
        macroetapa_aprobada,
        expTribunalA_numero,
        fecha,
        etapa,
        termino,
        notificacion
    FROM NoCoincidentes;
    
    `, [etapa, termino, notificacion, etapa, termino, notificacion]);
    
    return results;
}


}

export default PositionDao;
