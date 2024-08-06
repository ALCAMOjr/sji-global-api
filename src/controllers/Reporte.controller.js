import { pool } from "../db.js";


export const getReporte = async (req, res) => {
    try {
        const { userId } = req;

        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).json({ message: 'Invalid user id' });
        }

        const user = users[0];
        if (user.user_type !== 'coordinador') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

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
                etv.macroetapa,
                -- Convertir fecha de formato con meses en español a formato de fecha
                CASE
                    WHEN etd.fecha LIKE '%ene.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'ene.', '01'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%feb.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'feb.', '02'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%mar.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'mar.', '03'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%abr.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'abr.', '04'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%may.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'may.', '05'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%jun.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'jun.', '06'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%jul.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'jul.', '07'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%ago.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'ago.', '08'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%sep.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'sep.', '09'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%oct.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'oct.', '10'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%nov.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'nov.', '11'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%dic.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'dic.', '12'), '%d/%m/%Y')
                    ELSE NULL
                END AS fecha_formateada  -- Campo adicional para trabajar internamente
            FROM expTribunalDetA etd
            LEFT JOIN EtapasTv etv ON etd.etapa = etv.etapa AND etd.termino = etv.termino
        ),
        
        ExpTribunalEtapasOrdenadas AS (
            SELECT 
                expTribunalA_numero,
                fecha_original,
                etapa,
                termino,
                notificacion,
                macroetapa,
                fecha_formateada,
                ROW_NUMBER() OVER (PARTITION BY expTribunalA_numero ORDER BY fecha_formateada DESC) AS row_num
            FROM ExpTribunalEtapas
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
                ete.notificacion,
                ete.macroetapa
            FROM CreditosEtapas ce
            JOIN ExpTribunalEtapasOrdenadas ete ON ce.num_credito = ete.expTribunalA_numero
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
                NULL AS notificacion,
                NULL AS macroetapa
            FROM CreditosSIAL c
            LEFT JOIN expTribunalDetA etd ON c.num_credito = etd.expTribunalA_numero
            WHERE etd.expTribunalA_numero IS NULL
        ),
        
        posicionExpediente AS (
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                macroetapa_aprobada,
                expTribunalA_numero,
                fecha,  -- Fecha original en formato español
                etapa,
                termino,
                notificacion,
                macroetapa
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
                notificacion,
                macroetapa
            FROM NoCoincidentes
        )
                
        SELECT
            COUNT(num_credito) AS 'Creditos Infonavit',
            COUNT(CASE 
                WHEN expTribunalA_numero IS NOT NULL AND expTribunalA_numero != '' 
                THEN 1 
                ELSE NULL 
            END) AS 'Expedientes Tribunal',
            COUNT(*) AS Total_Registros
        FROM 
            posicionExpediente;
        
        
        `);

        res.status(200).json(results);

    } catch (error) {
        console.error('Error retrieving position expedientes:', error);
        res.status(500).json({ message: 'Error retrieving position expedientes', error });
    }
};

export const getReporteDetalle = async (req, res) => {
    try {
        const { userId } = req;

        // Verifica el usuario
        const [users] = await pool.query('SELECT * FROM abogados WHERE id = ?', [userId]);
        if (users.length <= 0) {
            return res.status(400).json({ message: 'Invalid user id' });
        }

        const user = users[0];
        if (user.user_type !== 'coordinador') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

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
                etv.macroetapa,
                -- Convertir fecha de formato con meses en español a formato de fecha
                CASE
                    WHEN etd.fecha LIKE '%ene.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'ene.', '01'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%feb.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'feb.', '02'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%mar.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'mar.', '03'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%abr.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'abr.', '04'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%may.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'may.', '05'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%jun.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'jun.', '06'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%jul.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'jul.', '07'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%ago.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'ago.', '08'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%sep.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'sep.', '09'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%oct.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'oct.', '10'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%nov.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'nov.', '11'), '%d/%m/%Y')
                    WHEN etd.fecha LIKE '%dic.%' THEN STR_TO_DATE(REPLACE(etd.fecha, 'dic.', '12'), '%d/%m/%Y')
                    ELSE NULL
                END AS fecha_formateada  -- Campo adicional para trabajar internamente
            FROM expTribunalDetA etd
            LEFT JOIN EtapasTv etv ON etd.etapa = etv.etapa AND etd.termino = etv.termino
        ),
        
        ExpTribunalEtapasOrdenadas AS (
            SELECT 
                expTribunalA_numero,
                fecha_original,
                etapa,
                termino,
                notificacion,
                macroetapa,
                fecha_formateada,
                ROW_NUMBER() OVER (PARTITION BY expTribunalA_numero ORDER BY fecha_formateada DESC) AS row_num
            FROM ExpTribunalEtapas
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
                ete.notificacion,
                ete.macroetapa
            FROM CreditosEtapas ce
            JOIN ExpTribunalEtapasOrdenadas ete ON ce.num_credito = ete.expTribunalA_numero
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
                NULL AS notificacion,
                NULL AS macroetapa
            FROM CreditosSIAL c
            LEFT JOIN expTribunalDetA etd ON c.num_credito = etd.expTribunalA_numero
            WHERE etd.expTribunalA_numero IS NULL
        ),
        
        posicionExpediente AS (
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                macroetapa_aprobada,
                expTribunalA_numero,
                fecha,  -- Fecha original en formato español
                etapa,
                termino,
                notificacion,
                macroetapa
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
                notificacion,
                macroetapa
            FROM NoCoincidentes
        )
        
        -- Agrupar y contar por macroetapa_aprobada
        SELECT
            macroetapa_aprobada AS Etapa,
            COUNT(num_credito) AS Total_Creditos
        FROM
            posicionExpediente
        GROUP BY
            macroetapa_aprobada
        ORDER BY
            FIELD(macroetapa_aprobada, 
                '01. Asignación',
                '02. Convenios previos a demanda',
                '03. Demanda sin emplazamiento',
                '04. Emplazamiento sin sentencia',
                '06. Convenio Judicial',
                '07. Juicio con sentencia',
                '08. Proceso de ejecución',
                '09. Adjudicación',
                '10. Escrituración en proceso',
                '15. Autoseguros',
                '16. Liquidación',
                '17. Entrega por Poder Notarial',
                '18. Irrecuperabilidad'
            );
        
        `);

        res.status(200).json(results);

    } catch (error) {
        console.error('Error retrieving position expedientes:', error);
        res.status(500).json({ message: 'Error retrieving position expedientes', error });
    }
};
