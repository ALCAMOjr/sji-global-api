import fs from 'fs';
import puppeteer from 'puppeteer';
import bwipjs from 'bwip-js';

class DemandaIyccPesosPdfService {
  constructor(data) {
    ['monto_otorgado', 'adeudo', 'adeudo_pesos'].forEach((campo) => {
      if (data[campo] !== null && !isNaN(data[campo])) {
        data[campo] = parseFloat(data[campo].toString());
      }
    });
    this.data = data;
    this.contenidoDemanda = [
      { tipo: 'alineado-izquierda', contenido: 'C. «JUZGADO». -' },
      { tipo: 'alineado-izquierda', contenido: 'P r e s e n t e. -' },

      {
        tipo: 'parrafo', contenido: [
          '<span class="negrita">LIC. GERARDO GARCÍA HERNANDEZ</span>, mexicano, abogado en el ejercicio de la profesión, sin adeudo de carácter fiscal, con cédula profesional número 19019944 y cuyo título profesional está inscrito ante el Tribunal Superior de Justicia del Estado con el número 23445, señalando como domicilio convencional para el efecto de oír y recibir notificaciones, el ubicado en la calle Liendo, Número 610, Interior 200, en la colonia Obispado, en el municipio de Monterrey, Nuevo León, ante Usted con el debido respeto, comparezco y expongo:'
        ]
      },

      {
        tipo: 'parrafo', contenido: [
          'Por medio del presente escrito, y en mi carácter de Apoderado General para Pleitos y Cobranzas del <span class="negrita">INSTITUTO DEL FONDO NACIONAL DE LA VIVIENDA PARA LOS TRABAJADORES</span>, tal como se acredita con la copia debidamente certificada del instrumento notarial número <span class="negrita">56,778</span> de fecha <span class="negrita">30 treinta de julio del 2024 (dos mil veinticuatro)</span> pasada ante la fe del C. Licenciado <span class="negrita">RICARDO VARGAS NAVARRO</span>, Notario Público número <span class="negrita">88</span>, con ejercicio en Ciudad de México, personalidad que desde este momento solicito me sea reconocida, ocurro ante Usted se me tenga <span class="negrita">apersonándome</span> dentro del presente procedimiento. De igual manera solicito desde este momento la <span class="negrita">devolución</span> del Poder Notarial con el cual acredito mi personalidad en el presente Juicio, allegando previamente copia del mismo, solicitando me sea reconocida la personalidad con la que ostento; ocurro ante esta H. Autoridad Judicial a fin de promover <span class="negrita">JUICIO ORDINARIO CIVIL</span> en <<CONTRA_DE>> <span class="negrita"> C. «ACREDITADO»</span>, quien tiene su domicilio para el efecto de emplazamiento en la CALLE <span class="negrita">«CALLE»</span> NUMERO <span class="negrita">«NUMERO»</span>, «TIPO_ASENTAMIENTO» <span class="negrita">«COLONIA_FRACCIONAMIENTO»</span> C.P. <span class="negrita">«CODIGO_POSTAL»</span>, <span class="negrita">«MUNICIPIO»</span>, <span class="negrita">NUEVO LEON</span>, y de quien reclamo las siguientes:'
        ]
      },

      { tipo: 'titulo', contenido: 'P R E S T A C I O N E S' },

      {
        tipo: 'opcion-lista', contenido: [
          '<span class="negrita">a)</span> Se decrete el vencimiento anticipado del <span class="negrita">CONTRATO DE APERTURA DE CREDITO SIMPLE Y LA CONSTITUCION DE GARANTIA HIPOTECARIA</span>, celebrado entre mi representada el <span class="negrita">INSTITUTO DEL FONDO NACIONAL DE LA VIVIENDA PARA LOS TRABAJADORES</span>, y <<AHORA_DEMANDADO>> <span class="negrita">C.</span> <span class="negrita">«ACREDITADO»</span>, contenido en <span class="negrita">Escritura Pública número «ESCRITURA» «ESCRITURA_FT» </span> de fecha <span class="negrita">«FECHA_ESCRITURA_FT»</span> e inscrita ante el <span class="negrita">Registro Público de la Propiedad del Comercio</span>, bajo el número de inscripción <span class="negrita">«INSCRIPCION»</span>, Volumen <span class="negrita">«VOLUMEN»</span>, Libro <span class="negrita">«LIBRO»</span>, Sección <span class="negrita">«SECCION»</span>, Unidad <span class="negrita">«UNIDAD»</span>, Nuevo León, de fecha <span class="negrita">«FECHA_FT»</span>, y que se acompaña como documento base de la acción, en virtud de que mi ahora demandado incumplió con el pago a capital correspondiente desde el mes de <span class="negrita">«MES_PRIMER_ADEUDO»</span> HASTA EL MES DE <span class="negrita">«MES_ULTIMO_ADEUDO»</span>.'
        ]
      },

      {
        tipo: 'opcion-lista', contenido: [
          '<span class="negrita">b)</span> Como consecuencia, solicito la <span class="negrita">Declaración Judicial</span> de la Rescisión del <span class="negrita">CONTRATO DE APERTURA DE CRÉDITO SIMPLE CON GARANTÍA HIPOTECARIA</span>, mencionado en el punto que antecede, de conformidad con lo establecido por el artículo 49 de la Ley del Instituto del Fondo Nacional de la Vivienda para los Trabajadores. Por lo tanto, se reclama por concepto de Capital Insoluto o Suerte Principal el pago en moneda nacional equivalente a <span class="negrita">$«ADEUDO» «ADEUDO_FT»</span>, el cual se deriva de la disposición de crédito efectuada por <<AHORA_DEMANDADO>>, conforme a lo establecido en el contrato de apertura de crédito.'
        ]
      },

      {
        tipo: 'ultimo-parrafo', contenido: [
          'De acuerdo al decreto de fecha veintisiete de enero del año dos mil dieciséis, donde se reformaron y adicionaron diversas disposiciones de la Constitución Política de los Estados Unidos Mexicanos, en materia de desindexación del salario mínimo, se estableció en el artículo sexto transitorio lo que a la letra se transcribe a continuación:'
        ]
      },

      {
        tipo: 'parrafo-pequeno', contenido: [
          '<span class="negrita">Sexto</span>.- Los créditos vigentes a la entrada en vigor del presente Decreto cuyos montos se actualicen con base al salario mínimo y que hayan sido otorgados por el Instituto del Fondo Nacional de la Vivienda para los Trabajadores, el Fondo de la Vivienda del Instituto de Seguridad y Servicios Sociales de los Trabajadores del Estado u otras instituciones del Estado dedicadas al otorgamiento de crédito para la vivienda, continuarán actualizándose bajo los términos y condiciones que hayan sido estipulados. Sin perjuicio de lo señalado en el párrafo anterior, en el evento de que el salario mínimo se incremente por encima de la inflación, las referidas instituciones no podrán actualizar el saldo en moneda nacional de este tipo de créditos a una tasa que supere el crecimiento porcentual de la <<UNIDAD_M>> durante el mismo año. Las instituciones a que se refiere el primer párrafo podrá, a partir de la entrada en vigor de este Decreto y hasta 720 días naturales posteriores a la entrada en vigor del mismo, seguir otorgando créditos a la vivienda que se referencien o actualicen con base al salario mínimo.'
        ]
      },

      {
        tipo: 'parrafo-pequeno', contenido: [
          'En el evento de que el salario mínimo se incremente por encima de la inflación, las citadas instituciones no podrán actualizar el saldo en moneda nacional de este tipo de créditos a una tasa que supere el crecimiento porcentual de la Unidad de Medida y Actualización durante el mismo año. El órgano de gobierno de cada institución podrá determinar el mecanismo más adecuado para implementar lo dispuesto en el presente artículo transitorio.'
        ]
      },

      {
        tipo: 'opcion-lista', contenido: [
          '<span class="negrita">c)</span> <span class="negrita">Intereses Ordinarios.</span> Por concepto de <span class="negrita">intereses ordinarios</span> no cubiertos generados desde el mes de <span class="negrita">«MES_PRIMER_ADEUDO»</span> <span class="negrita">HASTA</span> <span class="negrita">«MES_ULTIMO_ADEUDO»</span> y calculados en una tasa fija anual del <span class="negrita">«INTERES_ORDINARIO»</span> por ciento sobre saldos insolutos, lo anterior conforme a lo establecido en el contrato base de la acción, más los que se sigan generando hasta la fecha del pago total del importe del crédito y conforme a la liquidación que por dicho concepto se realice en ejecución de sentencia.'
        ]
      },


      {
        tipo: 'opcion-lista', contenido: [
          '<span class="negrita">d)</span> <span class="negrita">Intereses Moratorios.</span> Pago en Moneda Nacional por concepto de <span class="negrita">intereses moratorios</span> no cubiertos generados desde la amortización correspondiente desde el mes de <span class="negrita">«MES_PRIMER_ADEUDO»</span> <span class="negrita">HASTA</span> <span class="negrita">«MES_ULTIMO_ADEUDO»</span> calculados a una tasa de interés del <span class="negrita">«INTERES_MORATORIO»</span> por ciento anual, tasa resultante de sumar la tasa anual del 4.2% y la tasa anual de Interés Ordinario, lo anterior de conformidad a lo establecido en el contrato de apertura de crédito, más los que se sigan generando hasta la fecha del pago total del importe del crédito y conforme a la liquidación que por dicho concepto se realice en ejecución de sentencia.'
        ]
      },

      {
        tipo: 'opcion-lista', contenido: [
          '<span class="negrita">e)</span> Como consecuencia de la Rescisión del contrato y del crédito, se demanda la <span class="negrita">Declaración Judicial</span> de que el importe de cualquier cantidad que haya sido cubierta por el ahora demandado, hasta la fecha en que se desocupe el inmueble que se describe en el siguiente punto, se aplicará a favor de mi mandante, a título de pago por el uso y disfrute de la vivienda otorgada en garantía, conforme al artículo 49 de la Ley del Instituto del Fondo Nacional de la Vivienda para los Trabajadores y el numeral 2311 del Código Civil Federal.'
        ]
      },

      {
        tipo: 'opcion-lista', contenido: [
          '<span class="negrita">f)</span> En caso de que la parte demandada, se niegue a pagar el importe de las cantidades adecuadas y reclamadas, se decrete la <span class="negrita subrayado">ejecución forzosa de la garantía hipotecaria otorgada en primer lugar y grado</span> por el ahora demandado a favor de mi representada, respecto del bien inmueble ubicado en <span class="negrita">CALLE</span> <span class="negrita">«CALLE»</span> <span class="negrita">NUMERO</span> <span class="negrita">«NUMERO»</span>, <span class="negrita">«COLONIA_FRACCIONAMIENTO»</span> <span class="negrita">C.P.</span> <span class="negrita">«CODIGO_POSTAL»</span>, <span class="negrita">«MUNICIPIO»</span>, <span class="negrita" «ESTADO»/span> e inscrita ante el <span class="negrita">Registro Público de la Propiedad del Comercio</span>, bajo el número de inscripción <span class="negrita">«INSCRIPCION»</span>, Volumen <span class="negrita">«VOLUMEN»</span>, Libro <span class="negrita">«LIBRO»</span>, Sección <span class="negrita">«SECCION»</span>, Unidad <span class="negrita">«UNIDAD»</span>, <span class="negrita">«ESTADO»</span>, de fecha <span class="negrita">«FECHA_FT»</span>, en los términos del contrato base de la acción, a efecto de que con el importe que se obtenga con motivo de esa ejecución se liquide hasta donde alcance lo adeudado.'
        ]
      },

      {
        tipo: 'opcion-lista', contenido: [
          '<span class="negrita">g)</span> Pago de los gastos y costas que se originen con motivo de la tramitación del presente juicio.'
        ]
      },

      {
        tipo: 'parrafo', contenido: [
          'Se funda la presente demanda en los siguientes hechos y consideraciones de derecho:'
        ]
      },

      {
        tipo: 'titulo', contenido: [
          'H E C H O S'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">I.-</span> La Ley del Instituto del Fondo Nacional de la Vivienda para los Trabajadores, publicada el día 24 de abril de 1972, en el Diario Oficial de la Federación, establece que tal Instituto es un Organismo Público de Interés Social con personalidad y patrimonio propio, y que dentro de sus objetivos se encuentra el otorgamiento de crédito a derecho habientes del fondo para destinarlos a la adquisición de vivienda, construcción, reparación o mejoramiento de sus habitaciones y al pago de pasivos contraídos por algunos de los conceptos anteriores.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">II.-</span> Conforme a los fines de la Ley del Instituto del Fondo Nacional de la Vivienda para los Trabajadores, mi representada celebró con <<DEMANDADO>> <span class="negrita">C. «ACREDITADO»</span>, un <span class="negrita">CONTRATO DE APERTURA DE CREDITO SIMPLE CON GARANTIA HIPOTECARIA</span>, como se justifica con la <span class="negrita">Escritura Pública número</span> <span class="negrita">«ESCRITURA» «ESCRITURA_FT»</span> <span class="negrita">de fecha</span> <span class="negrita">«FECHA_ESCRITURA_FT»</span> <span class="negrita">e inscrita ante el Registro Público de la Propiedad del Comercio, bajo el número de inscripción</span> <span class="negrita">«INSCRIPCION»</span>, <span class="negrita">Volumen</span> <span class="negrita">«VOLUMEN»</span>, <span class="negrita">Libro</span> <span class="negrita">«LIBRO»</span>, <span class="negrita">Sección</span> <span class="negrita">«SECCION»</span>, <span class="negrita">Unidad</span> <span class="negrita">«UNIDAD»</span>, <span class="negrita">«ESTADO»</span>, de fecha <span class="negrita">«FECHA_FT»</span>, el cual exhibo en primer testimonio original, para demostrar la existencia de dicha relación jurídica y los derechos y obligaciones adquiridos por las partes.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">III.-</span> En el contrato con que se demanda, se desprende que mi representada le otorgó <<DEMANDADO_C2>> <span class="negrita">C. «ACREDITADO»</span>, un crédito por un monto equivalente a la cantidad de <span class="negrita">$«MONTO_OTORGADO» «MONTO_OTORGADO_FT»</span>, crédito que fue totalmente dispuesto para destinarlo a la adquisición del inmueble descrito en el punto Primero del apartado de Antecedentes del documento base de la presente acción, siendo dicho inmueble respecto del cual se demanda la ejecución de garantía hipotecaria. Dicho crédito se registró bajo el número <span class="negrita">«CREDITO»</span>.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          'Así también, según lo establecido en el contrato de apertura de crédito, <<DEMANDADO_C>> <span class="negrita">C. «ACREDITADO»</span> reconoció adeudar y se obligó a pagar a mi representada, el monto del crédito otorgado, en los términos y condiciones que se precisan en el propio documento sustento de mi acción.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">IV.-</span> De conformidad a lo establecido en el contrato de apertura de crédito, se acordó que el importe del crédito concedido a mi ahora demandado, devengaría un interés ordinario del <span class="negrita">«INTERES_ORDINARIO»%</span> sobre saldos insolutos.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">V.-</span> De conformidad a lo establecido en el contrato base de la acción, mi ahora demandado(a), acordó que en caso de que no se realizara algún pago por suerte principal o intereses del crédito objeto de este contrato, pagará a este, en adición a los intereses ordinarios, intereses moratorios a razón de una tasa de interés anual del <span class="negrita">«INTERES_MORATORIO»</span> por ciento anual, tasa resultante de sumar la tasa anual del 4.2% y la tasa anual de Interés Ordinario.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">VI.-</span> De conformidad a lo establecido en el contrato de apertura de crédito, <<DEMANDADO_C>> <span class="negrita">C. «ACREDITADO»</span> se obligó a amortizar el crédito concedido, mediante el pago en pesos equivalente a la Cuota Mensual de Amortización Ordinaria que su patrón le descontará con la periodicidad con que se efectúe el pago del salario.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">VII.-</span> Conforme a lo establecido en el contrato de apertura de crédito, se estableció que si <<DEMANDADO_C>> <span class="negrita">C. «ACREDITADO»</span>, deja de percibir su salario por cualquier causa, salvo lo previsto en los artículos 49 y 51 de la Ley del INFONAVIT, tendrá la obligación de seguir amortizando el crédito que le ha sido otorgado, mediante el pago en pesos equivalente a la cuota mensual de amortización especial.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">VIII.-</span> En el contrato que funda mi acción, se establecieron las causas de la Rescisión del citado instrumento, con motivo de las cuales, el INFONAVIT sin necesidad de declaración judicial, podría dar por rescindido el <span class="negrita">CONTRATO DE APERTURA DE CRÉDITO SIMPLE CON GARANTÍA HIPOTECARIA</span> que ahora se demanda y con ello de conformidad con lo dispuesto por el artículo 49 de la Ley de INFONAVIT, se daría por rescindido el plazo para el pago del crédito, exigiendo el importe del salario insoluto, más los intereses normales y moratorios que se causen hasta la fecha de pago.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">IX.-</span> En virtud de que en el presente caso, se surte la hipótesis prevista en el contrato base de la acción, al haber dejado el ahora demandado de cubrir por causas imputables a ella, más de dos pagos consecutivos, puesto que incumplió con el pago de las amortizaciones comprendidas desde el mes de <span class="negrita">«MES_PRIMER_ADEUDO»</span>, hasta la fecha en que se expide la constancia de Incumplimiento que se anexa a la presente demanda, junto con el multicitado contrato que le da origen a la misma.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          'En esta tesitura, al momento de la amortización a capital correspondiente a la mensualidad de <span class="negrita">«MES_PRIMER_ADEUDO»</span>, la parte demandada incumplió con el crédito, no obstante que estaba obligada a pagar el importe de las amortizaciones a capital del crédito, por lo que al haber dejado de cubrir el demandado los pagos de las cuotas de amortización del crédito en la forma convenida, ha propiciado la rescisión del contrato y por ende el vencimiento del plazo para el pago del saldo insoluto del crédito otorgado, mismo que al mes de <span class="negrita">«MES_ULTIMO_ADEUDO»</span> asciende a la cantidad de <span class="negrita">$«ADEUDO» «ADEUDO_FT»</span>, el cual se demanda su pago por concepto de capital insoluto o suerte principal, más accesorios.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          'A lo anterior debe agregarse que, en el caso particular, <<AHORA_DEMANDADO>> hizo caso omiso al requerimiento mediante el cual mi representada ante la presencia de dos testigos, le requirió sobre el pago de las cantidades que ahora reclaman, por lo que se manifiesta la conducta ilícita de faltar al pago de sus obligaciones. Motivo por el cual es procedente que esta H. Autoridad declare que ha operado la Rescisión del contrato objeto de esta demanda, debiéndose en consecuencia y de conformidad con lo establecido por el artículo 49 de la Ley de INFONAVIT, declarar la Rescisión del plazo para el pago del adeudo otorgado por mi poderdante al demandado y por ende debe ser condenado a pagar a mi representada las prestaciones reclamadas que comprenden el saldo insoluto del crédito, el importe de las amortizaciones adeudadas, el importe de los intereses normales y moratorios adeudados, más los que se sigan causando hasta la fecha de su pago.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          'En la inteligencia de que las cantidades que haya cubierto <<AHORA_DEMANDADO>>, hasta la fecha en que se desocupe la vivienda se aplicarán a favor de mi mandante a título de pago por el uso de la propia vivienda, tal y como se establece el artículo 49 de la Ley de INFONAVIT, el cual a la letra establece:'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">“Artículo 49.-</span> Los créditos que otorgue el Instituto, se rescindirán y por lo tanto se darán por vencidos anticipadamente, cuando sin su autorización los deudores enajenen, incluida la permuta, o graven su vivienda, así como cuando incurran en cualesquiera de las causales de violación consignadas en los contratos respectivos. Tratándose de créditos otorgados para la adquisición de viviendas financiadas directamente por el instituto, éstos se darán por cancelados y el contrato rescindido si los deudores incurren en alguna de las causales señaladas en el párrafo anterior, por lo que el deudor o quien ocupe la vivienda deberá desocuparla en un término de 45 días naturales contados a partir de la fecha en que se reciba el aviso respectivo. En el caso del párrafo anterior, <span class="negrita">las cantidades que hayan cubierto los trabajadores hasta la fecha en que se desocupe la vivienda, se aplicarán a favor del instituto a título de pago por el uso de la propia vivienda</span>.”'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">X.-</span> De conformidad a lo establecido en el contrato de apertura de crédito fundatorio de la acción, la parte demandada garantizó el cumplimiento de todas y cada una de las obligaciones contraídas en la mencionada escritura, a favor del INFONAVIT con la finca y el lote a que hace referencia en la cláusula <span class="negrita">ANTECEDENTES</span> del contrato de Compraventa.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">XI.-</span> En este orden de ideas, y al haber incumplido el demandado con las obligaciones adquiridas, al haber dejado de pagar el importe de las cantidades reclamadas, es por lo que solicito a esta H. Autoridad se haga efectiva la <span class="negrita">Garantía Hipotecaria</span> y se condene al demandado de que en caso de no pagar lo reclamado, se procederá a la ejecución de la referida hipoteca, mediante el remate en pública subasta del bien inmueble en mención.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">XII.-</span> Es de relevancia mencionar que en diversas y reiteradas ocasiones, se han realizado gestiones extrajudiciales con la finalidad de conseguir el pago de las prestaciones adeudadas, mismas que han resultado infructuosas, por ende, me veo en la imperiosa necesidad de ejercer esta acción.'
        ]
      },

      {
        tipo: 'parrafo', contenido: [
          'Así mismo y de conformidad con lo preceptuado en los artículos 226 y 230 del Código de Procedimientos Civiles vigente en el Estado, ofrezco al efecto los elementos convictivos de mi intención, los cuales hago consistir en las siguientes:'
        ]
      },

      { tipo: 'titulo', contenido: 'P R U E B A S' },

      {
        tipo: 'romanos',
        contenido: [
          '<span class="negrita">I.- DOCUMENTAL PÚBLICA.-</span> Consistente en la copia certificada de la Escritura Pública Número 56,778 de fecha 30 treinta de julio del 2024 dos mil veinticuatro pasada ante la fe del C. Licenciado <span class="negrita">RICARDO VARGAS NAVARRO</span>, Notario Público número 88, con ejercicio en Ciudad de México, que contiene el otorgamiento del Poder General para Pleitos y Cobranzas que otorga el Instituto de Fondo Nacional de la Vivienda para los Trabajadores, y como consecuencia de lo anterior la personalidad con la que comparezco en el presente juicio, así como también el objeto social del referido instituto, por desprenderse de dicho instrumento que como fines tiene los previstos en los artículos 2 y 3 de la Ley que rige al referido Instituto.'
        ]
      },
      {
        tipo: 'romanos',
        contenido: [
          'La documental pública que contiene el poder, debe ser admitida por ser de las pruebas reconocidas según el artículo 239 fracción II del Código de Procedimientos Civiles y porque de acuerdo a lo dispuesto por los artículos 287 y 297 del mismo Código, produce eficacia jurídica probatoria plena, justificando por ende mi personalidad en el procedimiento en que actúo.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">II.- DOCUMENTAL PÚBLICA.-</span> Consistente Escritura Pública número <span class="negrita">«ESCRITURA»</span> (<span class="negrita">«ESCRITURA_FT»</span>) de fecha <span class="negrita">«FECHA_ESCRITURA_FT»</span> e inscrita ante el Registro Público de la Propiedad del Comercio, bajo el número de inscripción <span class="negrita">«INSCRIPCION»</span>, Volumen <span class="negrita">«VOLUMEN»</span>, Libro <span class="negrita">«LIBRO»</span>, Sección <span class="negrita">«SECCION»</span>, Unidad <span class="negrita">«UNIDAD»</span>, Nuevo León, de fecha <span class="negrita">«FECHA_FT»</span> mediante la cual se protocolizó el <span class="negrita">CONTRATO DE APERTURA DE CRÉDITO SIMPLE CON GARANTÍA HIPOTECARIA</span>, celebrado entre mi representada, el INSTITUTO DEL FONDO NACIONAL PARA LA VIVIENDA DE LOS TRABAJADORES <<Y_AHORA_DEMANDADO>>. El objeto de la prueba que cito con antelación es acreditar la celebración del contrato, la existencia de dicho acto jurídico, las estipulaciones contenidas en el contrato, el incumplimiento de la parte demandada en sus obligaciones, la rescisión del contrato, el vencimiento del plazo para el otorgamiento del crédito, el pago de las prestaciones que se le reclaman y la pérdida de las cantidades que haya entregado el demandado al Instituto, la existencia de un crédito cierto, real y exigible a cargo de la parte demandada a favor de mi representada, la forma y el plazo para el reembolso del capital, el pacto de los intereses ordinarios y moratorios, y la constitución de la hipoteca respecto del bien sobre el cual demanda la ejecución.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          'La documental que contiene el contrato base de la acción, debe ser admitida por ser de las pruebas reconocidas según el artículo 239 fracción II del Código de Procedimientos Civiles, y porque de acuerdo a lo dispuesto en los articulos 287 y 297 del mismo Ordenamiento, produce eficacia jurídica probatoria plena, para acreditar los hechos referidos, que demuestran la procedencia de la acción deducida y cualquier excepción que pueda oponer la parte demandada. Esta documental la relaciono con todos y cada uno de los puntos del capítulo de hechos de esta demanda.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">III.- DOCUMENTAL PÚBLICA. -</span> Consistente en la Constancia de Saldo, expedida por el Instituto del Fondo Nacional para la Vivienda de los Trabajadores, correspondiente al Crédito <span class="negrita">«CREDITO»</span>, falta de pago constante y reiterado en el que incurrió <<DEMANDADO>> C. <span class="negrita">«ACREDITADO»</span>, en los periodos comprendidos del mes de <span class="negrita">«MES_PRIMER_ADEUDO»</span> hasta el mes <span class="negrita">«MES_ULTIMO_ADEUDO»</span>, fecha en que se expide la citada constancia de saldo; documento que en su original se anexa a la presente demanda. El objeto de la prueba que cito con antelación es justificar cuales son las amortizaciones con que la parte demandada dejó de cumplir, el importe del saldo insoluto del crédito cuyo vencimiento anticipado se demanda, el importe de los intereses ordinarios o normales y moratorios reclamados, así como los plazos que comprenden los intereses que aparecen cuantificados, que se reclaman en la presente demanda.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">IV.- CONFESIONAL. -</span> Que deberá absolver en forma personal bajo protesta de decir verdad y no a través de apoderado o mandatario judicial, <<DEMANDADO_C>> <span class="negrita"> C. «ACREDITADO»</span>, de acuerdo al pliego de posiciones que se adjuntará en el momento procesal oportuno y en caso de que se le tenga contestando en sentido negativo a la parte demandada, me desisto desde este momento de la prueba confesional. El objeto de la prueba que cito con antelación es acreditar la celebración del contrato, la existencia de dicho acto jurídico, las estipulaciones contenidas en el contrato, el incumplimiento de la parte demandada en sus obligaciones, la rescisión del contrato, el vencimiento del plazo para el otorgamiento del crédito, el pago de las prestaciones que se le reclaman y la pérdida de las cantidades que haya entregado el demandado al Instituto.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          'La confesional que se ofrece debe admitirse en la forma propuesta por ser de las pruebas reconocidas por la ley, y además porque de acuerdo a lo dispuesto por los artículos 362 y 366 del Código de Procedimientos Civiles vigente en la Entidad, produce eficacia jurídica plena. Esta documental la relaciono con todos y cada uno de los puntos del capítulo de hechos de esta demanda.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">V.- DOCUMENTAL. -</span> Consistente en las actas de requerimiento efectuadas por mi representada a la parte demandada ante dos testigos. El objeto de estas documentales es demostrar que mi representada de conformidad con lo establecido en el contrato base de la acción, le requirió ante la presencia de dos testigos, con antelación a la fecha de presentación de esta demanda, al demandado sobre el pago de las cantidades que ahora se reclaman y que lo requirió a efecto de que le exhibiera los comprobantes de pago que justifiquen plenamente el no haber dejado de cumplir con el pago del impuesto predial correspondiente al inmueble sobre el que ahora se solicita la ejecución forzosa como garantía hipotecaria. Esta prueba está relacionada con todos y cada uno de los puntos del capítulo de hechos de esta demanda.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">VI.- PRESUNCIONAL. -</span> En su doble aspecto, tanto el legal como el humano, solo en cuanto beneficien a los intereses que represento. El objeto de la prueba que cito con antelación es acreditar todos los hechos materia de acciones deducidas en el juicio y la improcedencia de cualquier excepción por parte del demandado(a) e incluso de los hechos negados por el mismo(a).'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          'Esta prueba justifica los hechos referidos en virtud de ser un medio de convicción reconocido y al que la ley confiere valor probatorio de acuerdo a lo que disponen los artículos 384 y 386 del Código de Procedimientos Civiles. Esta documental la relaciono con todos y cada uno de los puntos del capítulo de hechos de esta demanda.'
        ]
      },
      { tipo: 'titulo', contenido: 'D E R E C H O' },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">COMPETENCIA:</span> Es usted competente para conocer del presente Juicio atento a lo dispuesto por los artículos 99, 100, 101, 102, 103 al 108 y demás relativos del Código de Procedimientos Civiles Vigente en el Estado.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">FONDO DEL NEGOCIO:</span> Son aplicables los artículos 1, 2, 2279 y demás relativos del Código Civil Vigente en el Estado, así como los artículos 1, 2, 3, 16, 29, 35, 41, 42, 44, 49, 50 y 70 de la Ley del Instituto del Fondo Nacional de la Vivienda para los Trabajadores.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">PROCEDIMIENTO:</span> Se regulan por los artículos 1, 2, 9 y del 612 al 645 del Código de Procedimientos Civiles vigente para el Estado de Nuevo León.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          'Por lo anteriormente expuesto y fundado a Usted C. Juez, atentamente solicito:'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">PRIMERO:</span> Se me tenga mediante el presente escrito, documentos y copias simples que se acompañan, promoviendo en mi carácter de Apoderado General para Pleitos y Cobranzas del <span class="negrita">INSTITUTO DEL FONDO NACIONAL DE LA VIVIENDA PARA LOS TRABAJADORES</span> "INFONAVIT", JUICIO ORDINARIO CIVIL en <<CONTRA_DE_DEM>> <span class="negrita">C. «ACREDITADO»</span> a quien se reclama las prestaciones que se desprenden en la presente demanda.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">SEGUNDO:</span> Se admita a trámite la presente demanda, ordenándose emplazar al demandado(a), a fin de que dentro del término de 09 nueve días contados a partir del siguiente a aquel en que quede debidamente notificado de la demanda incoada en su contra, comparezca a producir su contestación expresando las excepciones legales que a sus derechos conviniera, o en su defecto se le tendrá por contestando en sentido negativo a dicha demanda, igualmente se le prevenga de que en caso de no señalar domicilio para recibir notificaciones las ulteriores inclusive las personales se realizarán mediante estrados, esto último con fundamento en lo dispuesto por el artículo 68 del Código de Procedimientos Civiles para el Estado de Nuevo León.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">TERCERO:</span> Una vez agotada la secuela procesal, se pronuncie la Sentencia Definitiva que corresponda, en forma favorable a los intereses de mi representada.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">CUARTO:</span> Me sea devuelta previa copia simple que de ella se deje en autos, la copia certificada del documento con que se justifica la personalidad del suscrito, autorizando para recogerla en mi nombre a los profesionistas que se citan en el siguiente punto.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">QUINTO:</span> Así mismo ocurro ante este H. Juzgado a fin de que se me tenga por autorizando en amplios términos a que se refiere el artículo 78 del Código de Procedimientos Civiles del Estado de Nuevo León vigente al <span class="negrita">LIC. GERARDO GARCÍA HERNANDEZ</span> con cédula profesional 19019944, No. De Acta 23445 de fecha de registro 18 de junio del 2024, a la <span class="negrita">LIC. XIMENA LIZETH SILVA OVIEDO</span> con Cédula Profesional 13543969, No. De Acta 22331 de fecha de registro 03 de julio de 2023 expedida por la Secretaría de Educación Pública, <span class="negrita">LIC. ALFREDO FUENTES CHAVARRÍA</span> con cédula profesional 13530341, No. De Acta 22513 de fecha de registro 22 de agosto del 2023 expedida por la Secretaria de Educación Pública, y a los pasantes de derecho <span class="negrita">GABRIEL BASÁÑEZ GONZÁLEZ, ERIKA ROMERO BECERRA, ANDREA LORELEY MÁRQUEZ MEZA, DIANA PRISCILLA ROSAS HERNÁNDEZ, ALEJANDRA MARISOL RAMÍREZ BARRIENTOS, DANIELA ELIZABETH GARCIA LEOS, ANGELICA ESTEFANIA QUINTERO PEREZ, LOURDES ROCIO SANTIAGO CRUZ, LORENA RAMIREZ MALDONADO, GRECIA SOFIA PEREZ MEDELLIN, JULIO LARRONDO GARCIA, SALMA DANIELA SARMIENTO CARREÓN, SABRINA GONZÁLEZ SEPULVEDA, ERICK IVAN TORRES DÍAZ</span> para oír y recibir toda clase de notificaciones y documentos a mí nombre. Lo anterior para los efectos legales que haya lugar.'
        ]
      },

      {
        tipo: 'alineado-izquierda-sin-negrita',
        contenido: 'A la vez, solicito que todas las personas autorizadas en el párrafo que antecede se den de alta en el abc de abogados en el auto de admisión de la presente demanda.'
      },

      {
        tipo: 'romanos',
        contenido: [
          '<span class="negrita">SEXTO:</span> Con fundamento en lo dispuesto por el sexto párrafo del artículo 78 del Código de Procedimientos Civiles de la entidad, solicito atentamente se sirva autorizar para que tenga acceso a la página de <span class="negrita">Tribunal Virtual</span> y que por ese conducto pueda consultarse todo el expediente electrónico y puedan enviarse dentro de este expediente promociones vía electrónica, así como para que surta los efectos las notificaciones de todas y cada una de las notificaciones personales, al usuario: <span class="negrita">“GGARCIA”</span>. Dicho usuario se encuentra registrado en el Tribunal Virtual a nombre del suscrito <span class="negrita">LIC. GERARDO GARCIA HERNANDEZ</span>.'
        ]
      },

      {
        tipo: 'romanos',
        contenido: [
          'Así mismo, autorizando las cuentas <span class="negrita">“sji global 01”</span> a nombre del Lic. Gabriel Basáñez González, <span class="negrita">sjiglobal02</span> a nombre del <span class="negrita">LIC. JULIO LARRONDO GARCÍA</span>, <span class="negrita">ximena.siov</span> a nombre de la <span class="negrita">LIC. XIMENA LIZETH SILVA OVIEDO</span> y <span class="negrita">AlfredoFuentesC</span> a nombre del <span class="negrita">LIC. ALFREDO FUENTES CHAVARRÍA</span>, usuarios debidamente registrados en la plataforma de Tribunal Virtual,'
        ]
      },

      {
        tipo: 'centrado', contenido: [
          '<br><br>',
          '<div style="text-align: center;">',
          'Justa y Legal mi solicitud, espero el proveído de conformidad.',
          '<div style="margin-top: 10px; font-weight: bold;">“PROTESTO LO NECESARIO EN DERECHO”</div>',
          'Monterrey, Nuevo León a la fecha de presentación.',
          '<br><br><br><br>',
          '<span class="negrita">LIC. GERARDO GARCÍA HERNANDEZ</span>',
          '</div>',
          '<br><br>'
        ]
      },

      { tipo: 'alineado-izquierda', contenido: 'A N E X O S:' },

      {
        tipo: 'lista', contenido: [
          '<ul style="list-style-type: none; padding-left: 15px; margin: 0;">',
          '<li style="margin-bottom: 5px;">- Copia certificada de poder, número 56,778</li>',
          '<li style="margin-bottom: 5px;">- Escritura Pública número <span class="negrita">«ESCRITURA»</span></li>',
          '<li style="margin-bottom: 5px;">- <span class="negrita">Constancia de Saldo</span></li>',
          '<li style="margin-bottom: 5px;">- <span class="negrita">Requerimiento</span></li>',
          '<li style="margin-bottom: 5px;">- <span class="negrita">«JUEGO»</span></li>',
          '<li style="margin-bottom: 5px;">- <span class="negrita">Pliego de posiciones en sobre cerrado</span></li>',
          '</ul>'
        ]
      },

      {
        tipo: 'parrafo', contenido: [
          '<div style="page-break-before: always;"></div>'
        ]
      },
      {
        tipo: 'parrafo', contenido: [
          '<div style="page-break-before: always;"></div>'
        ]
      },

      {
        tipo: 'romanos',
        contenido: [
          'En el Municipio de <span class="negrita">«MUNICIPIO»</span>, <span class="negrita">«ESTADO»</span>, siendo las <span class="negrita">«HORA_REQUERIMIENTO»</span> horas del día <span class="negrita">«FECHA_REQUERIMIENTO_FT»</span>, el suscrito <span class="negrita">Lic. ALFREDO FUENTES CHAVARRÍA</span>, Apoderado Jurídico General para Pleitos y Cobranzas del <span class="negrita">Instituto del Fondo Nacional de la Vivienda para los Trabajadores</span>, en compañía de los testigos, <span class="negrita">C.C Ernesto Morales Ramírez y María Cristina Cruz Luna</span>, quienes se identifican con credenciales para votar expedidas por el Instituto Federal Electoral, el primero con folio No. 1492130249568 y el segundo con folio No. 1171000699812, hago constar que me constituí <<DOMICILIO_DE>> <span class="negrita">C. «ACREDITADO»</span>, con relación al <span class="negrita">Contrato de Apertura de Crédito Simple con Garantía Hipotecaria</span> que la citada persona tiene celebrado con mi representada, protocolizado mediante Escritura Pública número <span class="negrita">«ESCRITURA» «ESCRITURA_FT»</span>, respecto al adeudo consistente en: El pago en moneda nacional (pesos) de la cantidad de <span class="negrita">$«ADEUDO» «ADEUDO_FT»</span>, derivado de la disposición del crédito efectuada, conforme a lo establecido en el Contrato antes referido.'
        ]
      },

      {
        tipo: 'romanos',
        contenido: [
          'Por lo que habiéndonos cerciorado previamente de la autenticidad del domicilio <<DEMANDADO_C3>> <span class="negrita">C. «ACREDITADO»</span>, ubicado en la finca en que nos constituimos, por medio de la nomenclatura de la calle y número de la misma, así como por el dicho de dos vecinos inmediatos a ese domicilio, el primero cuya media filiación es: sexo masculino de aproximadamente un metro con setenta centímetros de estatura, tez aperlada, cabello castaño, de aproximadamente 30 años de edad, el segundo cuya media filiación es sexo femenino, de aproximadamente un metro con sesenta y tres centímetros de estatura, tez blanca, cabello castaño, de aproximadamente 42 años de edad, quienes se negaron a identificarse, los cuales al preguntarles por el domicilio buscado antes señalado, nos manifestaron que efectivamente es el ubicado en la <span class="negrita">CALLE</span> <span class="negrita">«CALLE»</span>, <span class="negrita">NUMERO</span> <span class="negrita">«NUMERO»</span>, <span class="negrita">«COLONIA_FRACCIONAMIENTO»</span>, <span class="negrita">«MUNICIPIO»</span>, <span class="negrita">«ESTADO»</span>, siendo este el domicilio donde habita <<DEMANDADO_C>> <span class="negrita">C. «ACREDITADO»</span>, y una vez habiendo llamado a la puerta de ese domicilio, al no encontrarlo(a) presente procedimos a pegar en puerta el presente requerimiento de pago <<DEMANDADO_C2>> <span class="negrita">C. «ACREDITADO»</span>, apercibiéndose además de que, en caso de no cumplir con el requerimiento, mi representada ejercitará en su contra las acciones legales que estime pertinentes para lograr la recuperación del adeudo derivado del contrato antes mencionado; haciéndole entrega del requerimiento de pago efectuado, firmando la presente el suscrito y los testigos antes señalados.-'
        ]
      },

      {
        tipo: 'centrado',
        contenido: [
          '<br>',
          '<div style="text-align: center; margin-top: 20px;">',
          '<span class="negrita">LIC. ALFREDO FUENTES CHAVARRÍA</span>',
          '<br><span class="negrita">APODERADO JURIDICO GENERAL PARA PLEITOS Y COBRANZAS</span>',
          '<br><span class="negrita">DEL INSTITUTO DEL FONDO NACIONAL DE LA VIVIENDA PARA LOS TRABAJADORES</span>',
          '</div>',
          '<br><br>'
        ]
      },

      {
        tipo: 'centrado',
        contenido: [
          '<div style="display: flex; justify-content: space-between; margin-top: 30px;">',
          '<div style="text-align: center;">',
          '<span class="negrita">ERNESTO MORALES RAMIREZ</span><br><span class="negrita">TESTIGO</span>',
          '</div>',
          '<div style="text-align: center;">',
          '<span class="negrita">MARIA CRISTINA CRUZ LUNA</span><br><span class="negrita">TESTIGO</span>',
          '</div>',
          '</div>'
        ]
      },

      {
        tipo: 'parrafo', contenido: [
          '<div style="page-break-before: always;"></div>'
        ]
      },

      {
        tipo: 'texto-izquierda',
        contenido: [
          '<div style="display: block; margin-bottom: 5px;">',
          '<span class="negrita subrayado">C. «ACREDITADO»</span>',
          '</div>',
          '<div style="display: block; margin-top: 5px;">',
          '<span class="negrita">CALLE «CALLE», NUMERO «NUMERO»,«TIPO_ASENTAMIENTO» «COLONIA_FRACCIONAMIENTO», «MUNICIPIO», «ESTADO».</span>',
          '</div>'
        ]
      },


      {
        tipo: 'parrafo',
        contenido: [
          'Por medio del presente y en mi carácter de Apoderado General para Pleitos y Cobranzas del <span class="negrita">INSTITUTO DEL FONDO NACIONAL DE LA VIVIENDA PARA LOS TRABAJADORES (INFONAVIT)</span>, según lo acreditado en la copia debidamente certificada del instrumento notarial número <span class="negrita">56,778</span> de fecha <span class="negrita">30 treinta de julio del 2024 dos mil veinticuatro</span> pasada ante la fe del C. Licenciado <span class="negrita">RICARDO VARGAS NAVARRO</span>, Notario Público, número <span class="negrita">88</span>, con ejercicio en Ciudad de México, que al efecto muestro en este momento, y de conformidad con lo estipulado en el contrato que más adelante se detalla, y en virtud de que usted incumplió desde el pago correspondiente al mes de <span class="negrita">«MES_PRIMER_ADEUDO»</span> A <span class="negrita">«MES_ULTIMO_ADEUDO»</span>, con el pago de las amortizaciones pactadas en el contrato que más adelante se señala, le requiero a Usted formalmente a efecto de que liquide de forma inmediata las amortizaciones a capital omisas desde la fecha antes señalada, adeudo que tiene con mi representada, derivado del <span class="negrita">CONTRATO DE APERTURA DE CRÉDITO SIMPLE CON GARANTÍA HIPOTECARIA</span>, mediante <span class="negrita">Escritura Pública</span> número <span class="negrita">«ESCRITURA»</span> (<span class="negrita">«ESCRITURA_FT»</span>) de fecha <span class="negrita">«FECHA_ESCRITURA_FT»</span> e inscrita ante el Registro Público de la Propiedad del Comercio, bajo el número de inscripción <span class="negrita">«INSCRIPCION»</span>, Volumen <span class="negrita">«VOLUMEN»</span>, Libro <span class="negrita">«LIBRO»</span>, Sección <span class="negrita">«SECCION»</span>, Unidad <span class="negrita">«UNIDAD»</span>, <span class="negrita">«ESTADO»</span>, de <span class="negrita">«FECHA_FT»</span>, deuda que consiste en:'
        ]
      },

      {
        tipo: 'parrafo',
        contenido: [
          'El pago en Moneda Nacional (pesos) del equivalente, el cual se deriva de la disposición del crédito efectuada por Usted, conforme a lo establecido en el contrato antes referido. En la inteligencia de que, al día de hoy equivale a la suma <span class="negrita">$«ADEUDO» «ADEUDO_FT»</span>. Más las cantidades que por concepto de interés Ordinario y Moratorios, que se haya generado, de acuerdo a lo establecido en el contrato antes citado.'
        ]
      },

      {
        tipo: 'parrafo',
        contenido: [
          'Se hace de su conocimiento, y se hace la invitación para que acuda a nuestras Instalaciones de Crédito que se citan al pie del presente o de lo contrario comunicarse al teléfono <span class="negrita">8127217785</span> para ver las opciones de pago o si es posible llegar a algún convenio.'
        ]
      },

      {
        tipo: 'parrafo',
        contenido: [
          'En la inteligencia de que se hace de su conocimiento y que se le apercibe de que, en caso de no cumplir con el presente seguimiento, mi representada ejercitará en contra de Usted, las acciones legales que estime pertinentes para lograr la recuperación del adeudo que usted contrajo con el contrato antes mencionado.'
        ]
      },

      {
        tipo: 'parrafo',
        contenido: [
          'El presente requerimiento se efectúa en los términos establecidos en el contrato antes referido.'
        ]
      },

      {
        tipo: 'centrado',
        contenido: [
          '<div style="text-align: center; margin-top: 30px;">',
          '<span class="negrita">«MUNICIPIO», N.L. A «FECHA_REQUERIMIENTO_FT»</span>',
          '</div>',
          '<div style="text-align: center; margin-top: 20px;">',
          '<span class="negrita">LIC. ALFREDO FUENTES CHAVARRÍA</span>',
          '</div>',
          '<div style="text-align: center; margin-top: 10px;">',
          '<span class="negrita">Apoderado Jurídico para Pleitos y Cobranzas del Instituto del</span>',
          '</div>',
          '<div style="text-align: center;">',
          '<span class="negrita">Fondo Nacional de la Vivienda para los Trabajadores.</span>',
          '</div>'
        ]
      },
      {
        tipo: 'parrafo', contenido: [
          '<div style="page-break-before: always;"></div>'
        ]
      },
      {
        tipo: 'parrafo', contenido: [
          '<div style="page-break-before: always;"></div>'
        ]
      },
      {
        tipo: 'justificado',
        contenido: 'PLIEGO DE POSICIONES QUE PRESENTA LA PARTE ACTORA Y QUE DEBERÁ ABSOLVER <<AL_LA_DEMAN>> <span class="negrita">«ACREDITADO»</span> EN EL DESAHOGO DE LA PRUEBA CONFESIONAL POR POSICIONES DENTRO DEL TERMINO PROBATORIO DEL JUICIO ORDINARIO CIVIL QUE SE TRAMITA ANTE ESTE H. JUZGADO.<br><br>'
      },

      {
        tipo: 'alineado-izquierda',
        contenido: '<p style="text-align: left; margin: 0; font-weight: normal;">Solicito se anteponga a cada una de las posiciones calificadas de legal, la siguiente frase:</p>'
      },

      {
        tipo: 'centrado',
        contenido: [
          '<div style="text-align: center; font-weight: bold;">“DIGA EL ABSOLVENTE SI ES CIERTO COMO LO ES”</div>'
        ]
      },

      {
        tipo: 'romanos',
        contenido: [
          '<span class="negrita">I.</span> Que en fecha <span class="negrita">«FECHA_ESCRITURA_FT»</span> celebró contrato de apertura de crédito simple con garantía hipotecaria con el <span class="negrita">INSTITUTO DEL FONDO NACIONAL DE LA VIVIENDA PARA LOS TRABAJADORES</span> mediante su representante legal.'
        ]
      },
      {
        tipo: 'romanos',
        contenido: [
          '<span class="negrita">II.</span> Que mi representada le otorgó un Crédito por la cantidad de $«ADEUDO» «ADEUDO_FT».'
        ]
      },
      {
        tipo: 'romanos',
        contenido: [
          '<span class="negrita">III.</span> Que el crédito otorgado por el <span class="negrita">INSTITUTO DEL FONDO NACIONAL DE LA VIVIENDA PARA LOS TRABAJADORES</span> fue destinado a la adquisición de un <span class="subrayado">INMUEBLE</span>.'
        ]
      },
      {
        tipo: 'romanos',
        contenido: [
          '<span class="negrita">IV.</span> Que el domicilio del inmueble objeto del contrato lo es el ubicado en la <span class="negrita">CALLE «CALLE» NUMERO «NUMERO», «COLONIA_FRACCIONAMIENTO», C.P. «CODIGO_POSTAL», «MUNICIPIO», «ESTADO».</span>'
        ]
      },
      {
        tipo: 'romanos',
        contenido: [
          '<span class="negrita">V.</span> Que se obligó a pagar inicialmente una <span class="subrayado">Tasa de Interés Ordinario del</span> <span class="negrita">«INTERES_ORDINARIO»%.</span>'
        ]
      },
      {
        tipo: 'romanos',
        contenido: [
          '<span class="negrita">VI.</span> Que se obligó a pagar inicialmente una <span class="subrayado">Tasa de Interés Moratorio</span> del <span class="negrita">«INTERES_MORATORIO»%.</span>'
        ]
      },
      {
        tipo: 'romanos',
        contenido: [
          '<span class="negrita">VII.</span> Que el <span class="subrayado">número de crédito</span> que le fue proporcionado al momento de la firma del mencionado contrato es el <span class="negrita">«CREDITO».</span>'
        ]
      },
      {
        tipo: 'romanos',
        contenido: [
          '<span class="negrita">VIII.</span> Que usted se obligó a destinar el importe dispuesto del Crédito Otorgado a la adquisición en propiedad del inmueble que es objeto de la compraventa convenida en el referido contrato.'
        ]
      },
      {
        tipo: 'romanos',
        contenido: [
          '<span «negrita">XI.</span> Que, dentro del mismo contrato, reconoció adeudar y se <span class="negrita">OBLIGÓ A PAGAR</span> el monto del crédito otorgado.'
        ]
      },
      {
        tipo: 'romanos',
        contenido: [
          '<span class="negrita">XII.</span> Que ha sido <span class="subrayado">omiso(a)</span> a pagar las amortizaciones correspondientes a los meses de <span class="negrita">«MES_PRIMER_ADEUDO» hasta «MES_ULTIMO_ADEUDO».</span>'
        ]
      },
      {
        tipo: 'romanos',
        contenido: [
          '<span class="negrita">XIII.</span> Que pese a tener conocimiento del presente procedimiento en su contra, también ha sido <span class="subrayado">omiso(a)</span> a pagar las amortizaciones correspondientes a los meses anteriores <span class="negrita">hasta</span> la celebración de la presente audiencia.'
        ]
      },

      {
        tipo: 'romanos',
        contenido: [
          '<span class="negrita">XIV.</span> Que fue su deseo abrir un Crédito Simple con el <span class="negrita">INSTITUTO DEL FONDO NACIONAL DE LA VIVIENDA PARA LOS TRABAJADORES</span>, y que contaba a la fecha de su firma con plena <span class="subrayado">capacidad de goce y ejercicio</span> para ello.'
        ]
      },

      {
        tipo: 'centrado',
        contenido: [
          '<div style="text-align: center; margin-top: 40px;">',
          '<div style="margin-top: 10px;">Justa y legal es mi solicitud, espero sea proveída de conformidad.</div>',
          '<div style="ma«rgin-top: 5px;">Monterrey, Nuevo León a la fecha de presentación.</div>',
          '<div style="margin-top: 30px; font-weight: bold;">LIC. GERARDO GARCÍA HERNANDEZ</div>'
        ]
      }
    ];
  }

  async generarCodigoBarras(texto) {
    return new Promise((resolve, reject) => {
      bwipjs.toBuffer(
        {
          bcid: 'code128',
          text: String(texto),
          scale: 2,
          height: 7,
          includetext: true,
          textxalign: 'center',
        },
        (err, png) => {
          if (err) {
            return reject(err);
          }
          resolve(png);
        }
      );
    });
  }

  generarContenidoHTML(contenido, data) {
    let puntoVI = false;
    return contenido.map((elemento) => {
      if (elemento.tipo === 'romanos' && elemento.contenido[0].includes('<span class="negrita">VI.-</span>')) {
        if (puntoVI) return '';
        puntoVI = true;
      }
      let texto = this.reemplazarPlaceholders(elemento.contenido, data);
      switch (elemento.tipo) {
        case 'alineado-izquierda':
          return `<p class="alineado-izquierda">${texto}</p>`;
        case 'parrafo':
          return `<p class="parrafo">${texto}</p>`;
        case 'titulo':
          return `<h1 class="titulo">${texto}</h1>`;
        case 'opcion-lista':
          return `<div class="opcion-lista">${texto}</div>`;
        case 'ultimo-parrafo':
          return `<p class="ultimo-parrafo">${texto}</p>`;
        case 'parrafo-pequeno':
          return `<p class="parrafo-pequeno">${texto}</p>`;
        case 'romanos':
          return `<p class="romanos">${texto}</p>`;
        default:
          return `<p>${texto}</p>`;
      }
    }).join('');
  }

  convertirFechaMesAno(fecha) {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const [ano, mes] = fecha.split('-');
    const mesTexto = meses[parseInt(mes, 10) - 1];
    return `${mesTexto} ${ano}`;
  }

  reemplazarPlaceholders(texto, data) {
    const categoria = data.categoria || 'Demandado';
    const municipio = data.municipio || '';
    const unidadReemplazos = {
      'UMI': {
        unidad_m: 'Unidad Mixta Infonavit (UMI)',
        unidad_c: '3,064.62 (tres mil sesenta y cuatro 62/100 M.N.)',
        unidad_b: '$100.81 (CIEN PESOS 81/100 M.N)'
      },
      'UMA': {
        unidad_m: 'Unidad de Medida y Actualización (UMA)',
        unidad_c: '3,300.52 (tres mil trescientos 52/100 M.N.)',
        unidad_b: '$108.57 (CIENTO OCHO PESOS 57/100 M.N.)'
      }
    };
    const municipiosEspeciales = ['Juárez', 'Cadereyta Jiménez', 'Los Ramones'];
    const unidadConfig = municipiosEspeciales.includes(municipio) ? unidadReemplazos['UMI'] : unidadReemplazos['UMA'];
    const reemplazos = {
      "<<DEMANDADO>>": {
        "Demandado": "el demandado",
        "Demandada": "la demandada"
      },
      "<<CONTRA_DE_DEM>>": {
        "Demandado": "contra del demandado",
        "Demandada": "contra de la demandada"
      },
      "<<DEMANDADO_C3>>": {
        "Demandado": "del",
        "Demandada": "de la"
      },
      "<<DEMANDADO_C2>>": {
        "Demandado": "al",
        "Demandada": "a la"
      },
      "<<DEMANDADO_C>>": {
        "Demandado": "el",
        "Demandada": "la"
      },
      "<<CONTRA_DE>>": {
        "Demandado": "contra del ",
        "Demandada": "contra de la "
      },
      "<<AHORA_DEMANDADO>>": {
        "Demandado": "el ahora demandado",
        "Demandada": "la ahora demandada"
      },
      "<<Y_AHORA_DEMANDADO>>": {
        "Demandado": "y el ahora demandado",
        "Demandada": "y la ahora demandada"
      },
      "<<DOMICILIO_DE>>": {
        "Demandado": "en el domicilio del ",
        "Demandada": "en el domicilio de la "
      },
      "<<AL_LA_DEMAN>>": {
        "Demandado": "AL DEMANDADO",
        "Demandada": "A LA DEMANDA"
      },
      "<<UNIDAD_M>>": unidadConfig.unidad_m,
      "<<UNIDAD_C>>": unidadConfig.unidad_c,
      "<<UNIDAD_B>>": unidadConfig.unidad_b
    };

    if (typeof texto === 'string') {
      Object.keys(data).forEach((key) => {
        let valor = data[key] || '';
        if (key === 'mes_primer_adeudo' || key === 'mes_ultimo_adeudo') {
          valor = this.convertirFechaMesAno(valor);
        }
        const placeholder = new RegExp(`«${key.toUpperCase()}»`, 'g');
        texto = texto.replace(placeholder, valor);
      });
      Object.keys(reemplazos).forEach((ph) => {
        const valorCategoria = reemplazos[ph][categoria] || reemplazos[ph];
        const placeholderRegex = new RegExp(ph, 'g');
        texto = texto.replace(placeholderRegex, valorCategoria);
      });

    } else if (Array.isArray(texto)) {
      texto = texto.map((t) => this.reemplazarPlaceholders(t, data)).join(' ');
    }

    return texto;
  }

  async generatePdf() {
    try {
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage();

      const codigoBarrasBuffer = await this.generarCodigoBarras(this.data.credito);
      const codigoBarrasBase64 = codigoBarrasBuffer.toString('base64');
      const logoPath = 'logosji.png';
      const logoBase64 = fs.readFileSync(logoPath).toString('base64');
      const contenidoHTML = this.generarContenidoHTML(this.contenidoDemanda, this.data);

      let htmlTemplate = `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; font-size: 11pt; margin: 0; padding: 1cm 0cm; }
                        .contenido { margin-top: 0cm; }
                        .alineado-izquierda { text-align: left; font-weight: bold; margin: 0; line-height: 1.2; }
                        .alineado-izquierda-sin-negrita { text-align: justify; font-weight: normal; margin: 0; }
                        .parrafo { text-indent: 4cm; margin: 10px 0; text-align: justify; }
                        .titulo { font-weight: bold; font-size: 11pt; text-align: center; margin: 10px 0; }
                        .opcion-lista { margin-left: 2.5cm; text-indent: -0.5cm; margin-bottom: 10px; text-align: justify; }
                        .ultimo-parrafo { margin: 20px 0; text-align: justify; }
                        .parrafo-pequeno { margin-bottom: 10px; text-align: justify; }
                        .romanos { text-indent: 2cm; margin-bottom: 10px; text-align: justify; }
                        .negrita { font-weight: bold; }
                        .subrayado { text-decoration: underline; }
                    </style>
                </head>
                <body>
                    <div class="contenido">
                        ${contenidoHTML}
                    </div>
                </body>
                </html>
            `;

      const headerTemplate = `
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 10px 2.5cm; font-size: 10px;">
                    <img src="data:image/png;base64,${codigoBarrasBase64}" alt="Código de Barras" style="width: 27%; align-self: flex-start; margin-left: 0;" />
                    <img src="data:image/png;base64,${logoBase64}" alt="Logo" style="width: 27%; align-self: flex-end; margin-right: 0;" />
                </div>
            `;
      const footerTemplate = `
                <div style="font-size: 10px; width: 100%; text-align: center; padding: 5px;"></div>
            `;

      await page.setContent(htmlTemplate, { waitUntil: 'domcontentloaded' });

      const pdfBuffer = await page.pdf({
        width: "21.6cm",
        height: "35.6cm",
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: headerTemplate,
        footerTemplate: footerTemplate,
        margin: {
          top: '2.5cm',
          bottom: '1cm',
          left: '2.5cm',
          right: '2.5cm'
        }
      });

      await browser.close();
      return pdfBuffer;
    } catch (error) {
      throw error;
    }
  }


}

export default DemandaIyccPesosPdfService;