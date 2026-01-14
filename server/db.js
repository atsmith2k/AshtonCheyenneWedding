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

    // Guests table (includes address data for guests migrated from address submissions)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS guests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        attending INTEGER,
        guest_count INTEGER DEFAULT 1,
        message TEXT,
        address_line1 TEXT,
        address_line2 TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        dietary_restrictions TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (code) REFERENCES admin_codes(code)
      )
    `);

    // Add new columns to existing guests table if they don't exist (for migration)
    const columnsToAdd = [
      { name: 'address_line1', type: 'TEXT' },
      { name: 'address_line2', type: 'TEXT' },
      { name: 'city', type: 'TEXT' },
      { name: 'state', type: 'TEXT' },
      { name: 'zip_code', type: 'TEXT' },
      { name: 'dietary_restrictions', type: 'TEXT' }
    ];

    for (const col of columnsToAdd) {
      try {
        await client.execute(`ALTER TABLE guests ADD COLUMN ${col.name} ${col.type}`);
      } catch (e) {
        // Column already exists, ignore
      }
    }

    // Settings table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // Address submissions table for pre-invitation collection
    await client.execute(`
      CREATE TABLE IF NOT EXISTS address_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        household_name TEXT NOT NULL,
        guest_count INTEGER DEFAULT 1,
        address_line1 TEXT NOT NULL,
        address_line2 TEXT,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        zip_code TEXT NOT NULL,
        dietary_restrictions TEXT,
        note_to_couple TEXT,
        status TEXT DEFAULT 'pending',
        generated_code TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TEXT
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

  // Create guest with full address data (for approved address submissions)
  createGuestWithAddress: async (data) => {
    if (!client) throw new Error('Database not connected');
    return client.execute({
      sql: `INSERT INTO guests (name, code, attending, guest_count, message, address_line1, address_line2, city, state, zip_code, dietary_restrictions) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        data.name,
        data.code,
        data.attending,
        data.guestCount,
        data.message,
        data.addressLine1 || '',
        data.addressLine2 || '',
        data.city || '',
        data.state || '',
        data.zipCode || '',
        data.dietaryRestrictions || ''
      ]
    });
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
  },

  // Address Submissions
  createAddressSubmission: async (data) => {
    if (!client) throw new Error('Database not connected');
    return client.execute({
      sql: `INSERT INTO address_submissions (household_name, guest_count, address_line1, address_line2, city, state, zip_code, dietary_restrictions, note_to_couple) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [data.householdName, data.guestCount, data.addressLine1, data.addressLine2 || '', data.city, data.state, data.zipCode, data.dietaryRestrictions || '', data.noteToCouple || '']
    });
  },

  getAllAddressSubmissions: async () => {
    if (!client) throw new Error('Database not connected');
    const rs = await client.execute('SELECT * FROM address_submissions ORDER BY created_at DESC');
    return rs.rows;
  },

  getAddressSubmissionById: async (id) => {
    if (!client) throw new Error('Database not connected');
    const rs = await client.execute({ sql: 'SELECT * FROM address_submissions WHERE id = ?', args: [id] });
    return rs.rows[0];
  },

  approveAddressSubmission: async (id, generatedCode) => {
    if (!client) throw new Error('Database not connected');
    return client.execute({
      sql: 'UPDATE address_submissions SET status = ?, generated_code = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: ['approved', generatedCode, id]
    });
  },

  denyAddressSubmission: async (id) => {
    if (!client) throw new Error('Database not connected');
    return client.execute({
      sql: 'UPDATE address_submissions SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: ['denied', id]
    });
  },

  getAddressStats: async () => {
    if (!client) throw new Error('Database not connected');
    const rs = await client.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END) as denied_count
      FROM address_submissions
    `);
    return rs.rows[0];
  }
};

module.exports = { client, statements };
