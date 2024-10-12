CREATE DATABASE railway;

USE railway;

-- Crear la tabla 'abogados'
CREATE TABLE abogados (
    id INT NOT NULL AUTO_INCREMENT,
    username VARCHAR(45) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    cedula VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefono VARCHAR(100) NOT NULL,
    user_type ENUM('coordinador', 'abogado') NOT NULL,
    PRIMARY KEY (id)
);

-- Crear la tabla 'expTribunalA' con 'numero' como clave primaria
CREATE TABLE expTribunalA (
    numero BIGINT NOT NULL PRIMARY KEY,
    nombre VARCHAR(255),
    url VARCHAR(255),
    expediente VARCHAR(255),
    juzgado VARCHAR(255),
    juicio VARCHAR(255),
    ubicacion VARCHAR(255),
    partes TEXT
);

-- Crear la tabla 'expTribunalDetA' con referencia a 'expTribunalA'
CREATE TABLE expTribunalDetA (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ver_acuerdo VARCHAR(50) NULL,
    fecha VARCHAR(20) NULL,
    etapa VARCHAR(50) NULL,
    termino VARCHAR(250) NULL,
    notificacion VARCHAR(250) NULL,
    expediente VARCHAR(50) NULL,
    expTribunalA_numero BIGINT,
    format_fecha DATE NULL,
    FOREIGN KEY (expTribunalA_numero) REFERENCES expTribunalA(numero)
);

-- Crear la tabla 'Tareas' con referencia a 'expTribunalA'
CREATE TABLE Tareas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    abogado_id INT,
    exptribunalA_numero BIGINT NOT NULL,
    tarea TEXT NULL,
    fecha_inicio DATE NULL,  
    fecha_registro DATE NULL,
    fecha_entrega DATE NULL,
    fecha_real_entrega DATE NULL,
    fecha_estimada_respuesta DATE NULL,
    fecha_cancelacion DATE NULL,
    estado_tarea ENUM('Asignada', 'Iniciada', 'Terminada', 'Cancelada') NULL,
    observaciones TEXT NULL,
    FOREIGN KEY (abogado_id) REFERENCES abogados(id),
    FOREIGN KEY (exptribunalA_numero) REFERENCES expTribunalA(numero)
);


-- Crear la tabla 'CreditosSIAL'
CREATE TABLE  CreditosSIAL(
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  num_credito BIGINT NOT NULL,
  estatus VARCHAR(250),
  acreditado VARCHAR(250),
  omisos INT,
  estado VARCHAR(250),
  municipio VARCHAR(250),
  bloquear_gestion_por_estrategia_dual VARCHAR(10),
  calle_y_numero VARCHAR(250),
  fraccionamiento_o_colonia VARCHAR(250),
  codigo_postal VARCHAR(250),
  ultima_etapa_reportada VARCHAR(250),
  fecha_ultima_etapa_reportada VARCHAR(250),
  estatus_ultima_etapa VARCHAR(250),
  macroetapa_aprobada VARCHAR(250),
  ultima_etapa_aprobada VARCHAR(250),
  fecha_ultima_etapa_aprobada VARCHAR(250),
  siguiente_etapa VARCHAR(250),
  despacho VARCHAR(250),
  semaforo VARCHAR(250),
  descorto VARCHAR(250),
  abogado VARCHAR(250),
  expediente VARCHAR(250),
  juzgado VARCHAR(250)
);



CREATE TABLE juzgados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    juzgado VARCHAR(255),
    juspos VARCHAR(10),
    abreviaciones VARCHAR(255),
    busqueda VARCHAR(50),
    selMatCom VARCHAR(50),
    selJuzCom VARCHAR(50),
    SelMatPro VARCHAR(50)
);

CREATE TABLE Filtros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    etapa VARCHAR(255),
    termino VARCHAR(255),
    notificacion VARCHAR(255)
);


CREATE TABLE Demandas (
  CREDITO BIGINT NOT NULL PRIMARY KEY,
  ACREDITADO VARCHAR(255) NOT NULL,
  ESCRITURA VARCHAR(255),
  FECHA_ESCRITURA DATE,
  INSCRIPCION VARCHAR(255),
  VOLUMEN INT,
  LIBRO VARCHAR(255),
  SECCION VARCHAR(255),
  UNIDAD VARCHAR(255),
  FECHA DATE,
  MONTO_OTORGADO DECIMAL(15, 2),
  MES_PRIMER_ADEUDO VARCHAR(50),
  MES_ULTIMO_ADEUDO VARCHAR(50),
  ADEUDO_EN_PESOS DECIMAL(15, 2),
  ADEUDO DECIMAL(15, 2),
  CALLE VARCHAR(255),
  NUMERO VARCHAR(50),
  COLONIA_FRACCIONAMIENTO VARCHAR(255),
  CODIGO_POSTAL VARCHAR(10),
  MUNICIPIO VARCHAR(255),
  ESTADO VARCHAR(255),
  NOMENCLATURA VARCHAR(255),
  INTERES_ORDINARIO DECIMAL(5, 2),
  INTERES_MORATORIO DECIMAL(5, 2),
  JUZGADO VARCHAR(255),
  HORA_REQUERIMIENTO TIME,
  FECHA_REQUERIMIENTO DATE,
  
  -- Campos para el tipo de demanda
  TIPO_DEMANDA ENUM('Individual', 'Con consentimiento', 'Conyugal') NOT NULL,
  SUBTIPO ENUM('Pesos', 'VSMM') NULL,
  CATEGORIA ENUM('Demanda', 'Demandado') NULL,
  
  -- Referencia a la tabla templates_demandas
  template_id INT,
  
  -- Restricción para asegurar consistencia entre TIPO_DEMANDA y subtipos
  CHECK (
    (TIPO_DEMANDA = 'Individual' AND SUBTIPO IS NOT NULL AND CATEGORIA IS NOT NULL) OR
    (TIPO_DEMANDA = 'Con consentimiento' AND SUBTIPO IS NOT NULL AND CATEGORIA IS NOT NULL) OR
    (TIPO_DEMANDA = 'Conyugal' AND SUBTIPO IS NULL AND CATEGORIA IS NULL)
  ),
  
  -- Clave foránea para asociar un template
  FOREIGN KEY (template_id) REFERENCES templates_demandas (template_id) ON DELETE SET NULL
);


CREATE TABLE templates_demandas (
  template_id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_template VARCHAR(255) NOT NULL,
  
  -- Campos de referencia para identificar el tipo de demanda del template
  TIPO_DEMANDA ENUM('Individual', 'Con consentimiento', 'Conyugal') NOT NULL,
  SUBTIPO ENUM('Pesos', 'VSMM') NULL,
  CATEGORIA ENUM('Demanda', 'Demandado') NULL,
  
  -- Restricción para asegurar consistencia en las combinaciones de demanda
  CHECK (
    (TIPO_DEMANDA = 'Individual' AND SUBTIPO IS NOT NULL AND CATEGORIA IS NOT NULL) OR
    (TIPO_DEMANDA = 'Con consentimiento' AND SUBTIPO IS NOT NULL AND CATEGORIA IS NOT NULL) OR
    (TIPO_DEMANDA = 'Conyugal' AND SUBTIPO IS NULL AND CATEGORIA IS NULL)
  )
);



CREATE TABLE demandas_pages (
  page_id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT NOT NULL,
  numero_pagina INT NOT NULL,
  contenido TEXT NOT NULL,
  
  -- Clave foránea para relacionar la página con el template
  FOREIGN KEY (template_id) REFERENCES templates_demandas (template_id) ON DELETE CASCADE
);
