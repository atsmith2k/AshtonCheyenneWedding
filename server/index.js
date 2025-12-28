const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { nanoid } = require('nanoid');
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

app.use(generalLimiter);

// ============================================
// GENERAL MIDDLEWARE
// ============================================

app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, '../public')));

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'wedding2025';

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.trim().substring(0, 500);
};

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        environment: process.env.NODE_ENV,
        database: !!process.env.TURSO_DATABASE_URL ? 'configured' : 'not-configured'
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
            const code = nanoid(8).toUpperCase();
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
        console.log(`🔑 Admin password: ${ADMIN_PASSWORD}\n`);
    });
}

module.exports = app;
