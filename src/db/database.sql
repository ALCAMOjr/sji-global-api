CREATE DATABASE Tribunal;

USE Tribunal;

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
CREATE TABLE CreditosSIAL (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  num_credito BIGINT NOT NULL,
  estatus VARCHAR(250),
  acreditado VARCHAR(250),
  omisos INT,
  estado VARCHAR(250),
  municipio VARCHAR(250),
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

-- Crear la tabla 'EtapasTv'
CREATE TABLE EtapasTv (
    etapa VARCHAR(50) NULL,
    termino VARCHAR(250) NULL,
    notificacion VARCHAR(250) NULL,
    macroetapa VARCHAR(250) NULL
);

LOAD DATA INFILE '/var/lib/mysql-files/etapasTV.csv'
INTO TABLE EtapasTv
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(etapa, termino, notificacion, macroetapa);

