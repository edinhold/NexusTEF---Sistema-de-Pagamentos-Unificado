
-- NexusTEF Database Schema V17 - Full Enterprise (SQLite Compatible)

-- Configurações Fiscais
CREATE TABLE IF NOT EXISTS fiscal_config (
    id INTEGER PRIMARY KEY,
    data TEXT NOT NULL
);

-- Dados do Estabelecimento
CREATE TABLE IF NOT EXISTS establishment (
    id INTEGER PRIMARY KEY,
    data TEXT NOT NULL
);

-- Transações TEF
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    method TEXT NOT NULL,
    status TEXT NOT NULL,
    terminal_id TEXT,
    segment TEXT,
    fiscal_note_id TEXT,
    fiscal_status TEXT,
    card_brand TEXT,
    installments INTEGER DEFAULT 1
);

-- Certificados Digitais
CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    alias TEXT NOT NULL,
    expiration_date DATE NOT NULL,
    state CHAR(2) NOT NULL,
    status TEXT NOT NULL,
    type TEXT NOT NULL
);

-- Produtos
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Integração Bancária (Contas Vinculadas)
CREATE TABLE IF NOT EXISTS bank_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_name TEXT NOT NULL,
    account_type TEXT,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    last_sync DATETIME,
    is_active BOOLEAN DEFAULT TRUE
);

-- Usuários e Funcionários
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserção de dados iniciais para demonstração
INSERT OR IGNORE INTO bank_accounts (bank_name, account_type, balance, last_sync) VALUES
('Itaú Unibanco', 'Corrente', 15420.50, datetime('now')),
('Nubank', 'Pagamentos', 4200.00, datetime('now')),
('Banco do Brasil', 'Corrente', 890.30, datetime('now')),
('Bradesco', 'PJ', 32000.00, datetime('now')),
('Santander', 'Giro', 1250.00, datetime('now'));

-- Inserção de usuário admin padrão (senha: admin123)
-- Nota: O hash será gerado pelo server.ts na inicialização se não existir
INSERT OR IGNORE INTO users (username, password, name, role) VALUES
('admin', '$2y$10$8.0P6.8G.8G.8G.8G.8G.8G.8G.8G.8G.8G.8G.8G.8G.8G.8G.8G', 'Administrador Nexus', 'MASTER');

INSERT OR IGNORE INTO certificates (id, alias, expiration_date, state, status, type) VALUES
('CERT-MT-01', 'Certificado MT Matriz', '2026-12-31', 'MT', 'Ativo', 'A1');

INSERT OR IGNORE INTO establishment (id, data) VALUES (1, '{"razaoSocial":"Nexus Tech LTDA","nomeFantasia":"Nexus Varejo Pro","cnpj":"12.345.678/0001-99","endereco":"Av. Hist. Rubens de Mendonça, Cuiabá - MT","telefone":"(65) 9999-9999","email":"contato@nexus.com"}');
