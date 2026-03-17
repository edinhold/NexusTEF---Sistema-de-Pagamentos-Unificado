# 🏁 NexusTEF V6 - Guia Final de Conexão

Siga estes passos para colocar o sistema online.

## 1. Banco de Dados
- No **XAMPP**, crie o banco `nexustef` e importe o `database.sql`.
- Na **VPS**, crie o banco, o usuário e garanta as permissões:
```sql
CREATE DATABASE nexustef;
CREATE USER 'db_user_vps'@'localhost' IDENTIFIED BY 'vps_password_secure';
GRANT ALL PRIVILEGES ON nexustef.* TO 'db_user_vps'@'localhost';
```

## 2. Configuração de Conexão
Edite o arquivo `config.php` apenas se as suas credenciais de produção forem diferentes do padrão sugerido. O sistema detecta automaticamente se você está rodando no `localhost`.

## 3. Configuração do Apache (VPS Ubuntu 24.04)
Certifique-se de habilitar o `mod_rewrite`:
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```
O arquivo `.htaccess` incluído já protege suas credenciais de banco de dados (`config.php`) de acessos externos via navegador.

## 4. Estrutura de Pastas Recomendada
```text
/var/www/html/nexustef/
├── index.html        (Frontend)
├── index.tsx         (React Entry)
├── api.php           (API Gateway)
├── config.php        (Configurações Sensíveis)
├── Database.php      (Core de Conexão)
├── .htaccess         (Segurança Apache)
└── database.sql      (Backup do Banco)
```

**NexusTEF Enterprise** - Pronto para escalar em qualquer segmento de loja.