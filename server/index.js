// Environment variables are loaded from:
// - Local development: Set in your shell or use a .env file with another method
// - Vercel production: Set via Vercel dashboard (Settings > Environment Variables)


const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const { statements } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet for security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'", "https://*.vercel.app"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://vercel.live", "https://*.vercel.app"],
            scriptSrcAttr: ["'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://*.vercel.app"],
            connectSrc: ["'self'", "https://*.vercel.app", "https://*.turso.io"],
        },
    },
}));

// Rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests, please try again later.'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later.'
});

const rsvpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Too many RSVP submissions, please try again later.'
});

const addressLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: 'Too many address submissions, please try again later.'
});

app.use(generalLimiter);

// ============================================
// GENERAL MIDDLEWARE
// ============================================

app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, '../public'), {
    extensions: ['html'],
    index: 'index.html'
}));

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'wedding2025';

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.trim().substring(0, 500);
};

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        environment: process.env.NODE_ENV,
        database: process.env.TURSO_DATABASE_URL ? 'configured' : 'not-configured'
    });
});

// ============================================
// RSVP Routes
// ============================================

app.post('/api/validate-code',
    rsvpLimiter,
    [body('code').isString().trim().isLength({ min: 1, max: 20 }).matches(/^[A-Z0-9]+$/)],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid code format' });
        }

        const { code } = req.body;

        try {
            const adminCode = await statements.getCode(code);

            if (!adminCode) {
                return res.json({ valid: false, message: 'Invalid code' });
            }

            if (adminCode.used) {
                const guest = await statements.getGuest(code);
                return res.json({
                    valid: true,
                    alreadyUsed: true,
                    guest: guest ? {
                        name: guest.name,
                        attending: guest.attending,
                        guest_count: guest.guest_count
                    } : null
                });
            }

            res.json({ valid: true, maxGuests: adminCode.max_guests });
        } catch (error) {
            console.error('Validate code error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

app.post('/api/rsvp',
    rsvpLimiter,
    [
        body('code').isString().trim().isLength({ min: 1, max: 20 }).matches(/^[A-Z0-9]+$/),
        body('name').isString().trim().isLength({ min: 1, max: 200 }),
        body('attending').isBoolean(),
        body('guestCount').optional().isInt({ min: 0, max: 10 }),
        body('message').optional().isString().trim().isLength({ max: 1000 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input data' });
        }

        const { code, name, attending, guestCount, message } = req.body;
        const sanitizedName = sanitizeInput(name);
        const sanitizedMessage = sanitizeInput(message || '');

        try {
            const adminCode = await statements.getCode(code);
            if (!adminCode) {
                return res.status(400).json({ error: 'Invalid code' });
            }

            const existingGuest = await statements.getGuest(code);

            if (existingGuest) {
                await statements.updateGuest(attending ? 1 : 0, guestCount || 1, sanitizedMessage, code);
            } else {
                await statements.createGuest(sanitizedName, code, attending ? 1 : 0, guestCount || 1, sanitizedMessage);
                await statements.markCodeUsed(code);
            }

            res.json({ success: true, message: 'RSVP submitted successfully' });
        } catch (error) {
            console.error('RSVP error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// ============================================
// Admin Routes
// ============================================

app.post('/api/admin/verify',
    authLimiter,
    [body('password').isString().trim().isLength({ min: 1, max: 100 })],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid password format' });
        }

        const { password } = req.body;
        res.json({ authorized: password === ADMIN_PASSWORD });
    }
);

app.post('/api/admin/generate-code',
    authLimiter,
    [
        body('password').isString().trim(),
        body('maxGuests').optional().isInt({ min: 1, max: 20 }),
        body('notes').optional().isString().trim().isLength({ max: 500 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input' });
        }

        const { password, maxGuests, notes } = req.body;

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            const sanitizedNotes = sanitizeInput(notes || '');
            await statements.createCode(code, maxGuests || 2, sanitizedNotes);

            res.json({ success: true, code });
        } catch (error) {
            console.error('Generate code error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

app.post('/api/admin/codes',
    [body('password').isString().trim()],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        const { password } = req.body;

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const codes = await statements.getAllCodes();
            res.json({ codes });
        } catch (error) {
            console.error('Get codes error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

app.post('/api/admin/guests',
    [body('password').isString().trim()],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        const { password } = req.body;

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const guests = await statements.getAllGuests();
            res.json({ guests });
        } catch (error) {
            console.error('Get guests error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

app.post('/api/admin/stats',
    [body('password').isString().trim()],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        const { password } = req.body;

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const stats = await statements.getStats();
            res.json({ stats });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

app.post('/api/admin/bulk-generate',
    authLimiter,
    [
        body('password').isString().trim(),
        body('count').isInt({ min: 1, max: 50 }),
        body('maxGuests').isInt({ min: 1, max: 20 })
    ],
    async (req, res) => {
        const { password, count, maxGuests } = req.body;
        if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

        try {
            const generated = [];
            for (let i = 0; i < count; i++) {
                const code = crypto.randomBytes(4).toString('hex').toUpperCase();
                await statements.createCode(code, maxGuests, `Bulk Generated ${new Date().toLocaleDateString()}`);
                generated.push(code);
            }
            res.json({ success: true, count: generated.length, codes: generated });
        } catch {
            res.status(500).json({ error: 'Server error during bulk generation' });
        }
    }
);

app.post('/api/admin/update-max-guests',
    [body('password').isString().trim(), body('code').isString().trim(), body('maxGuests').isInt({ min: 1, max: 20 })],
    async (req, res) => {
        const { password, code, maxGuests } = req.body;
        if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
        try {
            await statements.updateCodeMaxGuests(code, maxGuests);
            res.json({ success: true });
        } catch { res.status(500).json({ error: 'Failed' }); }
    }
);

app.post('/api/admin/delete-guest',
    [body('password').isString().trim(), body('code').isString().trim()],
    async (req, res) => {
        const { password, code } = req.body;
        if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
        try {
            await statements.deleteGuest(code);
            res.json({ success: true });
        } catch {
            res.status(500).json({ error: 'Failed to delete guest' });
        }
    }
);

app.post('/api/admin/delete-code',
    [body('password').isString().trim(), body('code').isString().trim()],
    async (req, res) => {
        const { password, code } = req.body;
        if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
        try {
            const guest = await statements.getGuest(code);
            if (guest) return res.status(400).json({ error: 'Cannot delete code with active RSVP' });
            await statements.deleteCode(code);
            res.json({ success: true });
        } catch {
            res.status(500).json({ error: 'Failed to delete code' });
        }
    }
);

app.post('/api/admin/update-guest-details',
    [
        body('password').isString().trim(),
        body('code').isString().trim(),
        body('attending').isBoolean(),
        body('guestCount').isInt({ min: 0, max: 10 }),
        body('message').optional().isString().trim()
    ],
    async (req, res) => {
        const { password, code, attending, guestCount, message } = req.body;
        if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
        try {
            const sanitizedMessage = sanitizeInput(message || '');
            await statements.updateGuest(attending ? 1 : 0, guestCount, sanitizedMessage, code);
            res.json({ success: true });
        } catch {
            res.status(500).json({ error: 'Failed to update guest details' });
        }
    }
);

app.post('/api/admin/update-rsvp-full',
    [
        body('password').isString().trim(),
        body('oldCode').isString().trim(),
        body('newCode').isString().trim(),
        body('maxGuests').isInt({ min: 1, max: 20 }),
        body('used').isInt({ min: 0, max: 1 }),
        body('notes').optional().isString().trim(),
        body('guestName').optional().isString().trim(),
        body('attending').optional().isInt({ min: 0, max: 1 }),
        body('guestCount').optional().isInt({ min: 0, max: 20 }),
        body('guestMessage').optional().isString().trim()
    ],
    async (req, res) => {
        const { password, oldCode, newCode, maxGuests, used, notes, guestName, attending, guestCount, guestMessage } = req.body;
        if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

        try {
            // 1. Handle code rename if necessary
            if (oldCode !== newCode) {
                const existing = await statements.getCode(newCode);
                if (existing) return res.status(400).json({ error: 'New code already exists' });
                await statements.renameCode(oldCode, newCode);
            }

            // 2. Update admin code entry
            await statements.updateAdminCodeCompletely(newCode, maxGuests, used, sanitizeInput(notes || ''));

            // 3. Update guest entry if it exists (or if name is provided)
            const guest = await statements.getGuest(newCode);
            if (guest) {
                await statements.updateGuestCompletely(
                    newCode,
                    sanitizeInput(guestName || guest.name),
                    attending !== undefined ? attending : guest.attending,
                    guestCount !== undefined ? guestCount : guest.guest_count,
                    sanitizeInput(guestMessage || guest.message || '')
                );
            } else if (used === 1 && guestName) {
                // If marked as used but no guest record, create one
                await statements.createGuest(
                    sanitizeInput(guestName),
                    newCode,
                    attending || 1,
                    guestCount || 1,
                    sanitizeInput(guestMessage || '')
                );
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Update RSVP Full error:', error);
            res.status(500).json({ error: 'Failed' });
        }
    }
);

app.post('/api/admin/settings',
    [body('password').isString().trim()],
    async (req, res) => {
        const { password } = req.body;
        if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
        try {
            const settings = await statements.getSettings();
            res.json({ settings });
        } catch {
            res.status(500).json({ error: 'Failed to fetch settings' });
        }
    }
);

app.post('/api/admin/update-settings',
    [
        body('password').isString().trim(),
        body('settings').isObject()
    ],
    async (req, res) => {
        const { password, settings } = req.body;
        if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
        try {
            for (const [key, value] of Object.entries(settings)) {
                await statements.updateSetting(key, sanitizeInput(value));
            }
            res.json({ success: true });
        } catch {
            res.status(500).json({ error: 'Failed to update settings' });
        }
    }
);

app.get('/api/settings', async (req, res) => {
    try {
        const settings = await statements.getSettings();
        res.json({ settings });
    } catch {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// ============================================
// Address Submission Routes
// ============================================

app.post('/api/address-submit',
    addressLimiter,
    [
        body('householdName').isString().trim().isLength({ min: 1, max: 200 }),
        body('guestCount').isInt({ min: 1, max: 10 }),
        body('addressLine1').isString().trim().isLength({ min: 1, max: 200 }),
        body('addressLine2').optional().isString().trim().isLength({ max: 200 }),
        body('city').isString().trim().isLength({ min: 1, max: 100 }),
        body('state').isString().trim().isLength({ min: 2, max: 50 }),
        body('zipCode').isString().trim().matches(/^\d{5}(-\d{4})?$/),
        body('dietaryRestrictions').optional().isString().trim().isLength({ max: 500 }),
        body('noteToCouple').optional().isString().trim().isLength({ max: 1000 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input. Please check all fields.' });
        }

        const { householdName, guestCount, addressLine1, addressLine2, city, state, zipCode, dietaryRestrictions, noteToCouple } = req.body;

        try {
            await statements.createAddressSubmission({
                householdName: sanitizeInput(householdName),
                guestCount,
                addressLine1: sanitizeInput(addressLine1),
                addressLine2: sanitizeInput(addressLine2 || ''),
                city: sanitizeInput(city),
                state: sanitizeInput(state),
                zipCode: sanitizeInput(zipCode),
                dietaryRestrictions: sanitizeInput(dietaryRestrictions || ''),
                noteToCouple: sanitizeInput(noteToCouple || '')
            });

            res.json({ success: true, message: 'Thank you! Your address has been submitted successfully.' });
        } catch (error) {
            console.error('Address submission error:', error);
            res.status(500).json({ error: 'Server error. Please try again later.' });
        }
    }
);

app.post('/api/admin/address-submissions',
    [body('password').isString().trim()],
    async (req, res) => {
        const { password } = req.body;
        if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

        try {
            const submissions = await statements.getAllAddressSubmissions();
            const stats = await statements.getAddressStats();
            res.json({ submissions, stats });
        } catch (error) {
            console.error('Get address submissions error:', error);
            res.status(500).json({ error: 'Failed to fetch submissions' });
        }
    }
);

app.post('/api/admin/approve-address',
    [
        body('password').isString().trim(),
        body('id').isInt({ min: 1 })
    ],
    async (req, res) => {
        const { password, id } = req.body;
        if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

        try {
            const submission = await statements.getAddressSubmissionById(id);
            if (!submission) {
                return res.status(404).json({ error: 'Submission not found' });
            }
            if (submission.status !== 'pending') {
                return res.status(400).json({ error: 'Submission has already been reviewed' });
            }

            // Generate RSVP code
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            const notes = `Address: ${submission.household_name}, ${submission.city}, ${submission.state}`;

            // Create admin code
            await statements.createCode(code, submission.guest_count, notes);

            // Create guest list entry with full address submission data
            await statements.createGuestWithAddress({
                name: submission.household_name,
                code: code,
                attending: null, // pending until they RSVP
                guestCount: submission.guest_count,
                message: submission.note_to_couple || '',
                addressLine1: submission.address_line1,
                addressLine2: submission.address_line2,
                city: submission.city,
                state: submission.state,
                zipCode: submission.zip_code,
                dietaryRestrictions: submission.dietary_restrictions
            });

            // Mark code as used since we created a guest entry
            await statements.markCodeUsed(code);

            // Update submission status
            await statements.approveAddressSubmission(id, code);

            res.json({ success: true, code, message: 'Submission approved and RSVP code generated' });
        } catch (error) {
            console.error('Approve address error:', error);
            res.status(500).json({ error: 'Failed to approve submission' });
        }
    }
);

app.post('/api/admin/deny-address',
    [
        body('password').isString().trim(),
        body('id').isInt({ min: 1 })
    ],
    async (req, res) => {
        const { password, id } = req.body;
        if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

        try {
            const submission = await statements.getAddressSubmissionById(id);
            if (!submission) {
                return res.status(404).json({ error: 'Submission not found' });
            }
            if (submission.status !== 'pending') {
                return res.status(400).json({ error: 'Submission has already been reviewed' });
            }

            await statements.denyAddressSubmission(id);

            res.json({ success: true, message: 'Submission denied' });
        } catch (error) {
            console.error('Deny address error:', error);
            res.status(500).json({ error: 'Failed to deny submission' });
        }
    }
);

// Error handling
app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`\n🎉 Wedding Website Server (SECURE)`);
        console.log(`📍 Running on http://localhost:${PORT}`);
        console.log(`🔐 Security: Helmet (CSP relaxed for admin), Rate Limiting, Input Validation`);
        console.log(`🔐 Admin dashboard is protected`);
        if (ADMIN_PASSWORD === 'wedding2025') {
            console.log(`⚠️  Warning: Using default admin password. Change this in production!`);
        }
    });
}

module.exports = app;
