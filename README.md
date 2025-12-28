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
AshtonCheyenneWedding/
├── index.html          # Main wedding website
├── admin.html          # Admin dashboard
├── styles.css          # Design system
├── app.js             # Client-side logic
├── server/
│   ├── index.js       # Express server (shared)
│   └── db.js          # Turso/LibSQL database logic
├── api/
│   └── index.js       # Vercel serverless entry point
├── vercel.json        # Vercel routing & security
├── wedding.db         # Local SQLite (for development)
├── package.json
├── .env.example       # Environment template
├── .gitignore
└── README.md
```

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express (Serverless on Vercel)
- **Database**: Turso (LibSQL) for production, SQLite for local dev
- **Security**: Helmet, express-rate-limit, express-validator, CSP headers
- **Hosting**: Vercel

## Deployment

### Deploying to Vercel

1. **Database Setup (Turso)**:
   - Create a database at [Turso](https://turso.tech).
   - Get your `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
   - Use the Turso CLI or UI to upload your initial `wedding.db` if you have existing data.

2. **Vercel Settings**:
   - Push your code to GitHub/GitLab/Bitbucket.
   - Import project in Vercel.
   - Set the following **Environment Variables**:
     - `ADMIN_PASSWORD`: Your dashboard password.
     - `TURSO_DATABASE_URL`: From Turso.
     - `TURSO_AUTH_TOKEN`: From Turso.
     - `NODE_ENV`: `production`.

3. **Deploy**! Vercel will automatically detect the `vercel.json` and `api/` directory.

**Important**: Ensure `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set, or the RSVP system will not work in production!

## License

MIT

---

Made with ❤️ for Ashton & Cheyenne • September 12, 2026
