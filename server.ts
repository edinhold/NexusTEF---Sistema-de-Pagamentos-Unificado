import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "fs";

const app = express();
const PORT = 3000;

console.log("NexusTEF Server starting...");
app.use(express.json());

// Database setup
const dbPath = path.join(process.cwd(), "database.sqlite");
const db = new Database(dbPath);

// Initialize database
const initDb = () => {
  console.log("Initializing database...");
  const sql = fs.readFileSync(path.join(process.cwd(), "database.sql"), "utf8");
  // Split by semicolon, but be careful with triggers or complex statements
  // For this simple schema, splitting by semicolon should work
  const statements = sql.split(";").filter(s => s.trim() !== "");
  
  try {
    statements.forEach(statement => {
      if (statement.trim()) {
        db.prepare(statement).run();
      }
    });
    
    // Ensure the default admin exists with a hashed password if it doesn't
    const adminPassword = bcrypt.hashSync("admin123", 10);
    db.prepare(`INSERT OR IGNORE INTO users (username, password, name, role) VALUES (?, ?, ?, ?)`).run(
      "admin", adminPassword, "Administrador Nexus", "MASTER"
    );
    console.log("Database initialized successfully.");
  } catch (err: any) {
    if (!err.message.includes("already exists")) {
      console.error("Error initializing database:", err.message);
    }
  }
};

initDb();

// API Routes
app.all("/api", (req, res) => {
  const action = req.query.action as string;
  const input = req.body;

  switch (action) {
    case 'save_transaction':
      if (input) {
        try {
          const sql = `INSERT INTO transactions (id, timestamp, amount, method, status, terminal_id, segment, card_brand, installments) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          db.prepare(sql).run(
            input.id, input.timestamp, input.amount, 
            input.method, input.status, input.terminalId, 
            input.segment, input.cardBrand || null, input.installments || 1
          );
          res.json({ status: 'success' });
        } catch (err: any) {
          res.status(500).json({ status: 'error', message: err.message });
        }
      }
      break;

    case 'get_transactions':
      try {
        const rows = db.prepare(`SELECT id, timestamp, amount, method, status, terminal_id as terminalId, segment, fiscal_note_id as fiscalNoteId, fiscal_status as fiscalStatus, card_brand as cardBrand, installments FROM transactions ORDER BY timestamp DESC LIMIT 100`).all();
        res.json(rows || []);
      } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
      }
      break;

    case 'get_bank_accounts':
      try {
        const rows = db.prepare(`SELECT * FROM bank_accounts WHERE is_active = 1`).all();
        res.json(rows || []);
      } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
      }
      break;

    case 'save_bank_account':
      if (input) {
        try {
          if (input.id && input.id > 0) {
            db.prepare(`UPDATE bank_accounts SET bank_name=?, account_type=?, balance=? WHERE id=?`).run(
              input.bank_name, input.account_type, input.balance, input.id
            );
          } else {
            db.prepare(`INSERT INTO bank_accounts (bank_name, account_type, balance, last_sync) VALUES (?, ?, ?, datetime('now'))`).run(
              input.bank_name, input.account_type, input.balance
            );
          }
          res.json({ status: 'success' });
        } catch (err: any) {
          res.status(500).json({ status: 'error', message: err.message });
        }
      }
      break;

    case 'save_establishment':
      if (input) {
        try {
          db.prepare(`INSERT OR REPLACE INTO establishment (id, data) VALUES (1, ?)`).run(JSON.stringify(input));
          res.json({ status: 'success' });
        } catch (err: any) {
          res.status(500).json({ status: 'error', message: err.message });
        }
      }
      break;

    case 'get_establishment':
      try {
        const row: any = db.prepare(`SELECT data FROM establishment WHERE id = 1`).get();
        res.json(row ? JSON.parse(row.data) : { nomeFantasia: 'Nexus Varejo Pro' });
      } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
      }
      break;

    case 'save_product':
      if (input) {
        try {
          if (input.id && input.id > 0) {
            db.prepare(`UPDATE products SET name=?, sku=?, price=?, category=?, stock=? WHERE id=?`).run(
              input.name, input.sku, input.price, input.category, input.stock, input.id
            );
          } else {
            db.prepare(`INSERT INTO products (name, sku, price, category, stock) VALUES (?, ?, ?, ?, ?)`).run(
              input.name, input.sku, input.price, input.category, input.stock
            );
          }
          res.json({ status: 'success' });
        } catch (err: any) {
          res.status(500).json({ status: 'error', message: err.message });
        }
      }
      break;

    case 'get_products':
      try {
        const rows = db.prepare(`SELECT * FROM products ORDER BY name ASC`).all();
        res.json(rows || []);
      } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
      }
      break;

    case 'save_certificate':
      if (input) {
        try {
          const id = input.id || 'CERT-' + Math.random().toString(36).substr(2, 9);
          db.prepare(`INSERT OR REPLACE INTO certificates (id, alias, expiration_date, state, status, type) VALUES (?, ?, ?, ?, ?, ?)`).run(
            id, input.alias, input.expirationDate, input.state, 'Ativo', input.type
          );
          res.json({ status: 'success' });
        } catch (err: any) {
          res.status(500).json({ status: 'error', message: err.message });
        }
      }
      break;

    case 'get_certificates':
      try {
        const rows = db.prepare(`SELECT * FROM certificates ORDER BY state ASC`).all();
        res.json(rows || []);
      } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
      }
      break;

    case 'login':
      if (input && input.username && input.password) {
        try {
          const user: any = db.prepare(`SELECT * FROM users WHERE username = ?`).get(input.username);
          
          if (user && bcrypt.compareSync(input.password, user.password)) {
            const { password, ...userWithoutPassword } = user;
            res.json({ status: 'success', user: userWithoutPassword });
          } else {
            // Fallback for default admin if hash is not yet updated
            if (input.username === 'admin' && input.password === 'admin123') {
              const admin: any = db.prepare(`SELECT * FROM users WHERE username = 'admin'`).get();
              if (admin) {
                const { password, ...adminWithoutPassword } = admin;
                res.json({ status: 'success', user: adminWithoutPassword });
              } else {
                res.status(401).json({ status: 'error', message: 'Credenciais inválidas' });
              }
            } else {
              res.status(401).json({ status: 'error', message: 'Credenciais inválidas' });
            }
          }
        } catch (err: any) {
          res.status(500).json({ status: 'error', message: err.message });
        }
      }
      break;

    case 'get_users':
      try {
        const rows = db.prepare(`SELECT id, username, name, role, created_at FROM users ORDER BY name ASC`).all();
        res.json(rows || []);
      } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
      }
      break;

    case 'save_user':
      if (input) {
        try {
          const password = input.password ? bcrypt.hashSync(input.password, 10) : null;
          if (input.id && input.id > 0) {
            if (!password) {
              db.prepare(`UPDATE users SET username=?, name=?, role=? WHERE id=?`).run(
                input.username, input.name, input.role, input.id
              );
            } else {
              db.prepare(`UPDATE users SET username=?, password=?, name=?, role=? WHERE id=?`).run(
                input.username, password, input.name, input.role, input.id
              );
            }
          } else {
            db.prepare(`INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)`).run(
              input.username, password, input.name, input.role
            );
          }
          res.json({ status: 'success' });
        } catch (err: any) {
          res.status(500).json({ status: 'error', message: err.message });
        }
      }
      break;

    case 'delete_user':
      if (req.query.id) {
        try {
          db.prepare(`DELETE FROM users WHERE id = ?`).run(req.query.id);
          res.json({ status: 'success' });
        } catch (err: any) {
          res.status(500).json({ status: 'error', message: err.message });
        }
      }
      break;

    case 'delete_transaction':
      if (req.query.id) {
        try {
          db.prepare(`DELETE FROM transactions WHERE id = ?`).run(req.query.id);
          res.json({ status: 'success' });
        } catch (err: any) {
          res.status(500).json({ status: 'error', message: err.message });
        }
      }
      break;

    case 'delete_bank_account':
      if (req.query.id) {
        try {
          db.prepare(`DELETE FROM bank_accounts WHERE id = ?`).run(req.query.id);
          res.json({ status: 'success' });
        } catch (err: any) {
          res.status(500).json({ status: 'error', message: err.message });
        }
      }
      break;

    case 'delete_product':
      if (req.query.id) {
        try {
          db.prepare(`DELETE FROM products WHERE id = ?`).run(req.query.id);
          res.json({ status: 'success' });
        } catch (err: any) {
          res.status(500).json({ status: 'error', message: err.message });
        }
      }
      break;

    case 'delete_certificate':
      if (req.query.id) {
        try {
          db.prepare(`DELETE FROM certificates WHERE id = ?`).run(req.query.id);
          res.json({ status: 'success' });
        } catch (err: any) {
          res.status(500).json({ status: 'error', message: err.message });
        }
      }
      break;

    case 'certify_transaction':
      if (input && input.txId) {
        try {
          const fiscalNoteId = Math.floor(Math.random() * 900000 + 100000).toString();
          db.prepare(`UPDATE transactions SET fiscal_status='Autorizada', fiscal_note_id=? WHERE id=?`).run(
            fiscalNoteId, input.txId
          );
          res.json({ status: 'success', fiscalNoteId });
        } catch (err: any) {
          res.status(500).json({ status: 'error', message: err.message });
        }
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
    console.log("Vite middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NexusTEF Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
