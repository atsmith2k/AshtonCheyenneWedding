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

    it('Negative: Invalid Code format', async () => {
        const response = await request(app)
            .post('/api/validate-code')
            .send({ code: 'invalid-code!' });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid code format');
    });
});