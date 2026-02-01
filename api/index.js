const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Setup
const isVercel = process.env.VERCEL === '1';
let DB_FILE = path.join(__dirname, '../marketplace.db');

if (isVercel) {
    DB_FILE = '/tmp/marketplace.db';
}

// Initialize Database
const initDb = () => {
    const db = new sqlite3.Database(DB_FILE);
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'buyer',
            location TEXT,
            phone TEXT
        )`);

        // Listings Table
        db.run(`CREATE TABLE IF NOT EXISTS listings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            seller_id INTEGER,
            title TEXT,
            category TEXT,
            brand TEXT,
            model TEXT,
            condition TEXT,
            price REAL,
            location TEXT,
            description TEXT,
            status TEXT DEFAULT 'active',
            working_parts TEXT,
            photos TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(seller_id) REFERENCES users(id)
        )`);

        // Buy Requests Table
        db.run(`CREATE TABLE IF NOT EXISTS buy_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            listing_id INTEGER,
            buyer_id INTEGER,
            seller_id INTEGER,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(listing_id) REFERENCES listings(id)
        )`);

        // Default Admin
        db.get("SELECT id FROM users WHERE role='admin'", (err, row) => {
            if (!row) {
                const pwdHash = crypto.createHash('sha256').update('admin123').digest('hex');
                db.run("INSERT INTO users (name, email, password_hash, role, location, phone) VALUES (?, ?, ?, ?, ?, ?)",
                    ['Administrator', 'admin@example.com', pwdHash, 'admin', 'HQ', '0000000000']);
                console.log("Default admin created");
            }
        });
    });
    return db;
};

// Ensure DB exists on Vercel cold start
const db = initDb();

// Helper: Get User from Token
const getUser = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    try {
        const userId = token.split(':')[0];
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM users WHERE id=?", [userId], (err, row) => {
                if (err || !row) resolve(null);
                else resolve(row);
            });
        });
    } catch (e) {
        return null;
    }
};

// --- Routes ---

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, '../frontend')));

// API: Auth Login
app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    const pwdHash = crypto.createHash('sha256').update(password).digest('hex');
    db.get("SELECT * FROM users WHERE email=? AND password_hash=?", [email, pwdHash], (err, row) => {
        if (row) {
            const token = `${row.id}:${crypto.randomBytes(16).toString('hex')}`;
            const { password_hash, ...user } = row;
            res.json({ access_token: token, user });
        } else {
            res.status(401).json({ detail: "Invalid credentials" });
        }
    });
});

// API: Auth Register
app.post('/auth/register', (req, res) => {
    const { name, email, password, role, location, phone } = req.body;
    const pwdHash = crypto.createHash('sha256').update(password).digest('hex');
    const stmt = db.prepare("INSERT INTO users (name, email, password_hash, role, location, phone) VALUES (?, ?, ?, ?, ?, ?)");
    stmt.run([name, email, pwdHash, role, location, phone || ''], function (err) {
        if (err) {
            res.status(400).json({ detail: "Email already exists" });
        } else {
            const token = `${this.lastID}:${crypto.randomBytes(16).toString('hex')}`;
            res.json({ access_token: token, user: { id: this.lastID, name, email, role, location, phone } });
        }
    });
    stmt.finalize();
});

// API: Auth Me
app.get('/auth/me', async (req, res) => {
    const user = await getUser(req);
    if (user) {
        const { password_hash, ...userData } = user;
        res.json(userData);
    } else {
        res.status(401).json({ detail: "Unauthorized" });
    }
});

// API: Get Listings
app.get('/listings/', (req, res) => {
    db.all("SELECT * FROM listings ORDER BY created_at DESC", (err, rows) => {
        const listings = rows.map(l => ({
            ...l,
            photos: JSON.parse(l.photos || '[]')
        }));
        res.json(listings);
    });
});

// API: Create Listing
app.post('/listings/', async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ detail: "Unauthorized" });

    const { title, category, brand, model, condition, price, location, description, working_parts, photos } = req.body;
    db.run(`INSERT INTO listings (seller_id, title, category, brand, model, condition, price, location, description, working_parts, photos)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, title, category, brand, model, condition, price, location, description, working_parts, JSON.stringify(photos)],
        function (err) {
            if (err) res.status(500).json({ detail: err.message });
            else res.json({ id: this.lastID, status: 'active' });
        }
    );
});

// API: Create Request
app.post('/requests/', async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ detail: "Unauthorized" });

    const { listing_id } = req.body;
    db.get("SELECT seller_id FROM listings WHERE id=?", [listing_id], (err, listing) => {
        if (!listing) return res.status(404).json({ detail: "Listing not found" });

        db.run("INSERT INTO buy_requests (listing_id, buyer_id, seller_id) VALUES (?, ?, ?)",
            [listing_id, user.id, listing.seller_id],
            function (err) {
                if (err) res.status(500).json({ detail: err.message });
                else res.json({ id: this.lastID, status: 'pending' });
            }
        );
    });
});

// API: My Requests
app.get('/requests/my-requests', async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ detail: "Unauthorized" });
    db.all("SELECT * FROM buy_requests WHERE buyer_id=?", [user.id], (err, rows) => {
        res.json(rows);
    });
});

// API: Incoming Requests
app.get('/requests/incoming', async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ detail: "Unauthorized" });
    db.all(`SELECT br.*, u.name as buyer_name, u.email as buyer_email, u.phone as buyer_phone, u.location as buyer_location
            FROM buy_requests br
            JOIN users u ON br.buyer_id = u.id
            WHERE br.seller_id=?`, [user.id], (err, rows) => {
        res.json(rows);
    });
});

// API: Accept/Reject Request
app.put('/requests/:id/:action', async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ detail: "Unauthorized" });
    const { id, action } = req.params;
    const status = action === 'accept' ? 'accepted' : 'rejected';

    db.run("UPDATE buy_requests SET status=? WHERE id=?", [status, id], function (err) {
        if (err) res.status(500).json({ detail: err.message });
        else res.json({ id, status });
    });
});

// Catch-all for frontend (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Start Server (Only if not running on Vercel Serverless which exports app)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
