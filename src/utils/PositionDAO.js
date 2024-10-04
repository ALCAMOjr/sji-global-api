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
                    ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY etd.format_fecha DESC) AS row_num  
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
                    ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY etd.format_fecha DESC) AS row_num
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
                    ROW_NUMBER() OVER (PARTITION BY etd.expTribunalA_numero ORDER BY etd.format_fecha DESC) AS row_num
                FROM expTribunalDetA etd
                JOIN expTribunalA eta ON etd.expTribunalA_numero = eta.numero  -- Asegurar el JOIN correcto con expTribunalA
                WHERE etd.expediente = ?  -- Filtrar por expediente
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
            FROM NoCoincidentes
            WHERE expediente IS not NULL;
          `, [expediente]);    

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
                    estatus,  -- Añadir estatus
                    bloquear_gestion_por_estrategia_dual  -- Añadir bloquear_gestion_por_estrategia_dual
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
                    ce.estatus,  -- Añadir estatus
                    ce.bloquear_gestion_por_estrategia_dual,  -- Añadir bloquear_gestion_por_estrategia_dual
                    ete.expTribunalA_numero,
                    ete.fecha_original AS fecha,  
                    ete.etapa,
                    ete.termino,
                    ete.notificacion,
                    eta.nombre, 
                    eta.url,
                    eta.expediente,  -- Añadir expediente
                    d.id AS detalle_id,
                    d.ver_acuerdo,
                    d.fecha AS detalle_fecha,
                    d.etapa AS detalle_etapa,
                    d.termino AS detalle_termino,
                    d.notificacion AS detalle_notificacion,
                    j.juspos AS juzgado  -- Agregar el campo juzgado desde la tabla 'juzgados'
                FROM CreditosEtapas ce
                JOIN ExpTribunalEtapas ete ON ce.num_credito = ete.expTribunalA_numero
                JOIN expTribunalA eta ON ete.expTribunalA_numero = eta.numero
                LEFT JOIN expTribunalDetA d ON ete.expTribunalA_numero = d.expTribunalA_numero  
                LEFT JOIN juzgados j ON eta.juzgado = j.juzgado  -- Unir con la tabla 'juzgados' para obtener la abreviatura
                WHERE ete.row_num = 1
            ),
            NoCoincidentes AS (
                SELECT 
                    c.num_credito,
                    c.ultima_etapa_aprobada,
                    c.fecha_ultima_etapa_aprobada,
                    c.macroetapa_aprobada,
                    c.estatus,  -- Añadir estatus
                    c.bloquear_gestion_por_estrategia_dual,  -- Añadir bloquear_gestion_por_estrategia_dual
                    NULL AS expTribunalA_numero,
                    NULL AS fecha,
                    NULL AS etapa,
                    NULL AS termino,
                    NULL AS notificacion,
                    NULL AS nombre, 
                    NULL AS url,
                    NULL AS expediente,  -- Añadir expediente
                    NULL AS detalle_id,
                    NULL AS ver_acuerdo,
                    NULL AS detalle_fecha,
                    NULL AS detalle_etapa,
                    NULL AS detalle_termino,
                    NULL AS detalle_notificacion,
                    NULL AS juzgado  -- Mantener nulo si no hay coincidencia
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
                estatus,  -- Añadir estatus
                bloquear_gestion_por_estrategia_dual,  -- Añadir bloquear_gestion_por_estrategia_dual
                expTribunalA_numero,
                fecha,  
                etapa,
                termino,
                notificacion,
                nombre, 
                url,
                expediente,  -- Añadir expediente
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
                estatus,  -- Añadir estatus
                bloquear_gestion_por_estrategia_dual,  -- Añadir bloquear_gestion_por_estrategia_dual
                expTribunalA_numero,
                fecha,
                etapa,
                termino,
                notificacion,
                nombre,
                url,
                expediente,  -- Añadir expediente
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
                    estatus,  -- Añadir el campo estatus
                    bloquear_gestion_por_estrategia_dual  -- Añadir el campo bloquear_gestion_por_estrategia_dual
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
                    ce.estatus,  -- Añadir estatus
                    ce.bloquear_gestion_por_estrategia_dual,  -- Añadir bloquear_gestion_por_estrategia_dual
                    ete.expTribunalA_numero,
                    ete.fecha_original AS fecha,  
                    ete.etapa,
                    ete.termino,
                    ete.notificacion,
                    eta.nombre, 
                    eta.url,
                    eta.expediente,  -- Añadir expediente
                    d.id AS detalle_id,
                    d.ver_acuerdo,
                    d.fecha AS detalle_fecha,
                    d.etapa AS detalle_etapa,
                    d.termino AS detalle_termino,
                    d.notificacion AS detalle_notificacion,
                    j.juspos AS juzgado  -- Añadir el campo juzgado desde la tabla 'juzgados'
                FROM CreditosEtapas ce
                JOIN ExpTribunalEtapas ete ON ce.num_credito = ete.expTribunalA_numero
                JOIN expTribunalA eta ON ete.expTribunalA_numero = eta.numero
                LEFT JOIN expTribunalDetA d ON ete.expTribunalA_numero = d.expTribunalA_numero
                LEFT JOIN juzgados j ON eta.juzgado = j.juzgado  -- Unir con la tabla 'juzgados' para obtener la abreviatura
                WHERE ete.row_num = 1
            ),
            NoCoincidentes AS (
                SELECT 
                    c.num_credito,
                    c.ultima_etapa_aprobada,
                    c.fecha_ultima_etapa_aprobada,
                    c.macroetapa_aprobada,
                    c.estatus,  -- Añadir estatus
                    c.bloquear_gestion_por_estrategia_dual,  -- Añadir bloquear_gestion_por_estrategia_dual
                    NULL AS expTribunalA_numero,
                    NULL AS fecha,
                    NULL AS etapa,
                    NULL AS termino,
                    NULL AS notificacion,
                    NULL AS nombre,
                    NULL AS url,
                    NULL AS expediente,  -- Añadir expediente
                    NULL AS detalle_id,
                    NULL AS ver_acuerdo,
                    NULL AS detalle_fecha,
                    NULL AS detalle_etapa,
                    NULL AS detalle_termino,
                    NULL AS detalle_notificacion,
                    NULL AS juzgado  -- Mantener nulo si no hay coincidencia
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
                estatus,  -- Añadir estatus
                bloquear_gestion_por_estrategia_dual,  -- Añadir bloquear_gestion_por_estrategia_dual
                expTribunalA_numero,
                fecha,  
                etapa,
                termino,
                notificacion,
                nombre, 
                url,
                expediente,  -- Añadir expediente
                detalle_id,
                ver_acuerdo,
                detalle_fecha,
                detalle_etapa,
                detalle_termino,
                detalle_notificacion,
                juzgado  -- Incluir el campo juzgado en el resultado
            FROM Coincidentes
            
            UNION ALL
            
            SELECT 
                num_credito,
                ultima_etapa_aprobada,
                fecha_ultima_etapa_aprobada,
                macroetapa_aprobada,
                estatus,  -- Añadir estatus
                bloquear_gestion_por_estrategia_dual,  -- Añadir bloquear_gestion_por_estrategia_dual
                expTribunalA_numero,
                fecha,
                etapa,
                termino,
                notificacion,
                nombre,
                url,
                expediente,  -- Añadir expediente
                detalle_id,
                ver_acuerdo,
                detalle_fecha,
                detalle_etapa,
                detalle_termino,
                detalle_notificacion,
                juzgado  -- Incluir el campo juzgado en el resultado
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
                    estatus,  -- Añadir el campo estatus
                    bloquear_gestion_por_estrategia_dual  -- Añadir el campo bloquear_gestion_por_estrategia_dual
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
                    ce.estatus,  -- Añadir estatus
                    ce.bloquear_gestion_por_estrategia_dual,  -- Añadir bloquear_gestion_por_estrategia_dual
                    ete.expTribunalA_numero,
                    ete.fecha_original AS fecha,  
                    ete.etapa,
                    ete.termino,
                    ete.notificacion,
                    eta.nombre, 
                    eta.url,
                    eta.expediente,  -- Añadir expediente
                    j.juspos AS juzgado,  -- Añadir el campo juzgado
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
                LEFT JOIN juzgados j ON eta.juzgado = j.juzgado  -- Unir con la tabla 'juzgados' para obtener la abreviatura
                WHERE ete.row_num = 1
            ),
            
            NoCoincidentes AS (
                SELECT 
                    c.num_credito,
                    c.ultima_etapa_aprobada,
                    c.fecha_ultima_etapa_aprobada,
                    c.macroetapa_aprobada,
                    c.estatus,  -- Añadir estatus
                    c.bloquear_gestion_por_estrategia_dual,  -- Añadir bloquear_gestion_por_estrategia_dual
                    NULL AS expTribunalA_numero,
                    NULL AS fecha,
                    NULL AS etapa,
                    NULL AS termino,
                    NULL AS notificacion,
                    NULL AS nombre, 
                    NULL AS url,
                    NULL AS expediente,  -- Añadir expediente
                    NULL AS juzgado,  -- Mantener nulo si no hay coincidencia
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
                estatus,  -- Añadir estatus
                bloquear_gestion_por_estrategia_dual,  -- Añadir bloquear_gestion_por_estrategia_dual
                expTribunalA_numero,
                fecha,  
                etapa,
                termino,
                notificacion,
                nombre, 
                url,
                expediente,  -- Añadir expediente
                juzgado,  -- Añadir juzgado
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
                estatus,  -- Añadir estatus
                bloquear_gestion_por_estrategia_dual,  -- Añadir bloquear_gestion_por_estrategia_dual
                expTribunalA_numero,
                fecha,
                etapa,
                termino,
                notificacion,
                nombre,
                url,
                expediente,  -- Añadir expediente
                juzgado,  -- Añadir juzgado
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
                AND j.juspos = ?
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
                AND j.juspos = ?
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
