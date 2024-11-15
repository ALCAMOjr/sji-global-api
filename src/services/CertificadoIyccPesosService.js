import fs from 'fs';
import puppeteer from 'puppeteer';
import bwipjs from 'bwip-js';

class CertificadoIyccPesosService {
  constructor(data) {
    ['monto_otorgado', 'adeudo', 'adeudo_pesos'].forEach((campo) => {
      if (data[campo] !== null && !isNaN(data[campo])) {
        data[campo] = parseFloat(data[campo].toString());
      }
    });
    this.data = data;
    this.contenidoDemanda = [
      {
        tipo: 'romanos', contenido: [
          'El suscrito, hace constar que en relación al <span class="negrita">Contrato de Apertura de Crédito Simple con Garantía Hipotecaria</span>, con número de crédito <span class="negrita">«CREDITO»</span>, celebrado entre el Instituto del Fondo Nacional de la Vivienda para los Trabajadores con <<DEMANDADO_C>> C. <span class="negrita">«ACREDITADO»</span>, contenido en la <span class="negrita">Escritura Pública número «ESCRITURA» «ESCRITURA_FT»</span> de fecha <span class="negrita">«FECHA_ESCRITURA_FT»</span> e inscrita ante el Registro Público de la Propiedad del Comercio, bajo el número de inscripción <span class="negrita">«INSCRIPCION»</span>, Volumen <span class="negrita">«VOLUMEN»</span>, Libro <span class="negrita">«LIBRO»</span>, Sección <span class="negrita">«SECCION»</span>, Unidad <span class="negrita">«UNIDAD»</span>, <span class="negrita">«ESTADO»</span>, de fecha <span class="negrita">«FECHA_FT»</span>, mediante la cual se otorgó un Crédito por la Cantidad de <span class="negrita">$«MONTO_OTORGADO» («MONTO_OTORGADO_FT»)</span>, mismo que fue dispuesto en su totalidad a la firma del referido contrato y que a la fecha refleja un incumplimiento en el pago de sus obligaciones contraídas en el contrato antes señalado, desde la amortización correspondiente al mes de <span class="negrita">«MES_PRIMER_ADEUDO»</span>. Reflejándose en los registros que obran en el INSTITUTO DEL FONDO NACIONAL DE LA VIVIENDA PARA LOS TRABAJADORES que al mes de <span class="negrita">«MES_ULTIMO_ADEUDO»</span> se muestra un adeudo por concepto de Capital insoluto de <span class="negrita">$«ADEUDO» «ADEUDO_PESOS»</span> en la ciudad de México, más los intereses ordinarios y moratorios devengados y no pagados más los que se continúen devengando hasta la total liquidación.'
        ]
      },

      {
        tipo: 'romanos', contenido: [
          '<span class="negrita">EL PRESENTE DOCUMENTO LO FIRMA EL LIC. RENÉ ALEJANDRO LEÓN LÓPEZ, GERENTE DEL ÁREA DE SERVICIOS JURÍDICOS EN NUEVO LEÓN DEL INSTITUTO DEL FONDO NACIONAL DE LA VIVIENDA PARA LOS TRABAJADORES; CON FUNDAMENTO EN LO DISPUESTO EN LOS ARTICULOS 23 FRACCION I DE LA LEY DEL INSTITUTO DEL FONDO NACIONAL DE LA VIVIENDA PARA LOS TRABAJADORES; 1º, 3º FRACCIÓN VI, 4º FRACCIÓN XVIII Y 19º DEL REGLAMENTO INTERIOR DEL INSTITUTO DEL FONDO NACIONAL DE LA VIVIENDA PARA LOS TRABAJADORES EN MATERIA DE FACULTADES COMO ORGANISMO FISCAL AUTÓNOMO, PUBLICADO EN EL DIARIO OFICIAL DE LA FEDERACIÓN EL 20 DE JUNIO DE 2008, DISPOSICIONES QUE LE FACULTAN PARA CERTIFICAR QUE TODOS LOS DATOS QUE SE IDENTIFICAN EN ESTE DOCUMENTO, COINCIDEN FIELMENTE CON LOS REGISTROS QUE OBRAN EN EL INSTITUTO DEL FONDO NACIONAL DE LA VIVIENDA PARA LOS TRABAJADORES. CERTIFICA Y HACE CONSTAR QUE EL SIGUIENTE DOCUMENTO QUE CONSTA DE UNA FOJA QUE SE TIENE A LA VISTA ES UNA COPIA FIEL Y EXACTA DEL ORIGINAL QUE OBRA EN LOS SISTEMAS OPERATIVOS DE ESTA DELEGACIÓN, A NOMBRE DE <span class="subrayado">«ACREDITADO_2»</span>, CON NÚMERO DE SEGURIDAD SOCIAL «NUMERO_SS».</span>'
        ]
      },

      {
        tipo: 'centrado',
        contenido: [
          '<br>',
          '<div style="text-align: center; margin-top: 40px;">',
          '<span class="negrita">Monterrey N.L., a «MES_ULTIMO_ADEUDO»</span>',
          '</div>',
          '<div style="text-align: center; margin-top: 50px;">',
          '<span class="negrita">LIC. RENÉ ALEJANDRO LEÓN LÓPEZ</span>',
          '<br><span class="negrita">GERENTE DEL ÁREA DE SERVICIOS JURÍDICOS</span>',
          '<br><span class="negrita">DEL INSTITUTO DEL FONDO NACIONAL DE LA VIVIENDA PARA LOS</span>',
          '<br><span class="negrita">TRABAJADORES DELEGACIÓN NUEVO LEÓN.</span>',
          '</div>',
        ]
      },

      {
        tipo: 'alineado-izquierda',
        contenido: [
          '<div style="text-align: left; margin-top: 30px;">',
          '<span class="negrita">FOLIO- «FOLIO»</span>',
          '</div>',
        ]
      },
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
    console.log("Data dentro de generarContenidoHTML:", data);
    console.log("Valor de acreditado:", data.acreditado);
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

  validarYAsignarAcreditado(data, acreditado) {

    if (typeof acreditado !== 'string') {
      console.error('El valor de acreditado debe ser una cadena de texto');
      return;
    }

    data.acreditado_2 = acreditado;

    const indexCon = data.acreditado.indexOf(' CON ');
    if (indexCon !== -1) {
      data.acreditado_2 = data.acreditado.substring(0, indexCon);
    }

    console.log('Valor final de acreditado_2:', data.acreditado_2);
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
      "<<UNIDAD_B>>": unidadConfig.unidad_b,
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

      this.validarYAsignarAcreditado(data, data.acreditado);
      reemplazos['<<ACREDITADO_2>>'] = data.acreditado_2;

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
      const logoPath = 'logoinfonavit.png';
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
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 25px 3.5cm; font-size: 10px;">
                    <img src="data:image/png;base64,${logoBase64}" alt="Logo" style="width: 20%; align-self: flex-end; margin-left: 10;" />
                    <img src="data:image/png;base64,${codigoBarrasBase64}" alt="Código de Barras" style="width: 27%; align-self: flex-start; margin-right: 0;" />
                </div>
            `;
      const footerTemplate = `
                <div style="font-size: 10px; width: 100%; text-align: center; padding: 5px;"></div>
            `;

      await page.setContent(htmlTemplate, { waitUntil: 'domcontentloaded' });

      const pdfBuffer = await page.pdf({
        width: "21.6cm",
        height: "27.94cm",
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: headerTemplate,
        footerTemplate: footerTemplate,
        margin: {
          top: '2.54cm',
          bottom: '2.54cm',
          left: '1.91cm',
          right: '1.91cm'
        }
      });

      await browser.close();
      return pdfBuffer;
    } catch (error) {
      throw error;
    }
  }


}


export default CertificadoIyccPesosService;