const { createClient } = require('@libsql/client');
const path = require('path');

// Initialize database client
const isVercel = process.env.VERCEL === '1';
const url = process.env.TURSO_DATABASE_URL || (isVercel ? "" : `file:${path.join(__dirname, '..', 'wedding.db')}`);
const authToken = process.env.TURSO_AUTH_TOKEN;

if (isVercel && !process.env.TURSO_DATABASE_URL) {
  console.warn('⚠️ TURSO_DATABASE_URL is not set in Vercel environment.');
}

const client = createClient({
  url: url,
  authToken: authToken,
});

// Create tables (Async)
const createTables = async () => {
  try {
    // Admin codes table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS admin_codes (
        code TEXT PRIMARY KEY,
        max_guests INTEGER DEFAULT 2,
        used INTEGER DEFAULT 0,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Guests table
    await client.execute(`
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

    console.log('✓ Database tables verified');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

// Initialize database
createTables();

// Helper functions for better performance/abstraction
const statements = {
  // Admin codes
  createCode: async (code, maxGuests, notes) =>
    client.execute({ sql: 'INSERT INTO admin_codes (code, max_guests, notes) VALUES (?, ?, ?)', args: [code, maxGuests, notes] }),

  getCode: async (code) => {
    const rs = await client.execute({ sql: 'SELECT * FROM admin_codes WHERE code = ?', args: [code] });
    return rs.rows[0];
  },

  getAllCodes: async () => {
    const rs = await client.execute('SELECT * FROM admin_codes ORDER BY created_at DESC');
    return rs.rows;
  },

  markCodeUsed: async (code) =>
    client.execute({ sql: 'UPDATE admin_codes SET used = 1 WHERE code = ?', args: [code] }),

  // Guests
  createGuest: async (name, code, attending, guestCount, message) =>
    client.execute({ sql: 'INSERT INTO guests (name, code, attending, guest_count, message) VALUES (?, ?, ?, ?, ?)', args: [name, code, attending, guestCount, message] }),

  getGuest: async (code) => {
    const rs = await client.execute({ sql: 'SELECT * FROM guests WHERE code = ?', args: [code] });
    return rs.rows[0];
  },

  getAllGuests: async () => {
    const rs = await client.execute('SELECT * FROM guests ORDER BY created_at DESC');
    return rs.rows;
  },

  updateGuest: async (attending, guestCount, message, code) =>
    client.execute({ sql: 'UPDATE guests SET attending = ?, guest_count = ?, message = ?, updated_at = CURRENT_TIMESTAMP WHERE code = ?', args: [attending, guestCount, message, code] }),

  // Stats
  getStats: async () => {
    const rs = await client.execute(`
      SELECT 
        COUNT(*) as total_codes,
        SUM(used) as used_codes,
        (SELECT COUNT(*) FROM guests WHERE attending = 1) as attending_count,
        (SELECT SUM(guest_count) FROM guests WHERE attending = 1) as total_guests_attending
      FROM admin_codes
    `);
    return rs.rows[0];
  }
};

module.exports = { client, statements };
