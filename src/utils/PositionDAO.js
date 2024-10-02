import { pool } from "../db.js";

class PositionDao {
   
    
    static async getAll() {
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
                    etd.format_fecha AS fecha_formateada, 
                    ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY etd.format_fecha DESC) AS row_num  
                FROM expTribunalDetA etd
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
                    ete.notificacion,
                    eta.nombre, 
                    eta.url,
                    d.id AS detalle_id,
                    d.ver_acuerdo,
                    d.fecha AS detalle_fecha,
                    d.etapa AS detalle_etapa,
                    d.termino AS detalle_termino,
                    d.notificacion AS detalle_notificacion
                FROM CreditosEtapas ce
                JOIN ExpTribunalEtapas ete ON ce.num_credito = ete.expTribunalA_numero
                JOIN expTribunalA eta ON ete.expTribunalA_numero = eta.numero
                LEFT JOIN expTribunalDetA d ON ete.expTribunalA_numero = d.expTribunalA_numero  -- Unir los detalles
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
                    NULL AS nombre, 
                    NULL AS url,
                    NULL AS detalle_id,
                    NULL AS ver_acuerdo,
                    NULL AS detalle_fecha,
                    NULL AS detalle_etapa,
                    NULL AS detalle_termino,
                    NULL AS detalle_notificacion
                FROM CreditosSIAL c
                LEFT JOIN expTribunalDetA etd ON c.num_credito = etd.expTribunalA_numero
                WHERE etd.expTribunalA_numero IS NULL
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
                notificacion,
                nombre, 
                url,
                detalle_id,
                ver_acuerdo,
                detalle_fecha,
                detalle_etapa,
                detalle_termino,
                detalle_notificacion
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
                nombre,
                url,
                detalle_id,
                ver_acuerdo,
                detalle_fecha,
                detalle_etapa,
                detalle_termino,
                detalle_notificacion
            FROM NoCoincidentes;
        `);
    
        const expedientesMap = results.reduce((map, row) => {
            if (!map[row.num_credito]) {
                map[row.num_credito] = {
                    num_credito: row.num_credito,
                    ultima_etapa_aprobada: row.ultima_etapa_aprobada,
                    fecha_ultima_etapa_aprobada: row.fecha_ultima_etapa_aprobada,
                    macroetapa_aprobada: row.macroetapa_aprobada,
                    expTribunalA_numero: row.expTribunalA_numero,
                    fecha: row.fecha,
                    etapa: row.etapa,
                    termino: row.termino,
                    notificacion: row.notificacion,
                    nombre: row.nombre,
                    url: row.url,
                    detalles: []
                };
            }
            if (row.detalle_id) {
                map[row.num_credito].detalles.push({
                    id: row.detalle_id,
                    ver_acuerdo: row.ver_acuerdo,
                    fecha: row.detalle_fecha,
                    etapa: row.detalle_etapa,
                    termino: row.detalle_termino,
                    notificacion: row.detalle_notificacion
                });
            }
            return map;
        }, {});
    
        return Object.values(expedientesMap);
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
            
            -- Consulta 2: Tomar datos de expTribunalDetA filtrados por número de expediente usando la fecha ya formateada
            ExpTribunalEtapas AS (
                SELECT 
                    etd.expTribunalA_numero,
                    etd.fecha AS fecha_original,  -- Mantener el campo original
                    etd.etapa,
                    etd.termino,
                    etd.notificacion,
                    etd.format_fecha AS fecha_formateada,  -- Usar el campo de fecha ya formateada
                    ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY etd.format_fecha DESC) AS row_num  -- Ordenar por la fecha formateada
                FROM expTribunalDetA etd
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
                    ete.notificacion,
                    eta.nombre,  -- Obtener el campo nombre
                    eta.url      -- Obtener el campo url
                FROM CreditosEtapas ce
                JOIN ExpTribunalEtapas ete ON ce.num_credito = ete.expTribunalA_numero
                JOIN expTribunalA eta ON ete.expTribunalA_numero = eta.numero
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
                    NULL AS notificacion,
                    NULL AS nombre,
                    NULL AS url    
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
                notificacion,
                nombre, 
                url     
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
                nombre,
                url     
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
                    etd.fecha AS fecha_original,  
                    etd.etapa,
                    etd.termino,
                    etd.notificacion,
                    etd.format_fecha AS fecha_formateada, 
                    ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY etd.format_fecha DESC) AS row_num  
                FROM expTribunalDetA etd
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
                    ete.notificacion,
                    eta.nombre, 
                    eta.url,
                    d.id AS detalle_id,
                    d.ver_acuerdo,
                    d.fecha AS detalle_fecha,
                    d.etapa AS detalle_etapa,
                    d.termino AS detalle_termino,
                    d.notificacion AS detalle_notificacion
                FROM CreditosEtapas ce
                JOIN ExpTribunalEtapas ete ON ce.num_credito = ete.expTribunalA_numero
                JOIN expTribunalA eta ON ete.expTribunalA_numero = eta.numero
                LEFT JOIN expTribunalDetA d ON ete.expTribunalA_numero = d.expTribunalA_numero  
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
                    NULL AS nombre, 
                    NULL AS url,
                    NULL AS detalle_id,
                    NULL AS ver_acuerdo,
                    NULL AS detalle_fecha,
                    NULL AS detalle_etapa,
                    NULL AS detalle_termino,
                    NULL AS detalle_notificacion
                FROM CreditosSIAL c
                LEFT JOIN expTribunalDetA etd ON c.num_credito = etd.expTribunalA_numero
                WHERE etd.expTribunalA_numero IS NULL
                AND c.macroetapa_aprobada = ?  -- Filtrar por la macroetapa específica
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
                notificacion,
                nombre, 
                url,
                detalle_id,
                ver_acuerdo,
                detalle_fecha,
                detalle_etapa,
                detalle_termino,
                detalle_notificacion
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
                nombre,
                url,
                detalle_id,
                ver_acuerdo,
                detalle_fecha,
                detalle_etapa,
                detalle_termino,
                detalle_notificacion
            FROM NoCoincidentes;
        `, [macroetapa, macroetapa]);
    
        const expedientesMap = results.reduce((map, row) => {
            if (!map[row.num_credito]) {
                map[row.num_credito] = {
                    num_credito: row.num_credito,
                    ultima_etapa_aprobada: row.ultima_etapa_aprobada,
                    fecha_ultima_etapa_aprobada: row.fecha_ultima_etapa_aprobada,
                    macroetapa_aprobada: row.macroetapa_aprobada,
                    expTribunalA_numero: row.expTribunalA_numero,
                    fecha: row.fecha,
                    etapa: row.etapa,
                    termino: row.termino,
                    notificacion: row.notificacion,
                    nombre: row.nombre,
                    url: row.url,
                    detalles: []
                };
            }
            if (row.detalle_id) {
                map[row.num_credito].detalles.push({
                    id: row.detalle_id,
                    ver_acuerdo: row.ver_acuerdo,
                    fecha: row.detalle_fecha,
                    etapa: row.detalle_etapa,
                    termino: row.detalle_termino,
                    notificacion: row.detalle_notificacion
                });
            }
            return map;
        }, {});
    
        return Object.values(expedientesMap);
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
                    etd.format_fecha AS fecha_formateada,
                    ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY etd.format_fecha DESC) AS row_num
                FROM expTribunalDetA etd
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
                    ete.notificacion,
                    eta.nombre, 
                    eta.url,
                    d.id AS detalle_id,
                    d.ver_acuerdo,
                    d.fecha AS detalle_fecha,
                    d.etapa AS detalle_etapa,
                    d.termino AS detalle_termino,
                    d.notificacion AS detalle_notificacion
                FROM CreditosEtapas ce
                JOIN ExpTribunalEtapas ete ON ce.num_credito = ete.expTribunalA_numero
                JOIN expTribunalA eta ON ete.expTribunalA_numero = eta.numero
                LEFT JOIN expTribunalDetA d ON ete.expTribunalA_numero = d.expTribunalA_numero
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
                    NULL AS nombre,
                    NULL AS url,
                    NULL AS detalle_id,
                    NULL AS ver_acuerdo,
                    NULL AS detalle_fecha,
                    NULL AS detalle_etapa,
                    NULL AS detalle_termino,
                    NULL AS detalle_notificacion
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
                notificacion,
                nombre, 
                url,
                detalle_id,
                ver_acuerdo,
                detalle_fecha,
                detalle_etapa,
                detalle_termino,
                detalle_notificacion
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
                nombre,
                url,
                detalle_id,
                ver_acuerdo,
                detalle_fecha,
                detalle_etapa,
                detalle_termino,
                detalle_notificacion
            FROM NoCoincidentes;
        `, [etapa, termino, notificacion, etapa, termino, notificacion]);
    
        const expedientesMap = results.reduce((map, row) => {
            if (!map[row.num_credito]) {
                map[row.num_credito] = {
                    num_credito: row.num_credito,
                    ultima_etapa_aprobada: row.ultima_etapa_aprobada,
                    fecha_ultima_etapa_aprobada: row.fecha_ultima_etapa_aprobada,
                    macroetapa_aprobada: row.macroetapa_aprobada,
                    expTribunalA_numero: row.expTribunalA_numero,
                    fecha: row.fecha,
                    etapa: row.etapa,
                    termino: row.termino,
                    notificacion: row.notificacion,
                    nombre: row.nombre,
                    url: row.url,
                    detalles: []
                };
            }
            if (row.detalle_id) {
                map[row.num_credito].detalles.push({
                    id: row.detalle_id,
                    ver_acuerdo: row.ver_acuerdo,
                    fecha: row.detalle_fecha,
                    etapa: row.detalle_etapa,
                    termino: row.detalle_termino,
                    notificacion: row.detalle_notificacion
                });
            }
            return map;
        }, {});
    
        return Object.values(expedientesMap);
    }
    static async getPositionByFecha(fecha) {
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
                    etd.format_fecha AS fecha_formateada,  
                    ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY etd.format_fecha DESC) AS row_num  
                FROM expTribunalDetA etd
                WHERE etd.format_fecha = ?  
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
                    ete.notificacion,
                    eta.nombre, 
                    eta.url,
                    d.id AS detalle_id,
                    d.ver_acuerdo,
                    d.fecha AS detalle_fecha,
                    d.etapa AS detalle_etapa,
                    d.termino AS detalle_termino,
                    d.notificacion AS detalle_notificacion
                FROM CreditosEtapas ce
                JOIN ExpTribunalEtapas ete ON ce.num_credito = ete.expTribunalA_numero
                JOIN expTribunalA eta ON ete.expTribunalA_numero = eta.numero
                LEFT JOIN expTribunalDetA d ON ete.expTribunalA_numero = d.expTribunalA_numero  
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
                    NULL AS nombre, 
                    NULL AS url,
                    NULL AS detalle_id,
                    NULL AS ver_acuerdo,
                    NULL AS detalle_fecha,
                    NULL AS detalle_etapa,
                    NULL AS detalle_termino,
                    NULL AS detalle_notificacion
                FROM CreditosSIAL c
                LEFT JOIN expTribunalDetA etd ON c.num_credito = etd.expTribunalA_numero
                WHERE etd.expTribunalA_numero IS NULL
                AND etd.format_fecha = ?  
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
                notificacion,
                nombre, 
                url,
                detalle_id,
                ver_acuerdo,
                detalle_fecha,
                detalle_etapa,
                detalle_termino,
                detalle_notificacion
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
                nombre,
                url,
                detalle_id,
                ver_acuerdo,
                detalle_fecha,
                detalle_etapa,
                detalle_termino,
                detalle_notificacion
            FROM NoCoincidentes;
        `, [fecha, fecha]);
    
        const expedientesMap = results.reduce((map, row) => {
            if (!map[row.num_credito]) {
                map[row.num_credito] = {
                    num_credito: row.num_credito,
                    ultima_etapa_aprobada: row.ultima_etapa_aprobada,
                    fecha_ultima_etapa_aprobada: row.fecha_ultima_etapa_aprobada,
                    macroetapa_aprobada: row.macroetapa_aprobada,
                    expTribunalA_numero: row.expTribunalA_numero,
                    fecha: row.fecha,
                    etapa: row.etapa,
                    termino: row.termino,
                    notificacion: row.notificacion,
                    nombre: row.nombre,
                    url: row.url,
                    detalles: []
                };
            }
            if (row.detalle_id) {
                map[row.num_credito].detalles.push({
                    id: row.detalle_id,
                    ver_acuerdo: row.ver_acuerdo,
                    fecha: row.detalle_fecha,
                    etapa: row.detalle_etapa,
                    termino: row.detalle_termino,
                    notificacion: row.detalle_notificacion
                });
            }
            return map;
        }, {});
    
        return Object.values(expedientesMap);
    }
    
    

}

export default PositionDao;
