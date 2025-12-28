# Wedding Website - Security Optimized

A beautiful, lightweight, and **secure** wedding website with RSVP functionality.

## Features

- 🎨 **Modern Design**: Beautiful, responsive design with elegant color palette
- 💌 **RSVP System**: Guests can RSVP using unique codes
- 🔐 **Admin Dashboard**: Manage guest lists and generate RSVP codes
- ⚡ **Lightweight**: Minimal dependencies, fast performance
- 📱 **Mobile-Friendly**: Fully responsive design
- 🛡️ **Security Hardened**: Helmet, rate limiting, input validation

## Security Features

✅ **HTTP Security Headers** (Helmet.js)
✅ **Rate Limiting** - Prevents abuse
✅ **Input Validation** - Protects against injection
✅ **Request Size Limits** - Prevents DoS
✅ **Prepared Statements** - SQL injection protection

## Getting Started

### Prerequisites

- Node.js (v14 or higher)

### Installation

1. Install dependencies:
```bash
npm install
```

2. (Optional) Create `.env` file for production:
```bash
cp .env.example .env
# Edit .env and change ADMIN_PASSWORD
```

3. Start the server:
```bash
npm start
```

4. Open your browser to `http://localhost:3000`

## Usage

### For Guests

1. Navigate to the RSVP section
2. Enter your unique RSVP code (from your invitation)
3. Fill out the RSVP form
4. Submit!

### For Admins

1. Go to `/admin.html`
2. Login with admin password (default: `wedding2025`)
3. Generate RSVP codes
4. View guest list and RSVPs
5. Monitor attendance statistics

## Configuration

Environment variables (`.env` file):

- `PORT` - Server port (default: 3000)
- `ADMIN_PASSWORD` - Admin dashboard password (⚠️ **CHANGE IN PRODUCTION**)
- `NODE_ENV` - Environment (production/development)

## File Structure

```
wedding-app/
├── index.html          # Main wedding website
├── admin.html          # Admin dashboard
├── styles.css          # Design system
├── app.js             # Client-side logic
├── server/
│   ├── index.js       # Express server (secured)
│   └── db.js          # Database setup
├── package.json
├── .env.example       # Environment template
├── .gitignore
└── README.md
```

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express
- **Database**: SQLite (better-sqlite3)
- **Security**: Helmet, express-rate-limit, express-validator
- **Other**: nanoid for code generation

## Security Best Practices

1. **Change the admin password** in production
2. Use HTTPS in production
3. Set strong `ADMIN_PASSWORD` environment variable
4. Keep dependencies updated
5. Review rate limits based on expected traffic
6. Monitor logs for suspicious activity

## Rate Limits

- General API: 100 requests per 15 minutes per IP
- Admin login: 5 attempts per 15 minutes per IP  
- RSVP submission: 10 requests per hour per IP

## Deployment

### Recommended Hosts

- **Vercel** / **Netlify**: For static files
- **Railway** / **Render**: For full-stack deployment
- **DigitalOcean** / **AWS**: For custom server deployment

**Important**: Set `ADMIN_PASSWORD` environment variable on your hosting platform!

## License

MIT

---

Made with ❤️ for Ashton & Cheyenne • September 12, 2026
