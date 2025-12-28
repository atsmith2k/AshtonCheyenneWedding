const Database = require('better-sqlite3');
const path = require('path');

// Initialize database
const db = new Database(path.join(__dirname, '..', 'wedding.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
const createTables = () => {
  // Admin codes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_codes (
      code TEXT PRIMARY KEY,
      max_guests INTEGER DEFAULT 2,
      used INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Guests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      attending INTEGER,
      guest_count INTEGER DEFAULT 1,
      message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (code) REFERENCES admin_codes(code)
    )
  `);

  console.log('✓ Database tables created');
};

// Initialize database
createTables();

// Prepared statements for better performance
const statements = {
  // Admin codes
  createCode: db.prepare('INSERT INTO admin_codes (code, max_guests, notes) VALUES (?, ?, ?)'),
  getCode: db.prepare('SELECT * FROM admin_codes WHERE code = ?'),
  getAllCodes: db.prepare('SELECT * FROM admin_codes ORDER BY created_at DESC'),
  markCodeUsed: db.prepare('UPDATE admin_codes SET used = 1 WHERE code = ?'),

  // Guests
  createGuest: db.prepare('INSERT INTO guests (name, code, attending, guest_count, message) VALUES (?, ?, ?, ?, ?)'),
  getGuest: db.prepare('SELECT * FROM guests WHERE code = ?'),
  getAllGuests: db.prepare('SELECT * FROM guests ORDER BY created_at DESC'),
  updateGuest: db.prepare('UPDATE guests SET attending = ?, guest_count = ?, message = ?, updated_at = CURRENT_TIMESTAMP WHERE code = ?'),
  
  // Stats
  getStats: db.prepare(`
    SELECT 
      COUNT(*) as total_codes,
      SUM(used) as used_codes,
      (SELECT COUNT(*) FROM guests WHERE attending = 1) as attending_count,
      (SELECT SUM(guest_count) FROM guests WHERE attending = 1) as total_guests_attending
    FROM admin_codes
  `)
};

module.exports = { db, statements };
