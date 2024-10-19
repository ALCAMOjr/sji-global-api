CREATE DATABASE railway;

USE railway;

-- Tabla 'abogados': Almacena información sobre los abogados, como sus credenciales, detalles de contacto y tipo de usuario.
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

-- Tabla 'expTribunalA': Almacena datos sobre expedientes del Tribunal A, con 'numero' como clave primaria.
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

-- Tabla 'expTribunalDetA': Almacena detalles adicionales de los expedientes del Tribunal A, con relación a 'expTribunalA'.
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

-- Tabla 'Tareas': Almacena tareas asignadas a abogados, relacionadas con los expedientes del Tribunal A.
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

-- Tabla 'CreditosSIAL': Almacena información sobre créditos en el sistema SIAL, incluyendo detalles del estado y ubicación.
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

-- Tabla 'juzgados': Almacena información sobre juzgados, incluyendo abreviaturas y detalles de ubicación.
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

-- Tabla 'Filtros': Contiene filtros definidos para la búsqueda de términos, notificaciones, y etapas en el proceso.
CREATE TABLE Filtros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    etapa VARCHAR(255),
    termino VARCHAR(255),
    notificacion VARCHAR(255)
);

CREATE TABLE Templates_iycc (
  template_id INT AUTO_INCREMENT PRIMARY KEY,
  subtipo ENUM('Pesos', 'VSSM') NOT NULL,
  nombre_template VARCHAR(255) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  url_template VARCHAR(500)
);

CREATE TABLE Demandas_pages_iycc (
  page_id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT NOT NULL,
  numero_pagina INT NOT NULL,
  contenido TEXT NOT NULL,
  FOREIGN KEY (template_id) REFERENCES Templates_iycc(template_id)
);


CREATE TABLE Demandas_iycc (
  credito BIGINT PRIMARY KEY,
  subtipo ENUM('Pesos', 'VSSM') NOT NULL, 
  template_id INT,
  acreditado VARCHAR(255),
  categoria ENUM('Demandada', 'Demandado') NOT NULL, 
  escritura DECIMAL(15, 2),
  escritura_ft VARCHAR(255), 
  fecha DATE,
  fecha_ft VARCHAR(255), 
  inscripcion INT,
  volumen INT,
  libro INT,
  seccion VARCHAR(255),
  unidad VARCHAR(255),
  fecha1 DATE,
  fecha1_ft VARCHAR(255), 
  monto_otorgado DECIMAL(15, 2),
  monto_otorgado_ft VARCHAR(255), 
  mes_primer_adeudo VARCHAR(50),
  mes_ultimo_adeudo VARCHAR(50),
  adeudo DECIMAL(15, 2),
  adeudo_ft VARCHAR(255), 
  calle VARCHAR(255),
  numero VARCHAR(50),
  colonia_fraccionamiento VARCHAR(255),
  municipio VARCHAR(255),
  estado VARCHAR(255),
  codigo_postal VARCHAR(10),
  interes_ordinario DECIMAL(5, 2),
  interes_moratorio DECIMAL(5, 2),
  juzgado VARCHAR(255),
  hora_requerimiento TIME,
  fecha_requerimiento DATE,
  fecha_requerimiento_ft VARCHAR(255), 
  FOREIGN KEY (template_id) REFERENCES Templates_iycc(template_id)
);
