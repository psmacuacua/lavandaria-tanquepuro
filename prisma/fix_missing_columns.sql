-- ============================================================
-- CORREÇÃO: adiciona as colunas novas usadas por:
--   - repor / alterar password (must_change_password)
--   - emissão de fatura (condicao, sobretaxa)
--   - pipeline de estado do pedido (status_operacional)
-- Corre isto na tua base de dados lavandaria_tanque_puro se as
-- funcionalidades pararam de funcionar depois de atualizar a app.
--
-- Cada bloco está protegido para não rebentar se a coluna já existir.
-- ============================================================

USE lavandaria_tanque_puro;

-- utilizadores.must_change_password
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'utilizadores' AND COLUMN_NAME = 'must_change_password'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE utilizadores ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT TRUE',
  'SELECT "must_change_password já existe, a saltar"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Garante que o admin existente não fica bloqueado a repetir o login
UPDATE utilizadores SET must_change_password = FALSE WHERE username = 'admin';

-- faturas.status_operacional
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faturas' AND COLUMN_NAME = 'status_operacional'
);
SET @sql := IF(@col_exists = 0,
  "ALTER TABLE faturas ADD COLUMN status_operacional ENUM('Pendente','Em Processo','Pronto para Entrega','Entregue','Devolvido') NOT NULL DEFAULT 'Pendente'",
  'SELECT "status_operacional já existe, a saltar"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fatura_itens.condicao
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fatura_itens' AND COLUMN_NAME = 'condicao'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE fatura_itens ADD COLUMN condicao JSON NULL',
  'SELECT "condicao já existe, a saltar"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- fatura_itens.sobretaxa
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fatura_itens' AND COLUMN_NAME = 'sobretaxa'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE fatura_itens ADD COLUMN sobretaxa DECIMAL(10,2) NOT NULL DEFAULT 0',
  'SELECT "sobretaxa já existe, a saltar"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'Correção concluída.' AS resultado;
