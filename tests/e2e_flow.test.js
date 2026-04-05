import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../server/index.js';
import { client, createTables } from '../server/db.js';

describe('End-to-End User Flows', () => {
    beforeAll(async () => {
        // Use in-memory database for testing to ensure no impact on production data
        await createTables();
    });

    afterAll(async () => {
        if (client) {
            client.close();
        }
    });

    const adminPassword = 'wedding2025';
    let submissionId;
    let generatedRsvpCode;

    // --- FLOW 1: Address Collection ---
    describe('Guest Address Submission Flow', () => {
        it('should allow a guest to submit their address', async () => {
            const response = await request(app)
                .post('/api/address-submit')
                .send({
                    householdName: 'The Miller Family',
                    guestCount: 3,
                    addressLine1: '456 Maple Ave',
                    city: 'Louisville',
                    state: 'KY',
                    zipCode: '40202',
                    dietaryRestrictions: 'None',
                    noteToCouple: 'Cant wait!'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should validate required address fields', async () => {
            const response = await request(app)
                .post('/api/address-submit')
                .send({
                    householdName: '', // Invalid
                    guestCount: 0,      // Invalid
                    addressLine1: 'Test'
                });

            expect(response.status).toBe(400);
        });
    });

    // --- FLOW 2: Admin Management ---
    describe('Admin Management Flow', () => {
        it('should allow admin to view pending address submissions', async () => {
            const response = await request(app)
                .post('/api/admin/address-submissions')
                .send({ password: adminPassword });

            expect(response.status).toBe(200);
            expect(response.body.submissions.length).toBeGreaterThan(0);
            submissionId = response.body.submissions[0].id;
        });

        it('should allow admin to approve a submission and generate an RSVP code', async () => {
            const response = await request(app)
                .post('/api/admin/approve-address')
                .send({ 
                    password: adminPassword,
                    id: submissionId
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.code).toBeDefined();
            generatedRsvpCode = response.body.code;
        });

        it('should allow admin to view stats', async () => {
            const response = await request(app)
                .post('/api/admin/stats')
                .send({ password: adminPassword });

            expect(response.status).toBe(200);
            expect(response.body.stats).toBeDefined();
        });
    });

    // --- FLOW 3: RSVP ---
    describe('Guest RSVP Flow (via generated code)', () => {
        it('should validate the newly generated code', async () => {
            const response = await request(app)
                .post('/api/validate-code')
                .send({ code: generatedRsvpCode });

            expect(response.status).toBe(200);
            expect(response.body.valid).toBe(true);
            // Since it was approved from address sub, a guest record should already exist
            expect(response.body.alreadyUsed).toBe(true); 
            expect(response.body.guest.name).toBe('The Miller Family');
        });

        it('should allow the guest to complete their RSVP', async () => {
            const response = await request(app)
                .post('/api/rsvp')
                .send({
                    code: generatedRsvpCode,
                    name: 'The Miller Family (Updated)',
                    attending: true,
                    guestCount: 2,
                    message: 'Coming for sure!'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    // --- FLOW 4: Security ---
    describe('Security & Access Control', () => {
        it('should reject admin requests with wrong password', async () => {
            const response = await request(app)
                .post('/api/admin/stats')
                .send({ password: 'wrong_password' });

            expect(response.status).toBe(401);
        });

        it('should reject invalid RSVP codes', async () => {
            const response = await request(app)
                .post('/api/validate-code')
                .send({ code: 'NOTREAL' });

            expect(response.body.valid).toBe(false);
        });
    });
});
