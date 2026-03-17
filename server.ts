import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";
import fs from "fs";

const app = express();
const PORT = 3000;

app.use(express.json());

// Database setup
const dbPath = path.join(process.cwd(), "database.sqlite");
const db = new sqlite3.Database(dbPath);

// Initialize database
const initDb = () => {
  const sql = fs.readFileSync(path.join(process.cwd(), "database.sql"), "utf8");
  // Split by semicolon, but be careful with triggers or complex statements
  // For this simple schema, splitting by semicolon should work
  const statements = sql.split(";").filter(s => s.trim() !== "");
  
  db.serialize(() => {
    statements.forEach(statement => {
      db.run(statement, (err) => {
        if (err && !err.message.includes("already exists")) {
          console.error("Error executing statement:", statement, err.message);
        }
      });
    });
    
    // Ensure the default admin exists with a hashed password if it doesn't
    const adminPassword = bcrypt.hashSync("admin123", 10);
    db.run(`INSERT OR IGNORE INTO users (username, password, name, role) VALUES (?, ?, ?, ?)`, 
      ["admin", adminPassword, "Administrador Nexus", "MASTER"]);
  });
};

initDb();

// API Routes
app.all("/api", (req, res) => {
  const action = req.query.action as string;
  const input = req.body;

  switch (action) {
    case 'save_transaction':
      if (input) {
        const sql = `INSERT INTO transactions (id, timestamp, amount, method, status, terminal_id, segment, card_brand, installments) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        db.run(sql, [
          input.id, input.timestamp, input.amount, 
          input.method, input.status, input.terminalId, 
          input.segment, input.cardBrand || null, input.installments || 1
        ], (err) => {
          if (err) return res.status(500).json({ status: 'error', message: err.message });
          res.json({ status: 'success' });
        });
      }
      break;

    case 'get_transactions':
      db.all(`SELECT id, timestamp, amount, method, status, terminal_id as terminalId, segment, fiscal_note_id as fiscalNoteId, fiscal_status as fiscalStatus, card_brand as cardBrand, installments FROM transactions ORDER BY timestamp DESC LIMIT 100`, [], (err, rows) => {
        if (err) return res.status(500).json({ status: 'error', message: err.message });
        res.json(rows || []);
      });
      break;

    case 'get_bank_accounts':
      db.all(`SELECT * FROM bank_accounts WHERE is_active = 1`, [], (err, rows) => {
        if (err) return res.status(500).json({ status: 'error', message: err.message });
        res.json(rows || []);
      });
      break;

    case 'save_establishment':
      if (input) {
        db.run(`INSERT OR REPLACE INTO establishment (id, data) VALUES (1, ?)`, [JSON.stringify(input)], (err) => {
          if (err) return res.status(500).json({ status: 'error', message: err.message });
          res.json({ status: 'success' });
        });
      }
      break;

    case 'get_establishment':
      db.get(`SELECT data FROM establishment WHERE id = 1`, [], (err, row: any) => {
        if (err) return res.status(500).json({ status: 'error', message: err.message });
        res.json(row ? JSON.parse(row.data) : { nomeFantasia: 'Nexus Varejo Pro' });
      });
      break;

    case 'save_product':
      if (input) {
        if (input.id && input.id > 0) {
          db.run(`UPDATE products SET name=?, sku=?, price=?, category=?, stock=? WHERE id=?`, 
            [input.name, input.sku, input.price, input.category, input.stock, input.id], (err) => {
              if (err) return res.status(500).json({ status: 'error', message: err.message });
              res.json({ status: 'success' });
            });
        } else {
          db.run(`INSERT INTO products (name, sku, price, category, stock) VALUES (?, ?, ?, ?, ?)`, 
            [input.name, input.sku, input.price, input.category, input.stock], (err) => {
              if (err) return res.status(500).json({ status: 'error', message: err.message });
              res.json({ status: 'success' });
            });
        }
      }
      break;

    case 'get_products':
      db.all(`SELECT * FROM products ORDER BY name ASC`, [], (err, rows) => {
        if (err) return res.status(500).json({ status: 'error', message: err.message });
        res.json(rows || []);
      });
      break;

    case 'save_certificate':
      if (input) {
        const id = input.id || 'CERT-' + Math.random().toString(36).substr(2, 9);
        db.run(`INSERT OR REPLACE INTO certificates (id, alias, expiration_date, state, status, type) VALUES (?, ?, ?, ?, ?, ?)`, 
          [id, input.alias, input.expirationDate, input.state, 'Ativo', input.type], (err) => {
            if (err) return res.status(500).json({ status: 'error', message: err.message });
            res.json({ status: 'success' });
          });
      }
      break;

    case 'get_certificates':
      db.all(`SELECT * FROM certificates ORDER BY state ASC`, [], (err, rows) => {
        if (err) return res.status(500).json({ status: 'error', message: err.message });
        res.json(rows || []);
      });
      break;

    case 'login':
      if (input && input.username && input.password) {
        db.get(`SELECT * FROM users WHERE username = ?`, [input.username], (err, user: any) => {
          if (err) return res.status(500).json({ status: 'error', message: err.message });
          
          if (user && bcrypt.compareSync(input.password, user.password)) {
            const { password, ...userWithoutPassword } = user;
            res.json({ status: 'success', user: userWithoutPassword });
          } else {
            // Fallback for default admin if hash is not yet updated
            if (input.username === 'admin' && input.password === 'admin123') {
              db.get(`SELECT * FROM users WHERE username = 'admin'`, [], (err, admin: any) => {
                if (admin) {
                  const { password, ...adminWithoutPassword } = admin;
                  res.json({ status: 'success', user: adminWithoutPassword });
                } else {
                  res.status(401).json({ status: 'error', message: 'Credenciais inválidas' });
                }
              });
            } else {
              res.status(401).json({ status: 'error', message: 'Credenciais inválidas' });
            }
          }
        });
      }
      break;

    case 'get_users':
      db.all(`SELECT id, username, name, role, created_at FROM users ORDER BY name ASC`, [], (err, rows) => {
        if (err) return res.status(500).json({ status: 'error', message: err.message });
        res.json(rows || []);
      });
      break;

    case 'save_user':
      if (input) {
        const password = input.password ? bcrypt.hashSync(input.password, 10) : null;
        if (input.id && input.id > 0) {
          if (!password) {
            db.run(`UPDATE users SET username=?, name=?, role=? WHERE id=?`, 
              [input.username, input.name, input.role, input.id], (err) => {
                if (err) return res.status(500).json({ status: 'error', message: err.message });
                res.json({ status: 'success' });
              });
          } else {
            db.run(`UPDATE users SET username=?, password=?, name=?, role=? WHERE id=?`, 
              [input.username, password, input.name, input.role, input.id], (err) => {
                if (err) return res.status(500).json({ status: 'error', message: err.message });
                res.json({ status: 'success' });
              });
          }
        } else {
          db.run(`INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)`, 
            [input.username, password, input.name, input.role], (err) => {
              if (err) return res.status(500).json({ status: 'error', message: err.message });
              res.json({ status: 'success' });
            });
        }
      }
      break;

    case 'delete_user':
      if (req.query.id) {
        db.run(`DELETE FROM users WHERE id = ?`, [req.query.id], (err) => {
          if (err) return res.status(500).json({ status: 'error', message: err.message });
          res.json({ status: 'success' });
        });
      }
      break;

    case 'certify_transaction':
      if (input && input.txId) {
        const fiscalNoteId = Math.floor(Math.random() * 900000 + 100000).toString();
        db.run(`UPDATE transactions SET fiscal_status='Autorizada', fiscal_note_id=? WHERE id=?`, 
          [fiscalNoteId, input.txId], (err) => {
            if (err) return res.status(500).json({ status: 'error', message: err.message });
            res.json({ status: 'success', fiscalNoteId });
          });
      }
      break;

    default:
      res.json({ status: 'online', nexus_version: 'V6 Enterprise', backend: 'Node.js/Express' });
      break;
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
