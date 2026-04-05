import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../server/index.js';
import { client, createTables } from '../server/db.js';

describe('Concurrency Tests', () => {
    beforeAll(async () => {
        await createTables();
    });

    afterAll(async () => {
        if (client) {
            client.close();
        }
    });

    it('handles multiple concurrent RSVP requests for the same code', async () => {
        // 1. Generate a code
        const genResponse = await request(app)
            .post('/api/admin/generate-code')
            .send({
                password: 'wedding2025',
                maxGuests: 5,
                notes: 'Concurrency Test'
            });
        
        const code = genResponse.body.code;
        expect(code).toBeDefined();

        // 2. Simulate 10 concurrent RSVP requests
        const requests = Array.from({ length: 10 }).map((_, i) => {
            return request(app)
                .post('/api/rsvp')
                .send({
                    code: code,
                    name: `Guest ${i}`,
                    attending: true,
                    guestCount: 2,
                    message: `Message from guest ${i}`
                });
        });

        const responses = await Promise.all(requests);

        // All should succeed because of UPSERT
        responses.forEach(res => {
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        // 3. Verify the final state (should be one of the guests, doesn't matter which one as long as it's consistent)
        const validateResponse = await request(app)
            .post('/api/validate-code')
            .send({ code: code });

        expect(validateResponse.status).toBe(200);
        expect(validateResponse.body.valid).toBe(true);
        expect(validateResponse.body.alreadyUsed).toBe(true);
        expect(validateResponse.body.guest).toBeDefined();
        expect(validateResponse.body.guest.name).toMatch(/Guest \d/);
    });

    it('handles concurrent code validation requests', async () => {
        const genResponse = await request(app)
            .post('/api/admin/generate-code')
            .send({
                password: 'wedding2025',
                maxGuests: 2,
                notes: 'Concurrency Test 2'
            });
        
        const code = genResponse.body.code;

        const requests = Array.from({ length: 10 }).map(() => {
            return request(app)
                .post('/api/validate-code')
                .send({ code: code });
        });

        const responses = await Promise.all(requests);

        responses.forEach(res => {
            expect(res.status).toBe(200);
            expect(res.body.valid).toBe(true);
        });
    });
});
