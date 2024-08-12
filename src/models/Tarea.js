class Tarea {
    constructor({
        id = null,
        abogado_id = null,
        exptribunalA_numero = null,
        tarea = null,
        fecha_inicio = null,
        fecha_registro = null,
        fecha_entrega = null,
        fecha_real_entrega = null,
        fecha_estimada_respuesta = null,
        fecha_cancelacion = null,
        estado_tarea = null,
        observaciones = null
    }) {
        this.id = id;
        this.abogado_id = abogado_id;
        this.exptribunalA_numero = exptribunalA_numero;
        this.tarea = tarea;
        this.fecha_inicio = fecha_inicio;
        this.fecha_registro = fecha_registro;
        this.fecha_entrega = fecha_entrega;
        this.fecha_real_entrega = fecha_real_entrega;
        this.fecha_estimada_respuesta = fecha_estimada_respuesta;
        this.fecha_cancelacion = fecha_cancelacion;
        this.estado_tarea = estado_tarea;
        this.observaciones = observaciones;
    }
}

export default Tarea;
