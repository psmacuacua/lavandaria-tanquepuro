-- ============================================================
-- CORREÇÃO v3: adiciona os campos usados por:
--   - Cálculo correto do total ao editar a inspeção (fatura_itens.preco_base_unitario)
--   - Portal do cliente (clientes.portal_token)
--   - Sobretaxa configurável e mensagens SMS personalizáveis (empresa_config)
-- Corre isto na tua base de dados lavandaria_tanque_puro depois de atualizar a app.
-- Protegido para não rebentar se já tiver sido aplicado antes.
-- ============================================================

USE lavandaria_tanque_puro;

-- fatura_itens.preco_base_unitario
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fatura_itens' AND COLUMN_NAME = 'preco_base_unitario'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE fatura_itens ADD COLUMN preco_base_unitario DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER quantidade',
  'SELECT "preco_base_unitario já existe, a saltar"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Para faturas já existentes, assume-se que o preço base = preço unitário praticado
-- (não temos como recuperar o preço "de tabela" à data da venda). Isto só afeta a
-- exibição/recalculo de faturas antigas caso a inspeção delas seja editada depois.
UPDATE fatura_itens SET preco_base_unitario = preco_unitario WHERE preco_base_unitario = 0;

-- clientes.portal_token
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'portal_token'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE clientes ADD COLUMN portal_token VARCHAR(64) UNIQUE NULL',
  'SELECT "portal_token já existe, a saltar"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- empresa_config.sobretaxa_mancha_dificil
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'empresa_config' AND COLUMN_NAME = 'sobretaxa_mancha_dificil'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE empresa_config ADD COLUMN sobretaxa_mancha_dificil DECIMAL(10,2) NOT NULL DEFAULT 50 AFTER iva_percentagem',
  'SELECT "sobretaxa_mancha_dificil já existe, a saltar"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- empresa_config.mensagem_pronto / mensagem_portal / mensagem_promocional
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'empresa_config' AND COLUMN_NAME = 'mensagem_pronto'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE empresa_config ADD COLUMN mensagem_pronto TEXT NULL',
  'SELECT "mensagem_pronto já existe, a saltar"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'empresa_config' AND COLUMN_NAME = 'mensagem_portal'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE empresa_config ADD COLUMN mensagem_portal TEXT NULL',
  'SELECT "mensagem_portal já existe, a saltar"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'empresa_config' AND COLUMN_NAME = 'mensagem_promocional'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE empresa_config ADD COLUMN mensagem_promocional TEXT NULL',
  'SELECT "mensagem_promocional já existe, a saltar"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Preenche as mensagens por omissão se ficarem vazias
UPDATE empresa_config SET mensagem_pronto = 'Olá {nome}, a sua roupa na {empresa} está pronta para entrega. Obrigado pela preferência!'
  WHERE mensagem_pronto IS NULL OR mensagem_pronto = '';
UPDATE empresa_config SET mensagem_portal = 'Olá {nome}, veja o estado do seu pedido e as faturas pendentes aqui: {link}'
  WHERE mensagem_portal IS NULL OR mensagem_portal = '';
UPDATE empresa_config SET mensagem_promocional = 'Olá {nome}, aproveite: lave mais de 5 artigos numa só entrega e ganhe desconto especial na {empresa}!'
  WHERE mensagem_promocional IS NULL OR mensagem_promocional = '';

SELECT 'Correção v3 concluída.' AS resultado;
