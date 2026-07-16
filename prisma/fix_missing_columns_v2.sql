-- ============================================================
-- CORREÇÃO v2: adiciona os campos/tabela usados por:
--   - IVA configurável nas faturas (faturas.iva_percentagem, faturas.iva_valor)
--   - Configurações da lavandaria (tabela empresa_config)
-- Corre isto na tua base de dados lavandaria_tanque_puro depois de atualizar a app.
-- Protegido para não rebentar se já tiver sido aplicado antes.
-- ============================================================

USE lavandaria_tanque_puro;

-- faturas.iva_percentagem
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faturas' AND COLUMN_NAME = 'iva_percentagem'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE faturas ADD COLUMN iva_percentagem DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER desconto',
  'SELECT "iva_percentagem já existe, a saltar"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- faturas.iva_valor
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faturas' AND COLUMN_NAME = 'iva_valor'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE faturas ADD COLUMN iva_valor DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER iva_percentagem',
  'SELECT "iva_valor já existe, a saltar"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- tabela empresa_config
SET @tbl_exists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'empresa_config'
);
SET @sql := IF(@tbl_exists = 0,
  'CREATE TABLE empresa_config (
    id INT PRIMARY KEY DEFAULT 1,
    nome VARCHAR(150) NOT NULL DEFAULT ''Lavandaria Tanque Puro'',
    logo_url LONGTEXT NULL,
    nuit VARCHAR(30) NULL,
    email VARCHAR(150) NULL,
    contacto VARCHAR(60) NULL,
    endereco VARCHAR(255) NULL,
    website VARCHAR(150) NULL,
    conta_bancaria VARCHAR(150) NULL,
    iva_ativo BOOLEAN NOT NULL DEFAULT TRUE,
    iva_percentagem DECIMAL(5,2) NOT NULL DEFAULT 16,
    mostrar_nuit BOOLEAN NOT NULL DEFAULT TRUE,
    mostrar_endereco BOOLEAN NOT NULL DEFAULT TRUE,
    mostrar_email BOOLEAN NOT NULL DEFAULT FALSE,
    mostrar_contacto BOOLEAN NOT NULL DEFAULT TRUE,
    mostrar_website BOOLEAN NOT NULL DEFAULT FALSE,
    mostrar_conta_bancaria BOOLEAN NOT NULL DEFAULT FALSE,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB',
  'SELECT "empresa_config já existe, a saltar"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- garante que existe a linha única de configuração
INSERT IGNORE INTO empresa_config (id) VALUES (1);

SELECT 'Correção v2 concluída.' AS resultado;
