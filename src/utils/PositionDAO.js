import { pool } from "../db.js";

class PositionDao {
   
    static async getAll() {
        const [results] = await pool.query(`
            WITH CreditosEtapas AS (
                SELECT 
                    num_credito,
                    ultima_etapa_aprobada,
                    fecha_ultima_etapa_aprobada,
                    macroetapa_aprobada,
                    estatus,  
                    bloquear_gestion_por_estrategia_dual  
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
                    ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY etd.format_fecha DESC, etd.id ASC) AS row_num  
                FROM expTribunalDetA etd
            ),
            Coincidentes AS (
                SELECT 
                    ce.num_credito,
                    ce.ultima_etapa_aprobada,
                    ce.fecha_ultima_etapa_aprobada,
                    ce.macroetapa_aprobada,
                    ce.estatus,
                    ce.bloquear_gestion_por_estrategia_dual, 
                    ete.expTribunalA_numero,
                    ete.fecha_original AS fecha,  
                    ete.etapa,
                    ete.termino,
                    ete.notificacion,
                    eta.nombre, 
                    eta.url,
                    eta.expediente,  
                    d.id AS detalle_id,
                    d.ver_acuerdo,
                    d.fecha AS detalle_fecha,
                    d.etapa AS detalle_etapa,
                    d.termino AS detalle_termino,
                    d.notificacion AS detalle_notificacion,
                    j.juspos AS juzgado  
                FROM CreditosEtapas ce
                JOIN ExpTribunalEtapas ete ON ce.num_credito = ete.expTribunalA_numero
                JOIN expTribunalA eta ON ete.expTribunalA_numero = eta.numero
                LEFT JOIN expTribunalDetA d ON ete.expTribunalA_numero = d.expTribunalA_numero  
                LEFT JOIN juzgados j ON eta.juzgado = j.juzgado  
                WHERE ete.row_num = 1
            ),
            NoCoincidentes AS (
                SELECT 
                    c.num_credito,
                    c.ultima_etapa_aprobada,
                    c.fecha_ultima_etapa_aprobada,
                    c.macroetapa_aprobada,
                    c.estatus,  
                    c.bloquear_gestion_por_estrategia_dual,  
                    NULL AS expTribunalA_numero,
                    NULL AS fecha,
                    NULL AS etapa,
                    NULL AS termino,
                    NULL AS notificacion,
                    NULL AS nombre, 
                    NULL AS url,
                    NULL AS expediente,  
                    NULL AS detalle_id,
                    NULL AS ver_acuerdo,
                    NULL AS detalle_fecha,
                    NULL AS detalle_etapa,
                    NULL AS detalle_termino,
                    NULL AS detalle_notificacion,
                    NULL AS juzgado  
                FROM CreditosSIAL c
                LEFT JOIN expTribunalDetA etd ON c.num_credito = etd.expTribunalA_numero
                WHERE etd.expTribunalA_numero IS NULL
            )
    
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                macroetapa_aprobada,
                estatus,  
                bloquear_gestion_por_estrategia_dual,  
                expTribunalA_numero,
                fecha,  
                etapa,
                termino,
                notificacion,
                nombre, 
                url,
                expediente, 
                detalle_id,
                ver_acuerdo,
                detalle_fecha,
                detalle_etapa,
                detalle_termino,
                detalle_notificacion,
                juzgado  
            FROM Coincidentes
    
            UNION ALL
    
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                macroetapa_aprobada,
                estatus,  
                bloquear_gestion_por_estrategia_dual,  
                expTribunalA_numero,
                fecha,
                etapa,
                termino,
                notificacion,
                nombre,
                url,
                expediente, 
                detalle_id,
                ver_acuerdo,
                detalle_fecha,
                detalle_etapa,
                detalle_termino,
                detalle_notificacion,
                juzgado  
            FROM NoCoincidentes;
        `);
    
        const expedientesMap = results.reduce((map, row) => {
            if (!map[row.num_credito]) {
                map[row.num_credito] = {
                    num_credito: row.num_credito,
                    ultima_etapa_aprobada: row.ultima_etapa_aprobada,
                    fecha_ultima_etapa_aprobada: row.fecha_ultima_etapa_aprobada,
                    macroetapa_aprobada: row.macroetapa_aprobada,
                    estatus: row.estatus, 
                    bloquear_gestion_por_estrategia_dual: row.bloquear_gestion_por_estrategia_dual,  
                    expTribunalA_numero: row.expTribunalA_numero,
                    expediente: row.expediente,  
                    fecha: row.fecha,
                    etapa: row.etapa,
                    termino: row.termino,
                    notificacion: row.notificacion,
                    nombre: row.nombre,
                    url: row.url,
                    juzgado: row.juzgado, 
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
            WITH CreditosEtapas AS (
                SELECT 
                    num_credito,
                    ultima_etapa_aprobada,
                    fecha_ultima_etapa_aprobada,
                    macroetapa_aprobada,
                    estatus,
                    bloquear_gestion_por_estrategia_dual
                FROM CreditosSIAL
                WHERE num_credito = ?  
            ),
            ExpTribunalEtapas AS (
                SELECT 
                    etd.expTribunalA_numero,
                    etd.fecha AS fecha_original,
                    etd.etapa,
                    etd.termino,
                    etd.notificacion,
                    etd.format_fecha AS fecha_formateada,
                    ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY etd.format_fecha DESC, etd.id ASC) AS row_num  
                FROM expTribunalDetA etd
                WHERE etd.expTribunalA_numero = ?  
            ),
            Coincidentes AS (
                SELECT 
                    ce.num_credito,
                    ce.ultima_etapa_aprobada,
                    ce.fecha_ultima_etapa_aprobada,
                    ce.macroetapa_aprobada,
                    ce.estatus,
                    ce.bloquear_gestion_por_estrategia_dual,
                    ete.expTribunalA_numero,
                    ete.fecha_original AS fecha,
                    ete.etapa,
                    ete.termino,
                    ete.notificacion,
                    eta.nombre,
                    eta.url,
                    eta.expediente,
                    j.juspos AS juzgado 
                FROM CreditosEtapas ce
                JOIN ExpTribunalEtapas ete ON ce.num_credito = ete.expTribunalA_numero
                JOIN expTribunalA eta ON ete.expTribunalA_numero = eta.numero
                LEFT JOIN juzgados j ON eta.juzgado = j.juzgado  -- Unir con la tabla 'juzgados'
                WHERE ete.row_num = 1
            ),
            NoCoincidentes AS (
                SELECT 
                    c.num_credito,
                    c.ultima_etapa_aprobada,
                    c.fecha_ultima_etapa_aprobada,
                    c.macroetapa_aprobada,
                    c.estatus,
                    c.bloquear_gestion_por_estrategia_dual,
                    NULL AS expTribunalA_numero,
                    NULL AS fecha,
                    NULL AS etapa,
                    NULL AS termino,
                    NULL AS notificacion,
                    NULL AS nombre,
                    NULL AS url,
                    NULL AS expediente,
                    NULL AS juzgado  -- Mantener nulo si no hay coincidencia
                FROM CreditosSIAL c
                LEFT JOIN expTribunalDetA etd ON c.num_credito = etd.expTribunalA_numero
                WHERE etd.expTribunalA_numero IS NULL
                AND c.num_credito = ?
            )
            
            -- Seleccionar las columnas finales incluyendo el juzgado
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                macroetapa_aprobada,
                estatus,
                bloquear_gestion_por_estrategia_dual,
                expTribunalA_numero,
                fecha,
                etapa,
                termino,
                notificacion,
                nombre,
                url,
                expediente,
                juzgado  -- Incluir la abreviatura del juzgado en el resultado
            FROM Coincidentes
            
            UNION ALL
            
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                macroetapa_aprobada,
                estatus,
                bloquear_gestion_por_estrategia_dual,
                expTribunalA_numero,
                fecha,
                etapa,
                termino,
                notificacion,
                nombre,
                url,
                expediente,
                juzgado  -- Incluir la abreviatura del juzgado en el resultado
            FROM NoCoincidentes;
        `, [number, number, number]);
    
        return results;
    }
    static async getAllbyExpediente(expediente) {
        const [results] = await pool.query(`
            WITH CreditosEtapas AS (
                SELECT 
                    num_credito,
                    ultima_etapa_aprobada,
                    fecha_ultima_etapa_aprobada,
                    macroetapa_aprobada,
                    estatus,
                    bloquear_gestion_por_estrategia_dual
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
                    ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY etd.format_fecha DESC, etd.id ASC) AS row_num  -- Nuevo criterio de ordenación
                FROM expTribunalDetA etd
                JOIN expTribunalA eta ON etd.expTribunalA_numero = eta.numero  -- Asegurar el JOIN correcto con expTribunalA
                WHERE etd.expediente = ?  -- Filtrar por expediente en expTribunalDetA
            ),
            Coincidentes AS (
                SELECT 
                    ce.num_credito,
                    ce.ultima_etapa_aprobada,
                    ce.fecha_ultima_etapa_aprobada,
                    ce.macroetapa_aprobada,
                    ce.estatus,
                    ce.bloquear_gestion_por_estrategia_dual,
                    ete.expTribunalA_numero,
                    ete.fecha_original AS fecha,
                    ete.etapa,
                    ete.termino,
                    ete.notificacion,
                    eta.nombre,
                    eta.url,
                    eta.expediente,
                    j.juspos AS juzgado 
                FROM CreditosEtapas ce
                JOIN ExpTribunalEtapas ete ON ce.num_credito = ete.expTribunalA_numero
                JOIN expTribunalA eta ON ete.expTribunalA_numero = eta.numero
                LEFT JOIN juzgados j ON eta.juzgado = j.juzgado  -- Unir con la tabla 'juzgados'
                WHERE ete.row_num = 1
            ),
            NoCoincidentes AS (
                SELECT 
                    c.num_credito,
                    c.ultima_etapa_aprobada,
                    c.fecha_ultima_etapa_aprobada,
                    c.macroetapa_aprobada,
                    c.estatus,
                    c.bloquear_gestion_por_estrategia_dual,
                    NULL AS expTribunalA_numero,
                    NULL AS fecha,
                    NULL AS etapa,
                    NULL AS termino,
                    NULL AS notificacion,
                    NULL AS nombre,
                    NULL AS url,
                    NULL AS expediente,
                    NULL AS juzgado  -- Mantener nulo si no hay coincidencia
                FROM CreditosSIAL c
                LEFT JOIN expTribunalDetA etd ON c.num_credito = etd.expTribunalA_numero
                WHERE etd.expTribunalA_numero IS NULL
                AND c.expediente = ?  -- Filtrar por expediente en CreditosSIAL
            )
    
            -- Seleccionar las columnas finales incluyendo el juzgado
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                macroetapa_aprobada,
                estatus,
                bloquear_gestion_por_estrategia_dual,
                expTribunalA_numero,
                fecha,
                etapa,
                termino,
                notificacion,
                nombre,
                url,
                expediente,
                juzgado  -- Incluir la abreviatura del juzgado en el resultado
            FROM Coincidentes
            
            UNION ALL
            
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                macroetapa_aprobada,
                estatus,
                bloquear_gestion_por_estrategia_dual,
                expTribunalA_numero,
                fecha,
                etapa,
                termino,
                notificacion,
                nombre,
                url,
                expediente,
                juzgado  -- Incluir la abreviatura del juzgado en el resultado
            FROM NoCoincidentes;
        `, [expediente, expediente]);
    
        return results;
    }
    
    static async getAllByMacroetapa(macroetapa) {
        const [results] = await pool.query(`
            WITH CreditosEtapas AS (
                SELECT 
                    num_credito,
                    ultima_etapa_aprobada,
                    fecha_ultima_etapa_aprobada,
                    macroetapa_aprobada,
                    estatus,
                    bloquear_gestion_por_estrategia_dual
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
                    ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY etd.format_fecha DESC, etd.id ASC) AS row_num  -- Nuevo criterio de ordenación
                FROM expTribunalDetA etd
            ),
            Coincidentes AS (
                SELECT 
                    ce.num_credito,
                    ce.ultima_etapa_aprobada,
                    ce.fecha_ultima_etapa_aprobada,
                    ce.macroetapa_aprobada,
                    ce.estatus,
                    ce.bloquear_gestion_por_estrategia_dual,
                    ete.expTribunalA_numero,
                    ete.fecha_original AS fecha,
                    ete.etapa,
                    ete.termino,
                    ete.notificacion,
                    eta.nombre,
                    eta.url,
                    eta.expediente,
                    d.id AS detalle_id,
                    d.ver_acuerdo,
                    d.fecha AS detalle_fecha,
                    d.etapa AS detalle_etapa,
                    d.termino AS detalle_termino,
                    d.notificacion AS detalle_notificacion,
                    j.juspos AS juzgado  -- Unir con la tabla 'juzgados'
                FROM CreditosEtapas ce
                JOIN ExpTribunalEtapas ete ON ce.num_credito = ete.expTribunalA_numero
                JOIN expTribunalA eta ON ete.expTribunalA_numero = eta.numero
                LEFT JOIN expTribunalDetA d ON ete.expTribunalA_numero = d.expTribunalA_numero
                LEFT JOIN juzgados j ON eta.juzgado = j.juzgado  -- Unir con la tabla 'juzgados'
                WHERE ete.row_num = 1
            ),
            NoCoincidentes AS (
                SELECT 
                    c.num_credito,
                    c.ultima_etapa_aprobada,
                    c.fecha_ultima_etapa_aprobada,
                    c.macroetapa_aprobada,
                    c.estatus,
                    c.bloquear_gestion_por_estrategia_dual,
                    NULL AS expTribunalA_numero,
                    NULL AS fecha,
                    NULL AS etapa,
                    NULL AS termino,
                    NULL AS notificacion,
                    NULL AS nombre,
                    NULL AS url,
                    NULL AS expediente,
                    NULL AS detalle_id,
                    NULL AS ver_acuerdo,
                    NULL AS detalle_fecha,
                    NULL AS detalle_etapa,
                    NULL AS detalle_termino,
                    NULL AS detalle_notificacion,
                    NULL AS juzgado
                FROM CreditosSIAL c
                LEFT JOIN expTribunalDetA etd ON c.num_credito = etd.expTribunalA_numero
                WHERE etd.expTribunalA_numero IS NULL
                AND c.macroetapa_aprobada = ?  -- Filtrar por la macroetapa específica
            )
    
            -- Seleccionar las columnas finales incluyendo el juzgado
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                macroetapa_aprobada,
                estatus,
                bloquear_gestion_por_estrategia_dual,
                expTribunalA_numero,
                fecha,
                etapa,
                termino,
                notificacion,
                nombre,
                url,
                expediente,
                detalle_id,
                ver_acuerdo,
                detalle_fecha,
                detalle_etapa,
                detalle_termino,
                detalle_notificacion,
                juzgado  -- Incluir la abreviatura del juzgado en el resultado
            FROM Coincidentes
    
            UNION ALL
    
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                macroetapa_aprobada,
                estatus,
                bloquear_gestion_por_estrategia_dual,
                expTribunalA_numero,
                fecha,
                etapa,
                termino,
                notificacion,
                nombre,
                url,
                expediente,
                detalle_id,
                ver_acuerdo,
                detalle_fecha,
                detalle_etapa,
                detalle_termino,
                detalle_notificacion,
                juzgado  -- Incluir la abreviatura del juzgado en el resultado
            FROM NoCoincidentes;
        `, [macroetapa, macroetapa]);
    
        const expedientesMap = results.reduce((map, row) => {
            if (!map[row.num_credito]) {
                map[row.num_credito] = {
                    num_credito: row.num_credito,
                    ultima_etapa_aprobada: row.ultima_etapa_aprobada,
                    fecha_ultima_etapa_aprobada: row.fecha_ultima_etapa_aprobada,
                    macroetapa_aprobada: row.macroetapa_aprobada,
                    estatus: row.estatus,
                    bloquear_gestion_por_estrategia_dual: row.bloquear_gestion_por_estrategia_dual,
                    expTribunalA_numero: row.expTribunalA_numero,
                    expediente: row.expediente,
                    fecha: row.fecha,
                    etapa: row.etapa,
                    termino: row.termino,
                    notificacion: row.notificacion,
                    nombre: row.nombre,
                    url: row.url,
                    juzgado: row.juzgado,
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
                    macroetapa_aprobada,
                    estatus,
                    bloquear_gestion_por_estrategia_dual
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
                    ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY etd.format_fecha DESC, etd.id ASC) AS row_num
                FROM expTribunalDetA etd
            ),
            Coincidentes AS (
                SELECT 
                    ce.num_credito,
                    ce.ultima_etapa_aprobada,
                    ce.fecha_ultima_etapa_aprobada,
                    ce.macroetapa_aprobada,
                    ce.estatus,
                    ce.bloquear_gestion_por_estrategia_dual,
                    ete.expTribunalA_numero,
                    ete.fecha_original AS fecha,
                    ete.etapa,
                    ete.termino,
                    ete.notificacion,
                    eta.nombre,
                    eta.url,
                    eta.expediente,
                    d.id AS detalle_id,
                    d.ver_acuerdo,
                    d.fecha AS detalle_fecha,
                    d.etapa AS detalle_etapa,
                    d.termino AS detalle_termino,
                    d.notificacion AS detalle_notificacion,
                    j.juspos AS juzgado
                FROM CreditosEtapas ce
                JOIN ExpTribunalEtapas ete ON ce.num_credito = ete.expTribunalA_numero
                JOIN expTribunalA eta ON ete.expTribunalA_numero = eta.numero
                LEFT JOIN expTribunalDetA d ON ete.expTribunalA_numero = d.expTribunalA_numero
                LEFT JOIN juzgados j ON eta.juzgado = j.juzgado
                WHERE ete.row_num = 1  -- Seleccionamos solo el último registro
                AND ete.etapa = ? 
                AND ete.termino = ? 
                AND ete.notificacion = ?  -- Aplicar los filtros sobre el último registro
            ),
            NoCoincidentes AS (
                SELECT 
                    c.num_credito,
                    c.ultima_etapa_aprobada,
                    c.fecha_ultima_etapa_aprobada,
                    c.macroetapa_aprobada,
                    c.estatus,
                    c.bloquear_gestion_por_estrategia_dual,
                    NULL AS expTribunalA_numero,
                    NULL AS fecha,
                    NULL AS etapa,
                    NULL AS termino,
                    NULL AS notificacion,
                    NULL AS nombre,
                    NULL AS url,
                    NULL AS expediente,
                    NULL AS detalle_id,
                    NULL AS ver_acuerdo,
                    NULL AS detalle_fecha,
                    NULL AS detalle_etapa,
                    NULL AS detalle_termino,
                    NULL AS detalle_notificacion,
                    NULL AS juzgado
                FROM CreditosSIAL c
                LEFT JOIN expTribunalDetA etd ON c.num_credito = etd.expTribunalA_numero
                WHERE etd.expTribunalA_numero IS NULL
                AND etd.etapa = ? 
                AND etd.termino = ? 
                AND etd.notificacion = ?
            )
    
            -- Seleccionar las columnas finales incluyendo el juzgado
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                macroetapa_aprobada,
                estatus,
                bloquear_gestion_por_estrategia_dual,
                expTribunalA_numero,
                fecha,
                etapa,
                termino,
                notificacion,
                nombre,
                url,
                expediente,
                detalle_id,
                ver_acuerdo,
                detalle_fecha,
                detalle_etapa,
                detalle_termino,
                detalle_notificacion,
                juzgado
            FROM Coincidentes
    
            UNION ALL
    
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                macroetapa_aprobada,
                estatus,
                bloquear_gestion_por_estrategia_dual,
                expTribunalA_numero,
                fecha,
                etapa,
                termino,
                notificacion,
                nombre,
                url,
                expediente,
                detalle_id,
                ver_acuerdo,
                detalle_fecha,
                detalle_etapa,
                detalle_termino,
                detalle_notificacion,
                juzgado
            FROM NoCoincidentes;
        `, [etapa, termino, notificacion, etapa, termino, notificacion]);
        
        const expedientesMap = results.reduce((map, row) => {
            if (!map[row.num_credito]) {
                map[row.num_credito] = {
                    num_credito: row.num_credito,
                    ultima_etapa_aprobada: row.ultima_etapa_aprobada,
                    fecha_ultima_etapa_aprobada: row.fecha_ultima_etapa_aprobada,
                    macroetapa_aprobada: row.macroetapa_aprobada,
                    estatus: row.estatus,
                    bloquear_gestion_por_estrategia_dual: row.bloquear_gestion_por_estrategia_dual,
                    expTribunalA_numero: row.expTribunalA_numero,
                    expediente: row.expediente,
                    fecha: row.fecha,
                    etapa: row.etapa,
                    termino: row.termino,
                    notificacion: row.notificacion,
                    nombre: row.nombre,
                    url: row.url,
                    juzgado: row.juzgado,
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
                    macroetapa_aprobada,
                    estatus,  
                    bloquear_gestion_por_estrategia_dual  
                FROM CreditosSIAL
            ),
            
            ExpTribunalEtapas AS (
                -- Seleccionamos el último registro para cada expediente basado en format_fecha DESC, id ASC
                SELECT 
                    etd.expTribunalA_numero,
                    etd.fecha,  -- Capturar fecha en formato VARCHAR como está
                    etd.etapa,
                    etd.termino,
                    etd.notificacion,
                    etd.format_fecha,  -- Mantener format_fecha para cálculos
                    ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY etd.format_fecha DESC, etd.id ASC) AS row_num  
                FROM expTribunalDetA etd
            ),
            
            Coincidentes AS (
                -- Obtenemos los registros donde el último registro de expTribunalA_numero coincide con la fecha solicitada
                SELECT 
                    ce.num_credito,
                    ce.ultima_etapa_aprobada,
                    ce.fecha_ultima_etapa_aprobada,
                    ce.macroetapa_aprobada,
                    ce.estatus,  
                    ce.bloquear_gestion_por_estrategia_dual,  
                    ete.expTribunalA_numero,
                    ete.fecha,  -- Devuelve el campo fecha tal como está en VARCHAR
                    ete.format_fecha,  -- Devuelve format_fecha también para cálculos
                    ete.etapa,
                    ete.termino,
                    ete.notificacion,
                    eta.nombre, 
                    eta.url,
                    eta.expediente,  
                    j.juspos AS juzgado,
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
                LEFT JOIN juzgados j ON eta.juzgado = j.juzgado  
                WHERE ete.row_num = 1 -- Solo seleccionamos el último registro por expediente
                AND ete.format_fecha = ? -- Aplicar filtro de fecha correctamente
            ),
            
            NoCoincidentes AS (
                -- Los registros donde no hay coincidencias en expTribunalDetA
                SELECT 
                    c.num_credito,
                    c.ultima_etapa_aprobada,
                    c.fecha_ultima_etapa_aprobada,
                    c.macroetapa_aprobada,
                    c.estatus,  
                    c.bloquear_gestion_por_estrategia_dual,  
                    NULL AS expTribunalA_numero,
                    NULL AS fecha,
                    NULL AS format_fecha,
                    NULL AS etapa,
                    NULL AS termino,
                    NULL AS notificacion,
                    NULL AS nombre, 
                    NULL AS url,
                    NULL AS expediente,  
                    NULL AS juzgado,
                    NULL AS detalle_id,
                    NULL AS ver_acuerdo,
                    NULL AS detalle_fecha,
                    NULL AS detalle_etapa,
                    NULL AS detalle_termino,
                    NULL AS detalle_notificacion
                FROM CreditosSIAL c
                LEFT JOIN expTribunalDetA etd ON c.num_credito = etd.expTribunalA_numero
                WHERE etd.expTribunalA_numero IS NULL
                AND etd.format_fecha = ? -- Aplicar el filtro de fecha cuando no hay coincidencias
            )
            
            -- Selección de los resultados finales
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                macroetapa_aprobada,
                estatus,
                bloquear_gestion_por_estrategia_dual,
                expTribunalA_numero,
                fecha,  -- Devuelve fecha como VARCHAR
                format_fecha,  -- Devuelve format_fecha también
                etapa,
                termino,
                notificacion,
                nombre, 
                url,
                expediente,  
                juzgado,  
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
                estatus,
                bloquear_gestion_por_estrategia_dual,
                expTribunalA_numero,
                fecha,
                format_fecha,
                etapa,
                termino,
                notificacion,
                nombre,
                url,
                expediente,
                juzgado,
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
                    estatus: row.estatus,  
                    bloquear_gestion_por_estrategia_dual: row.bloquear_gestion_por_estrategia_dual, 
                    expTribunalA_numero: row.expTribunalA_numero,
                    expediente: row.expediente,  
                    juzgado: row.juzgado,  
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
    
    
    static async getPositionByJuzgado(juspos) {
        const [results] = await pool.query(`
            WITH CreditosEtapas AS (
                SELECT 
                    num_credito,
                    ultima_etapa_aprobada,
                    fecha_ultima_etapa_aprobada,
                    macroetapa_aprobada,
                    estatus,
                    bloquear_gestion_por_estrategia_dual
                FROM CreditosSIAL
            ),
            
            ExpTribunalEtapas AS (
                -- Ordenar por format_fecha DESC y id ASC para obtener el registro más reciente con el id más bajo en caso de empate
                SELECT 
                    etd.expTribunalA_numero,
                    etd.fecha,  
                    etd.etapa,
                    etd.termino,
                    etd.notificacion,
                    ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY etd.format_fecha DESC, etd.id ASC) AS row_num  
                FROM expTribunalDetA etd
            ),
            
            Coincidentes AS (
                -- Filtramos los registros donde el último registro de expTribunalA_numero coincide con el juzgado solicitado
                SELECT 
                    ce.num_credito,
                    ce.ultima_etapa_aprobada,
                    ce.fecha_ultima_etapa_aprobada,
                    ce.macroetapa_aprobada,
                    ce.estatus,
                    ce.bloquear_gestion_por_estrategia_dual,
                    ete.expTribunalA_numero,
                    ete.fecha,  -- Usar el campo fecha como está en VARCHAR
                    ete.etapa,
                    ete.termino,
                    ete.notificacion,
                    eta.nombre, 
                    eta.url,
                    eta.expediente,
                    j.juspos AS juzgado,
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
                LEFT JOIN juzgados j ON eta.juzgado = j.juzgado
                WHERE ete.row_num = 1  -- Solo seleccionamos el último registro por expediente
                AND j.juspos = ?
            ),
            
            NoCoincidentes AS (
                -- Los registros donde no hay coincidencias en expTribunalDetA
                SELECT 
                    c.num_credito,
                    c.ultima_etapa_aprobada,
                    c.fecha_ultima_etapa_aprobada,
                    c.macroetapa_aprobada,
                    c.estatus,
                    c.bloquear_gestion_por_estrategia_dual,
                    NULL AS expTribunalA_numero,
                    NULL AS fecha,
                    NULL AS etapa,
                    NULL AS termino,
                    NULL AS notificacion,
                    NULL AS nombre,
                    NULL AS url,
                    NULL AS expediente,
                    NULL AS juzgado,
                    NULL AS detalle_id,
                    NULL AS ver_acuerdo,
                    NULL AS detalle_fecha,
                    NULL AS detalle_etapa,
                    NULL AS detalle_termino,
                    NULL AS detalle_notificacion
                FROM CreditosSIAL c
                LEFT JOIN expTribunalDetA etd ON c.num_credito = etd.expTribunalA_numero
                LEFT JOIN expTribunalA eta ON etd.expTribunalA_numero = eta.numero
                LEFT JOIN juzgados j ON eta.juzgado = j.juzgado
                WHERE etd.expTribunalA_numero IS NULL
                AND j.juspos = ?
            )
            
            -- Selección de los resultados finales
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                macroetapa_aprobada,
                estatus,
                bloquear_gestion_por_estrategia_dual,
                expTribunalA_numero,
                fecha,
                etapa,
                termino,
                notificacion,
                nombre, 
                url,
                expediente,
                juzgado,
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
                estatus,
                bloquear_gestion_por_estrategia_dual,
                expTribunalA_numero,
                fecha,
                etapa,
                termino,
                notificacion,
                nombre,
                url,
                expediente,
                juzgado,
                detalle_id,
                ver_acuerdo,
                detalle_fecha,
                detalle_etapa,
                detalle_termino,
                detalle_notificacion
            FROM NoCoincidentes;
        `, [juspos, juspos]);
        
        const expedientesMap = results.reduce((map, row) => {
            if (!map[row.num_credito]) {
                map[row.num_credito] = {
                    num_credito: row.num_credito,
                    ultima_etapa_aprobada: row.ultima_etapa_aprobada,
                    fecha_ultima_etapa_aprobada: row.fecha_ultima_etapa_aprobada,
                    macroetapa_aprobada: row.macroetapa_aprobada,
                    estatus: row.estatus,  
                    bloquear_gestion_por_estrategia_dual: row.bloquear_gestion_por_estrategia_dual,
                    expTribunalA_numero: row.expTribunalA_numero,
                    expediente: row.expediente,  
                    juzgado: row.juzgado,  
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
    
    
    
    static async getFilteredRecords(desde, hasta, juzgado, etapa, termino, notificacion) {
        let query = `
            WITH CreditosEtapas AS (
                SELECT 
                    num_credito,
                    ultima_etapa_aprobada,
                    fecha_ultima_etapa_aprobada,
                    macroetapa_aprobada,
                    estatus,
                    bloquear_gestion_por_estrategia_dual
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
                WHERE etd.format_fecha BETWEEN ? AND ?
            ),
            
            Coincidentes AS (
                SELECT 
                    ce.num_credito,
                    ce.ultima_etapa_aprobada,
                    ce.fecha_ultima_etapa_aprobada,
                    ce.macroetapa_aprobada,
                    ce.estatus,
                    ce.bloquear_gestion_por_estrategia_dual,
                    ete.expTribunalA_numero,
                    ete.fecha_original AS fecha,
                    ete.etapa,
                    ete.termino,
                    ete.notificacion,
                    eta.nombre, 
                    eta.url,
                    eta.expediente,
                    j.juspos AS juzgado,
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
                LEFT JOIN juzgados j ON eta.juzgado = j.juzgado
                WHERE ete.row_num = 1
        `;
        
        let params = [desde, hasta];
    
        if (juzgado) {
            query += ` AND j.juspos = ? `;
            params.push(juzgado);
        }
        if (etapa) {
            query += ` AND ete.etapa = ? `;
            params.push(etapa);
        }
        if (termino) {
            query += ` AND ete.termino = ? `;
            params.push(termino);
        }
        if (notificacion) {
            query += ` AND ete.notificacion = ? `;
            params.push(notificacion);
        }
    
        query += `
            ),
            
            NoCoincidentes AS (
                SELECT 
                    c.num_credito,
                    c.ultima_etapa_aprobada,
                    c.fecha_ultima_etapa_aprobada,
                    c.macroetapa_aprobada,
                    c.estatus,
                    c.bloquear_gestion_por_estrategia_dual,
                    NULL AS expTribunalA_numero,
                    NULL AS fecha,
                    NULL AS etapa,
                    NULL AS termino,
                    NULL AS notificacion,
                    NULL AS nombre,
                    NULL AS url,
                    NULL AS expediente,
                    NULL AS juzgado,
                    NULL AS detalle_id,
                    NULL AS ver_acuerdo,
                    NULL AS detalle_fecha,
                    NULL AS detalle_etapa,
                    NULL AS detalle_termino,
                    NULL AS detalle_notificacion
                FROM CreditosSIAL c
                LEFT JOIN expTribunalDetA etd ON c.num_credito = etd.expTribunalA_numero
                LEFT JOIN expTribunalA eta ON etd.expTribunalA_numero = eta.numero
                LEFT JOIN juzgados j ON eta.juzgado = j.juzgado
                WHERE etd.expTribunalA_numero IS NULL
                AND etd.format_fecha BETWEEN ? AND ?
        `;
    
     
        params.push(desde, hasta); 
    
        if (juzgado) {
            query += ` AND j.juspos = ? `;
            params.push(juzgado);
        }
        if (etapa) {
            query += ` AND etd.etapa = ? `;
            params.push(etapa);
        }
        if (termino) {
            query += ` AND etd.termino = ? `;
            params.push(termino);
        }
        if (notificacion) {
            query += ` AND etd.notificacion = ? `;
            params.push(notificacion);
        }
    
        query += `
            )
            
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                macroetapa_aprobada,
                estatus,
                bloquear_gestion_por_estrategia_dual,
                expTribunalA_numero,
                fecha,
                etapa,
                termino,
                notificacion,
                nombre, 
                url,
                expediente,
                juzgado,
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
                estatus,
                bloquear_gestion_por_estrategia_dual,
                expTribunalA_numero,
                fecha,
                etapa,
                termino,
                notificacion,
                nombre,
                url,
                expediente,
                juzgado,
                detalle_id,
                ver_acuerdo,
                detalle_fecha,
                detalle_etapa,
                detalle_termino,
                detalle_notificacion
            FROM NoCoincidentes;
        `;

        const [results] = await pool.query(query, params);
    
        const expedientesMap = results.reduce((map, row) => {
            if (!map[row.num_credito]) {
                map[row.num_credito] = {
                    num_credito: row.num_credito,
                    ultima_etapa_aprobada: row.ultima_etapa_aprobada,
                    fecha_ultima_etapa_aprobada: row.fecha_ultima_etapa_aprobada,
                    macroetapa_aprobada: row.macroetapa_aprobada,
                    estatus: row.estatus,  
                    bloquear_gestion_por_estrategia_dual: row.bloquear_gestion_por_estrategia_dual,
                    expTribunalA_numero: row.expTribunalA_numero,
                    expediente: row.expediente,  
                    juzgado: row.juzgado,  
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
