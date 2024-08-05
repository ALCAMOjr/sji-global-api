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
        WITH CreditosEtapas AS (
            SELECT 
                c.num_credito,
                c.ultima_etapa_aprobada,
                c.fecha_ultima_etapa_aprobada,
                e.secuencia AS secuencia_etapa_aprobada
            FROM CreditosSIAL c
            LEFT JOIN EtapasSial e ON c.ultima_etapa_aprobada = e.etapa
        ),
        ExpTribunalEtapas AS (
            SELECT 
                etd.expTribunalA_numero,
                etd.fecha,
                etd.etapa,
                etd.termino,
                etv.secuencia AS secuencia_etapa_tv,
                ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY STR_TO_DATE(etd.fecha, '%d/%b./%Y') DESC) AS row_num
            FROM expTribunalDetA etd
            LEFT JOIN EtapasTv etv ON etd.etapa = etv.etapa AND etd.termino = etv.termino
        ),
        Coincidentes AS (
            SELECT 
                ce.num_credito,
                ce.ultima_etapa_aprobada,
                ce.fecha_ultima_etapa_aprobada,
                ce.secuencia_etapa_aprobada,
                ete.expTribunalA_numero,
                ete.fecha,
                ete.etapa,
                ete.termino,
                ete.secuencia_etapa_tv
            FROM CreditosEtapas ce
            JOIN ExpTribunalEtapas ete ON ce.num_credito = ete.expTribunalA_numero
            WHERE ete.row_num = 1
        ),
        NoCoincidentes AS (
            SELECT 
                c.num_credito,
                c.ultima_etapa_aprobada,
                c.fecha_ultima_etapa_aprobada,
                NULL AS secuencia_etapa_aprobada,
                NULL AS expTribunalA_numero,
                NULL AS fecha,
                NULL AS etapa,
                NULL AS termino,
                NULL AS secuencia_etapa_tv
            FROM CreditosSIAL c
            LEFT JOIN expTribunalDetA etd ON c.num_credito = etd.expTribunalA_numero
            WHERE etd.expTribunalA_numero IS NULL
        ),
        posicionExpediente AS (
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                secuencia_etapa_aprobada,
                expTribunalA_numero,
                fecha,
                etapa,
                termino,
                secuencia_etapa_tv
            FROM Coincidentes
            
            UNION ALL
            
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                secuencia_etapa_aprobada,
                expTribunalA_numero,
                fecha,
                etapa,
                termino,
                secuencia_etapa_tv
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
        WITH CreditosEtapas AS (
            SELECT 
                c.num_credito,
                c.ultima_etapa_aprobada,
                c.fecha_ultima_etapa_aprobada,
                e.secuencia AS secuencia_etapa_aprobada
            FROM CreditosSIAL c
            LEFT JOIN EtapasSial e ON c.ultima_etapa_aprobada = e.etapa
        ),
        ExpTribunalEtapas AS (
            SELECT 
                etd.expTribunalA_numero,
                etd.fecha,
                etd.etapa,
                etd.termino,
                etv.secuencia AS secuencia_etapa_tv,
                ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY STR_TO_DATE(etd.fecha, '%d/%b./%Y') DESC) AS row_num
            FROM expTribunalDetA etd
            LEFT JOIN EtapasTv etv ON etd.etapa = etv.etapa AND etd.termino = etv.termino
        ),
        Coincidentes AS (
            SELECT 
                ce.num_credito,
                ce.ultima_etapa_aprobada,
                ce.fecha_ultima_etapa_aprobada,
                ce.secuencia_etapa_aprobada,
                ete.expTribunalA_numero,
                ete.fecha,
                ete.etapa,
                ete.termino,
                ete.secuencia_etapa_tv
            FROM CreditosEtapas ce
            JOIN ExpTribunalEtapas ete ON ce.num_credito = ete.expTribunalA_numero
            WHERE ete.row_num = 1
        ),
        NoCoincidentes AS (
            SELECT 
                c.num_credito,
                c.ultima_etapa_aprobada,
                c.fecha_ultima_etapa_aprobada,
                NULL AS secuencia_etapa_aprobada,
                NULL AS expTribunalA_numero,
                NULL AS fecha,
                NULL AS etapa,
                NULL AS termino,
                NULL AS secuencia_etapa_tv
            FROM CreditosSIAL c
            LEFT JOIN expTribunalDetA etd ON c.num_credito = etd.expTribunalA_numero
            WHERE etd.expTribunalA_numero IS NULL
        ),
        posicionExpediente AS (
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                secuencia_etapa_aprobada,
                expTribunalA_numero,
                fecha,
                etapa,
                termino,
                secuencia_etapa_tv
            FROM Coincidentes
            
            UNION ALL
            
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                secuencia_etapa_aprobada,
                expTribunalA_numero,
                fecha,
                etapa,
                termino,
                secuencia_etapa_tv
            FROM NoCoincidentes
        )

        SELECT
            COUNT(CASE 
                WHEN (secuencia_etapa_aprobada IS NULL OR secuencia_etapa_aprobada = '') AND (secuencia_etapa_tv IS NULL OR secuencia_etapa_tv = '') 
                THEN 1 
                ELSE NULL 
            END) AS Asignacion,
            
            COUNT(CASE 
                WHEN secuencia_etapa_aprobada = '1' AND (secuencia_etapa_tv IS NULL OR secuencia_etapa_tv = '') 
                THEN 1 
                ELSE NULL 
            END) AS Presentacion,
            
            COUNT(CASE 
                WHEN secuencia_etapa_aprobada = secuencia_etapa_tv AND secuencia_etapa_aprobada != '1' AND secuencia_etapa_aprobada IS NOT NULL AND secuencia_etapa_aprobada != '' 
                THEN 1 
                ELSE NULL 
            END) AS Nivelado,
            
            COUNT(CASE 
                WHEN secuencia_etapa_aprobada != secuencia_etapa_tv AND secuencia_etapa_aprobada != '1' AND secuencia_etapa_tv != '1' AND secuencia_etapa_aprobada IS NOT NULL AND secuencia_etapa_aprobada != '' AND secuencia_etapa_tv IS NOT NULL AND secuencia_etapa_tv != '' 
                     AND ABS(CAST(secuencia_etapa_aprobada AS SIGNED) - CAST(secuencia_etapa_tv AS SIGNED)) IN (1, 2)
                THEN 1 
                ELSE NULL 
            END) AS Empuje1o2niveles,
            
            COUNT(CASE 
                WHEN secuencia_etapa_aprobada != secuencia_etapa_tv AND secuencia_etapa_aprobada != '1' AND secuencia_etapa_tv != '1' AND secuencia_etapa_aprobada IS NOT NULL AND secuencia_etapa_aprobada != '' AND secuencia_etapa_tv IS NOT NULL AND secuencia_etapa_tv != '' 
                     AND ABS(CAST(secuencia_etapa_aprobada AS SIGNED) - CAST(secuencia_etapa_tv AS SIGNED)) > 2
                THEN 1 
                ELSE NULL 
            END) AS Empuje3omasniveles,

            COUNT(*) AS TotalRegistros
        FROM 
            posicionExpediente;
        `);

        res.status(200).json(results);

    } catch (error) {
        console.error('Error retrieving position expedientes:', error);
        res.status(500).json({ message: 'Error retrieving position expedientes', error });
    }
};
