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

-- Tabla 'Demandas': Tabla principal que almacena los datos comunes de todas las demandas, independientemente de su tipo.
CREATE TABLE Demandas (
  Credito BIGINT NOT NULL PRIMARY KEY CHECK (CHAR_LENGTH(Credito) = 9),
  Tipo_demanda ENUM('Individual', 'Con consentimiento', 'Conyugal') NOT NULL,
  Template_id INT,
  Acreditado VARCHAR(255),
  Fecha DATE,
  Calle VARCHAR(255),
  Numero VARCHAR(50),
  Colonia_fraccionamiento VARCHAR(255),
  Codigo_postal VARCHAR(10),
  Municipio VARCHAR(255),
  Estado VARCHAR(255),
  FOREIGN KEY (Template_id) REFERENCES templates_demandas (template_id) ON DELETE SET NULL
);

-- Tabla 'Demandas_Individual': Almacena detalles específicos para demandas de tipo 'Individual'.
CREATE TABLE Demandas_Individual (
  Credito BIGINT PRIMARY KEY,
  Subtipo ENUM('Pesos', 'VSMM') NOT NULL,
  Categoria ENUM('Demanda', 'Demandado') NOT NULL,
  Monto_otorgado_pesos DECIMAL(15, 2),
  Monto_otorgado_letra VARCHAR(255),
  Monto_otorgado_vsmm DECIMAL(15, 2),
  Adeudo_pesos DECIMAL(15, 2),
  Adeudo_vsmm DECIMAL(15, 2),
  Adeudo_en_pesos DECIMAL(15, 2),
  FOREIGN KEY (Credito) REFERENCES Demandas(Credito) ON DELETE CASCADE,
  CHECK (Subtipo IS NOT NULL AND Categoria IS NOT NULL)
);

-- Tabla 'Demandas_Con_Consentimiento': Almacena detalles específicos para demandas de tipo 'Con consentimiento'.
CREATE TABLE Demandas_Con_Consentimiento (
  Credito BIGINT PRIMARY KEY,
  Subtipo ENUM('Pesos', 'VSMM') NOT NULL,
  Categoria ENUM('Demanda', 'Demandado') NOT NULL,
  Monto_otorgado_pesos DECIMAL(15, 2),
  Monto_otorgado_letra VARCHAR(255),
  Monto_otorgado_vsmm DECIMAL(15, 2),
  Adeudo_pesos DECIMAL(15, 2),
  Adeudo_vsmm DECIMAL(15, 2),
  Adeudo_en_pesos DECIMAL(15, 2),
  FOREIGN KEY (Credito) REFERENCES Demandas(Credito) ON DELETE CASCADE,
  CHECK (Subtipo IS NOT NULL AND Categoria IS NOT NULL)
);

-- Tabla 'Demandas_Conyugal': Almacena detalles específicos para demandas de tipo 'Conyugal'.
CREATE TABLE Demandas_Conyugal (
  Credito BIGINT PRIMARY KEY,
  Credito_1 BIGINT,
  Credito_2 BIGINT,
  Acreditado_1 VARCHAR(255),
  Acreditado_2 VARCHAR(255),
  Mes_primer_adeudo_1 VARCHAR(50),
  Mes_primer_adeudo_2 VARCHAR(50),
  Mes_ultimo_adeudo_1 VARCHAR(50),
  Mes_ultimo_adeudo_2 VARCHAR(50),
  Adeudo_acreditado_1 DECIMAL(15, 2),
  Adeudo_acreditado_2 DECIMAL(15, 2),
  Adeudo_vsmm_1 DECIMAL(15, 2),
  Adeudo_vsmm_2 DECIMAL(15, 2),
  Adeudo_en_pesos_1 DECIMAL(15, 2),
  Adeudo_en_pesos_2 DECIMAL(15, 2),
  FOREIGN KEY (Credito) REFERENCES Demandas(Credito) ON DELETE CASCADE
);

-- Tabla 'Templates_demandas': Define los templates para demandas con diferentes combinaciones de tipo, subtipo y categoría.
CREATE TABLE Templates_demandas (
  Template_id INT AUTO_INCREMENT PRIMARY KEY,
  Nombre_template VARCHAR(255) NOT NULL,
  Tipo_demanda ENUM('Individual', 'Con consentimiento', 'Conyugal') NOT NULL,
  Subtipo ENUM('Pesos', 'VSMM') NULL,
  Categoria ENUM('Demanda', 'Demandado') NULL,
  Url_template VARCHAR(500),
  CHECK (
    (Tipo_demanda = 'Individual' AND Subtipo IS NOT NULL AND Categoria IS NOT NULL) OR
    (Tipo_demanda = 'Con consentimiento' AND Subtipo IS NOT NULL AND Categoria IS NOT NULL) OR
    (Tipo_demanda = 'Conyugal' AND Subtipo IS NULL AND Categoria IS NULL)
  )
);

-- Tabla 'Demandas_pages': Almacena las páginas de contenido para cada template de demanda.
CREATE TABLE Demandas_pages (
  Page_id INT AUTO_INCREMENT PRIMARY KEY,
  Template_id INT NOT NULL,
  Numero_pagina INT NOT NULL,
  Contenido TEXT NOT NULL,
  FOREIGN KEY (Template_id) REFERENCES Templates_demandas (Template_id)
);
