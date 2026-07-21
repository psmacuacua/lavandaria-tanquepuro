-- ============================================================
-- CORREÇÃO v4: adiciona o rastreio de quem criou/actualizou cada artigo,
-- usado no resumo de actividade por utilizador (Utilizadores → clicar num nome).
-- Corre isto na tua base de dados lavandaria_tanque_puro depois de actualizar a app.
-- Protegido para não rebentar se já tiver sido aplicado antes.
-- ============================================================

USE lavandaria_tanque_puro;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'artigos' AND COLUMN_NAME = 'criado_por_id'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE artigos ADD COLUMN criado_por_id INT NULL AFTER disponivel, ADD FOREIGN KEY (criado_por_id) REFERENCES utilizadores(id)',
  'SELECT "criado_por_id já existe, a saltar"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'artigos' AND COLUMN_NAME = 'criado_em'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE artigos ADD COLUMN criado_em DATETIME DEFAULT CURRENT_TIMESTAMP AFTER criado_por_id',
  'SELECT "criado_em já existe, a saltar"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'artigos' AND COLUMN_NAME = 'atualizado_por_id'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE artigos ADD COLUMN atualizado_por_id INT NULL AFTER criado_em, ADD FOREIGN KEY (atualizado_por_id) REFERENCES utilizadores(id)',
  'SELECT "atualizado_por_id já existe, a saltar"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'artigos' AND COLUMN_NAME = 'atualizado_em'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE artigos ADD COLUMN atualizado_em DATETIME NULL ON UPDATE CURRENT_TIMESTAMP AFTER atualizado_por_id',
  'SELECT "atualizado_em já existe, a saltar"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'Correção v4 concluída.' AS resultado;
