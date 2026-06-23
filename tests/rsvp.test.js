import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../server/index.js';
import { client, createTables } from '../server/db.js';

describe('RSVP Flow Integration Tests', () => {
    beforeAll(async () => {
        // Run migrations on the in-memory database
        await createTables();
    });

    afterAll(async () => {
        if (client) {
            client.close();
        }
    });

    let generatedCode;

    it('Admin code generation (POST /api/admin/generate-code)', async () => {
        const response = await request(app)
            .post('/api/admin/generate-code')
            .send({
                password: 'wedding2025',
                maxGuests: 4,
                notes: 'Test generated code'
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.code).toBeDefined();
        generatedCode = response.body.code;
    });

    it('Guest Code Validation (Initial) (POST /api/validate-code)', async () => {
        const response = await request(app)
            .post('/api/validate-code')
            .send({ code: generatedCode });

        expect(response.status).toBe(200);
        expect(response.body.valid).toBe(true);
        expect(response.body.alreadyUsed).toBeUndefined();
        expect(response.body.maxGuests).toBe(4);
    });

    it('Negative: Exceeding maxGuests during RSVP submission', async () => {
        const response = await request(app)
            .post('/api/rsvp')
            .send({
                code: generatedCode,
                name: 'Test Guest',
                attending: true,
                guestCount: 5 // Exceeds maxGuests of 4
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Guest count exceeds maximum allowed');
    });

    it('Guest RSVP Submission (POST /api/rsvp)', async () => {
        const response = await request(app)
            .post('/api/rsvp')
            .send({
                code: generatedCode,
                name: 'Test Guest',
                attending: true,
                guestCount: 2
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    it('Guest Code Validation (Subsequent) (POST /api/validate-code)', async () => {
        const response = await request(app)
            .post('/api/validate-code')
            .send({ code: generatedCode });

        expect(response.status).toBe(200);
        expect(response.body.valid).toBe(true);
        expect(response.body.alreadyUsed).toBe(true);
        expect(response.body.guest.name).toBe('Test Guest');
        expect(response.body.guest.attending).toBe(1);
        expect(response.body.guest.guest_count).toBe(2);
        expect(response.body.maxGuests).toBe(4); // Testing if maxGuests is restored
    });

    it('Guest RSVP Modification - Change Name & Decrease Guest Count', async () => {
        const response = await request(app)
            .post('/api/rsvp')
            .send({
                code: generatedCode,
                name: 'Test Guest Updated',
                attending: true,
                guestCount: 1
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        const validateResponse = await request(app)
            .post('/api/validate-code')
            .send({ code: generatedCode });
            
        expect(validateResponse.body.guest.name).toBe('Test Guest Updated');
        expect(validateResponse.body.guest.guest_count).toBe(1);
    });
    
    it('Guest RSVP Declining', async () => {
        const response = await request(app)
            .post('/api/rsvp')
            .send({
                code: generatedCode,
                name: 'Test Guest Updated',
                attending: false
            });

        expect(response.status).toBe(200);
        
        const validateResponse = await request(app)
            .post('/api/validate-code')
            .send({ code: generatedCode });
            
        expect(validateResponse.body.guest.attending).toBe(0);
        expect(validateResponse.body.guest.guest_count).toBe(0); // Should be 0 when declined
    });

    it('Admin RSVP Update - Change to Pending (-1)', async () => {
        const response = await request(app)
            .post('/api/admin/update-rsvp-full')
            .send({
                password: 'wedding2025',
                oldCode: generatedCode,
                newCode: generatedCode,
                maxGuests: 4,
                used: 1,
                notes: 'Test notes',
                guestName: 'Test Guest Updated',
                attending: -1,
                guestCount: 2,
                guestMessage: 'Testing pending'
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        const validateResponse = await request(app)
            .post('/api/validate-code')
            .send({ code: generatedCode });

        expect(validateResponse.body.guest.attending).toBeNull();
        expect(validateResponse.body.guest.guest_count).toBe(2);
    });

    it('Admin RSVP Update - Change to Attending (1)', async () => {
        const response = await request(app)
            .post('/api/admin/update-rsvp-full')
            .send({
                password: 'wedding2025',
                oldCode: generatedCode,
                newCode: generatedCode,
                maxGuests: 4,
                used: 1,
                notes: 'Test notes',
                guestName: 'Test Guest Updated',
                attending: 1,
                guestCount: 3,
                guestMessage: 'Testing attending'
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        const validateResponse = await request(app)
            .post('/api/validate-code')
            .send({ code: generatedCode });

        expect(validateResponse.body.guest.attending).toBe(1);
        expect(validateResponse.body.guest.guest_count).toBe(3);
    });

    it('Admin Session Persistence - login, auto-authenticate with cookie, and logout', async () => {
        // 1. Login with password -> should receive admin_session cookie
        const loginResponse = await request(app)
            .post('/api/admin/verify')
            .send({ password: 'wedding2025' });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.authorized).toBe(true);
        
        // Assert Set-Cookie header contains admin_session cookie
        const cookies = loginResponse.headers['set-cookie'];
        expect(cookies).toBeDefined();
        const sessionCookie = cookies.find(c => c.includes('admin_session='));
        expect(sessionCookie).toBeDefined();
        expect(sessionCookie).toContain('HttpOnly');
        expect(sessionCookie).toContain('SameSite=Strict');
        
        // Extract session cookie token value
        const cookieValue = sessionCookie.split(';')[0];

        // 2. Call verify with EMPTY body but with the cookie -> should authenticate successfully
        const verifyWithCookieResponse = await request(app)
            .post('/api/admin/verify')
            .set('Cookie', [cookieValue])
            .send({});

        expect(verifyWithCookieResponse.status).toBe(200);
        expect(verifyWithCookieResponse.body.authorized).toBe(true);

        // 3. Call secure endpoint (e.g. get guests) with cookie and no body password -> should work
        const guestsResponse = await request(app)
            .post('/api/admin/guests')
            .set('Cookie', [cookieValue])
            .send({});

        expect(guestsResponse.status).toBe(200);
        expect(guestsResponse.body.guests).toBeDefined();

        // 4. Logout -> should clear cookie
        const logoutResponse = await request(app)
            .post('/api/admin/logout')
            .send({});

        expect(logoutResponse.status).toBe(200);
        expect(logoutResponse.body.success).toBe(true);
        
        const clearedCookies = logoutResponse.headers['set-cookie'];
        expect(clearedCookies).toBeDefined();
        const clearedSessionCookie = clearedCookies.find(c => c.includes('admin_session='));
        expect(clearedSessionCookie).toBeDefined();
        expect(clearedSessionCookie).toContain('Max-Age=0');
    });

    it('Verify stats and analytics metrics (POST /api/admin/stats)', async () => {
        // Fetch stats first
        const initialResponse = await request(app)
            .post('/api/admin/stats')
            .send({ password: 'wedding2025' });

        expect(initialResponse.status).toBe(200);
        expect(initialResponse.body.stats).toBeDefined();
        
        // Create an address submission with dietary restrictions, approve it, and check stats
        const addressSubmission = {
            householdName: 'Stat Test Party',
            guestCount: 2,
            addressLine1: '123 Stat St',
            city: 'Stat City',
            state: 'ST',
            zipCode: '12345',
            dietaryRestrictions: 'Gluten-Free, Vegan',
            noteToCouple: 'Congrats!'
        };
        
        const submitResponse = await request(app)
            .post('/api/address-submit')
            .send(addressSubmission);
            
        expect(submitResponse.status).toBe(200);
        
        // Get submissions to find the ID
        const subsResponse = await request(app)
            .post('/api/admin/address-submissions')
            .send({ password: 'wedding2025' });
            
        const submission = subsResponse.body.submissions.find(s => s.household_name === 'Stat Test Party');
        expect(submission).toBeDefined();
        
        // Approve it (creates guest and code)
        const approveResponse = await request(app)
            .post('/api/admin/approve-address')
            .send({
                password: 'wedding2025',
                id: submission.id,
                maxGuests: 3
            });
            
        expect(approveResponse.status).toBe(200);
        const generatedCodeForTest = approveResponse.body.code;
        
        // Submit RSVP to accept (attending = true)
        const rsvpResponse = await request(app)
            .post('/api/rsvp')
            .send({
                code: generatedCodeForTest,
                name: 'Stat Test Party',
                attending: true,
                guestCount: 2,
                message: 'Looking forward!'
            });
            
        expect(rsvpResponse.status).toBe(200);
        
        // Fetch stats again
        const finalResponse = await request(app)
            .post('/api/admin/stats')
            .send({ password: 'wedding2025' });
            
        const stats = finalResponse.body.stats;
        expect(stats.total_invited).toBeGreaterThanOrEqual(3);
        expect(stats.attending_guests).toBeGreaterThanOrEqual(2);
        expect(stats.dietarySummary).toContainEqual({ restriction: 'Gluten-Free', count: 1 });
        expect(stats.dietarySummary).toContainEqual({ restriction: 'Vegan', count: 1 });
        expect(stats.dietaryDetails.some(d => d.name === 'Stat Test Party' && d.restrictions.includes('Gluten-Free'))).toBe(true);
    });

    it('Negative: Invalid Code format', async () => {
        const response = await request(app)
            .post('/api/validate-code')
            .send({ code: 'invalid-code!' });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid code format');
    });
});