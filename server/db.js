const { createClient } = require('@libsql/client');
const path = require('path');

// Initialize database client
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
const url = process.env.TURSO_DATABASE_URL || (isVercel ? "" : `file:${path.join(__dirname, '..', 'wedding.db')}`);
const authToken = process.env.TURSO_AUTH_TOKEN;

if (isVercel && !process.env.TURSO_DATABASE_URL) {
  console.warn('⚠️ TURSO_DATABASE_URL is not set. Database operations will fail.');
}

const client = url ? createClient({
  url: url,
  authToken: authToken,
}) : null;

// Create tables (Async)
const createTables = async () => {
  if (!client) return;
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

    // Settings table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // Insert default settings if not exists
    await client.execute(`INSERT OR IGNORE INTO settings (key, value) VALUES ('wedding_names', 'Ashton & Cheyenne')`);
    await client.execute(`INSERT OR IGNORE INTO settings (key, value) VALUES ('wedding_date', 'September 12, 2026')`);
    await client.execute(`INSERT OR IGNORE INTO settings (key, value) VALUES ('wedding_location', 'Otisco, Indiana')`);

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
  createCode: async (code, maxGuests, notes) => {
    if (!client) throw new Error('Database not connected');
    return client.execute({ sql: 'INSERT INTO admin_codes (code, max_guests, notes) VALUES (?, ?, ?)', args: [code, maxGuests, notes] });
  },

  getCode: async (code) => {
    if (!client) throw new Error('Database not connected');
    const rs = await client.execute({ sql: 'SELECT * FROM admin_codes WHERE code = ?', args: [code] });
    return rs.rows[0];
  },

  getAllCodes: async () => {
    if (!client) throw new Error('Database not connected');
    const rs = await client.execute('SELECT * FROM admin_codes ORDER BY created_at DESC');
    return rs.rows;
  },

  markCodeUsed: async (code) => {
    if (!client) throw new Error('Database not connected');
    return client.execute({ sql: 'UPDATE admin_codes SET used = 1 WHERE code = ?', args: [code] });
  },

  // Guests
  createGuest: async (name, code, attending, guestCount, message) => {
    if (!client) throw new Error('Database not connected');
    return client.execute({ sql: 'INSERT INTO guests (name, code, attending, guest_count, message) VALUES (?, ?, ?, ?, ?)', args: [name, code, attending, guestCount, message] });
  },

  getGuest: async (code) => {
    if (!client) throw new Error('Database not connected');
    const rs = await client.execute({ sql: 'SELECT * FROM guests WHERE code = ?', args: [code] });
    return rs.rows[0];
  },

  getAllGuests: async () => {
    if (!client) throw new Error('Database not connected');
    const rs = await client.execute('SELECT * FROM guests ORDER BY created_at DESC');
    return rs.rows;
  },

  updateGuest: async (attending, guestCount, message, code) => {
    if (!client) throw new Error('Database not connected');
    return client.execute({ sql: 'UPDATE guests SET attending = ?, guest_count = ?, message = ?, updated_at = CURRENT_TIMESTAMP WHERE code = ?', args: [attending, guestCount, message, code] });
  },

  // Stats
  getStats: async () => {
    if (!client) throw new Error('Database not connected');
    const rs = await client.execute(`
      SELECT 
        COUNT(*) as total_codes,
        SUM(used) as used_codes,
        (SELECT COUNT(*) FROM guests WHERE attending = 1) as attending_count,
        (SELECT SUM(guest_count) FROM guests WHERE attending = 1) as total_guests_attending
      FROM admin_codes
    `);
    return rs.rows[0];
  },

  // Delete/Cleanup
  deleteCode: async (code) => {
    if (!client) throw new Error('Database not connected');
    return client.execute({ sql: 'DELETE FROM admin_codes WHERE code = ?', args: [code] });
  },

  deleteGuest: async (code) => {
    if (!client) throw new Error('Database not connected');
    const rs = await client.execute({ sql: 'DELETE FROM guests WHERE code = ?', args: [code] });
    await client.execute({ sql: 'UPDATE admin_codes SET used = 0 WHERE code = ?', args: [code] });
    return rs;
  },

  updateCodeMaxGuests: async (code, maxGuests) => {
    if (!client) throw new Error('Database not connected');
    return client.execute({ sql: 'UPDATE admin_codes SET max_guests = ? WHERE code = ?', args: [maxGuests, code] });
  },

  updateAdminCodeCompletely: async (code, maxGuests, used, notes) => {
    if (!client) throw new Error('Database not connected');
    return client.execute({
      sql: 'UPDATE admin_codes SET max_guests = ?, used = ?, notes = ? WHERE code = ?',
      args: [maxGuests, used, notes, code]
    });
  },

  updateGuestCompletely: async (code, name, attending, guestCount, message) => {
    if (!client) throw new Error('Database not connected');
    return client.execute({
      sql: 'UPDATE guests SET name = ?, attending = ?, guest_count = ?, message = ?, updated_at = CURRENT_TIMESTAMP WHERE code = ?',
      args: [name, attending, guestCount, message, code]
    });
  },

  renameCode: async (oldCode, newCode) => {
    if (!client) throw new Error('Database not connected');
    // Using multiple statements for the rename to handle both tables
    await client.execute({ sql: 'UPDATE admin_codes SET code = ? WHERE code = ?', args: [newCode, oldCode] });
    await client.execute({ sql: 'UPDATE guests SET code = ? WHERE code = ?', args: [newCode, oldCode] });
  },

  // Settings
  getSettings: async () => {
    if (!client) throw new Error('Database not connected');
    const rs = await client.execute('SELECT * FROM settings');
    const settings = {};
    rs.rows.forEach(row => settings[row.key] = row.value);
    return settings;
  },

  updateSetting: async (key, value) => {
    if (!client) throw new Error('Database not connected');
    return client.execute({ sql: 'UPDATE settings SET value = ? WHERE key = ?', args: [value, key] });
  }
};

module.exports = { client, statements };
