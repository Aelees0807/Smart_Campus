/**
 * Preservation Property Tests
 *
 * Property 2: Preservation — Non-Library and Non-Category-Filter Requests Are Unaffected
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 *
 * These tests observe UNFIXED code behavior and capture it as a baseline.
 * All tests MUST PASS on unfixed code — they confirm the behaviors we must preserve.
 *
 * Observed behaviors on unfixed code:
 *   - GET /api/complaints/all?category=Hostel  → returns only hostel complaints
 *   - GET /api/complaints/all                  → returns all complaints
 *   - GET /api/complaints/all?status=Open      → returns only open complaints
 *   - GET /api/complaints/:studentId           → returns only that student's complaints
 *   - PUT /api/complaints/:id                  → persists the status change
 */

'use strict';

jest.mock('../config/supabase');

const request = require('supertest');
const express = require('express');

// ── Helpers ────────────────────────────────────────────────────────────────

function makeComplaint(overrides = {}) {
    return {
        id: overrides.id || 'c1',
        student_id: overrides.student_id || 'STU001',
        category: overrides.category || 'Hostel',
        description: overrides.description || 'Test complaint',
        status: overrides.status || 'Open',
        created_at: new Date().toISOString(),
        ...overrides,
    };
}

function buildFreshApp() {
    const app = express();
    app.use(express.json());
    const complaintRoutes = require('../routes/complaints');
    app.use('/api', complaintRoutes);
    return app;
}

/**
 * Build a complaints query builder that simulates the UNFIXED backend:
 *  - .eq('category', val)  → case-sensitive exact match (the bug)
 *  - .eq('status', val)    → exact match
 *  - .neq('category', val) → exclude exact match
 *  - .eq('student_id', val) → exact match (used in :studentId route)
 */
function buildComplaintsQueryBuilder(seedComplaints) {
    let filtered = [...seedComplaints];

    const builder = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockImplementation((col, val) => {
            filtered = filtered.filter(c => c[col] === val);
            return builder;
        }),
        neq: jest.fn().mockImplementation((col, val) => {
            filtered = filtered.filter(c => c[col] !== val);
            return builder;
        }),
        ilike: jest.fn().mockImplementation((col, val) => {
            filtered = filtered.filter(c => c[col].toLowerCase() === val.toLowerCase());
            return builder;
        }),
        in: jest.fn().mockReturnThis(),
        then: (resolve) => resolve({ data: filtered, error: null }),
    };
    return builder;
}

function buildUsersQueryBuilder() {
    const builder = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        then: (resolve) => resolve({ data: [], error: null }),
    };
    return builder;
}

/**
 * Build an update query builder for PUT routes.
 * Returns the updated row with the new status applied.
 */
function buildUpdateQueryBuilder(updatedRow) {
    const builder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: (resolve) => resolve({ data: [updatedRow], error: null }),
    };
    return builder;
}

function setupMock(supabaseMock, seedComplaints, updateResult = null) {
    supabaseMock.from.mockImplementation((table) => {
        if (table === 'complaints') {
            // If an updateResult is provided, the next call is an update
            if (updateResult) {
                return buildUpdateQueryBuilder(updateResult);
            }
            return buildComplaintsQueryBuilder(seedComplaints);
        }
        if (table === 'users') {
            return buildUsersQueryBuilder();
        }
        return {};
    });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Preservation — Non-library category filtering (Req 3.1, 3.3)', () => {
    /**
     * For all non-library category values, the handler returns only complaints
     * matching that exact category (case-sensitive, as the unfixed code behaves).
     *
     * Validates: Requirements 3.1, 3.3
     */

    const nonLibraryCategories = ['Hostel', 'Canteen', 'Transport', 'IT', 'Maintenance'];

    nonLibraryCategories.forEach((cat) => {
        test(`category=${cat} returns only ${cat} complaints, excludes others`, async () => {
            jest.resetModules();
            jest.clearAllMocks();

            const supabaseMock = require('../config/supabase');
            const seed = [
                makeComplaint({ id: 'c1', category: cat }),
                makeComplaint({ id: 'c2', category: 'Library' }),
                makeComplaint({ id: 'c3', category: 'Other' }),
            ];
            setupMock(supabaseMock, seed);

            const app = buildFreshApp();
            const res = await request(app).get(`/api/complaints/all?category=${cat}`);

            expect(res.status).toBe(200);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
            res.body.forEach(c => {
                expect(c.category).toBe(cat);
            });
            // Library complaints must NOT appear
            const hasLibrary = res.body.some(c => c.category.toLowerCase() === 'library');
            expect(hasLibrary).toBe(false);
        });
    });
});

describe('Preservation — No category filter returns all complaints (Req 3.3)', () => {
    /**
     * When no category param is provided, all complaints are returned regardless of category.
     *
     * Validates: Requirements 3.3
     */

    test('GET /api/complaints/all with no params returns all complaints', async () => {
        jest.resetModules();
        jest.clearAllMocks();

        const supabaseMock = require('../config/supabase');
        const seed = [
            makeComplaint({ id: 'c1', category: 'Hostel' }),
            makeComplaint({ id: 'c2', category: 'Library' }),
            makeComplaint({ id: 'c3', category: 'Canteen' }),
            makeComplaint({ id: 'c4', category: 'library' }),
        ];
        setupMock(supabaseMock, seed);

        const app = buildFreshApp();
        const res = await request(app).get('/api/complaints/all');

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(4);
    });

    test('GET /api/complaints/all with no params returns empty array when DB is empty', async () => {
        jest.resetModules();
        jest.clearAllMocks();

        const supabaseMock = require('../config/supabase');
        setupMock(supabaseMock, []);

        const app = buildFreshApp();
        const res = await request(app).get('/api/complaints/all');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
});

describe('Preservation — Status filter returns only matching complaints (Req 3.5)', () => {
    /**
     * When a status filter is applied, only complaints with that status are returned.
     *
     * Validates: Requirements 3.5
     */

    test('status=Open returns only open complaints', async () => {
        jest.resetModules();
        jest.clearAllMocks();

        const supabaseMock = require('../config/supabase');
        const seed = [
            makeComplaint({ id: 'c1', status: 'Open', category: 'Hostel' }),
            makeComplaint({ id: 'c2', status: 'Resolved', category: 'Library' }),
            makeComplaint({ id: 'c3', status: 'Open', category: 'Canteen' }),
            makeComplaint({ id: 'c4', status: 'In Progress', category: 'Transport' }),
        ];
        setupMock(supabaseMock, seed);

        const app = buildFreshApp();
        const res = await request(app).get('/api/complaints/all?status=Open');

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        res.body.forEach(c => {
            expect(c.status).toBe('Open');
        });
    });

    test('status=Resolved returns only resolved complaints', async () => {
        jest.resetModules();
        jest.clearAllMocks();

        const supabaseMock = require('../config/supabase');
        const seed = [
            makeComplaint({ id: 'c1', status: 'Open' }),
            makeComplaint({ id: 'c2', status: 'Resolved' }),
            makeComplaint({ id: 'c3', status: 'Resolved' }),
        ];
        setupMock(supabaseMock, seed);

        const app = buildFreshApp();
        const res = await request(app).get('/api/complaints/all?status=Resolved');

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        res.body.forEach(c => {
            expect(c.status).toBe('Resolved');
        });
    });

    test('status filter combined with category filter returns intersection', async () => {
        jest.resetModules();
        jest.clearAllMocks();

        const supabaseMock = require('../config/supabase');
        const seed = [
            makeComplaint({ id: 'c1', category: 'Hostel', status: 'Open' }),
            makeComplaint({ id: 'c2', category: 'Hostel', status: 'Resolved' }),
            makeComplaint({ id: 'c3', category: 'Canteen', status: 'Open' }),
        ];
        setupMock(supabaseMock, seed);

        const app = buildFreshApp();
        const res = await request(app).get('/api/complaints/all?category=Hostel&status=Open');

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].category).toBe('Hostel');
        expect(res.body[0].status).toBe('Open');
    });
});

describe('Preservation — Student-specific route is unaffected (Req 3.4)', () => {
    /**
     * GET /api/complaints/:studentId returns only that student's complaints.
     * This is a separate route and must be unaffected by any changes to /all.
     *
     * Validates: Requirements 3.4
     */

    test('GET /api/complaints/:studentId returns only that student complaints', async () => {
        jest.resetModules();
        jest.clearAllMocks();

        const supabaseMock = require('../config/supabase');
        const seed = [
            makeComplaint({ id: 'c1', student_id: 'STU001', category: 'Library' }),
            makeComplaint({ id: 'c2', student_id: 'STU001', category: 'Hostel' }),
            makeComplaint({ id: 'c3', student_id: 'STU002', category: 'Canteen' }),
        ];
        setupMock(supabaseMock, seed);

        const app = buildFreshApp();
        const res = await request(app).get('/api/complaints/STU001');

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        res.body.forEach(c => {
            expect(c.student_id).toBe('STU001');
        });
    });

    test('GET /api/complaints/:studentId returns empty array for unknown student', async () => {
        jest.resetModules();
        jest.clearAllMocks();

        const supabaseMock = require('../config/supabase');
        const seed = [
            makeComplaint({ id: 'c1', student_id: 'STU001' }),
        ];
        setupMock(supabaseMock, seed);

        const app = buildFreshApp();
        const res = await request(app).get('/api/complaints/STU999');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
});

describe('Preservation — Status update route continues to work (Req 3.2)', () => {
    /**
     * PUT /api/complaints/:id with { status: "Resolved" } persists the status change.
     *
     * Validates: Requirements 3.2
     */

    test('PUT /api/complaints/:id updates status to Resolved', async () => {
        jest.resetModules();
        jest.clearAllMocks();

        const supabaseMock = require('../config/supabase');
        const updatedRow = makeComplaint({ id: 'c1', status: 'Resolved' });

        // For PUT /api/complaints/:id, the route calls .update().eq().select()
        supabaseMock.from.mockImplementation((table) => {
            if (table === 'complaints') {
                return buildUpdateQueryBuilder(updatedRow);
            }
            return {};
        });

        const app = buildFreshApp();
        const res = await request(app)
            .put('/api/complaints/c1')
            .send({ status: 'Resolved' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data[0].status).toBe('Resolved');
    });

    test('PUT /api/complaints/:id/status updates status correctly', async () => {
        jest.resetModules();
        jest.clearAllMocks();

        const supabaseMock = require('../config/supabase');
        const updatedRow = makeComplaint({ id: 'c1', status: 'In Progress' });

        supabaseMock.from.mockImplementation((table) => {
            if (table === 'complaints') {
                return buildUpdateQueryBuilder(updatedRow);
            }
            return {};
        });

        const app = buildFreshApp();
        const res = await request(app)
            .put('/api/complaints/c1/status')
            .send({ status: 'In Progress' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('PUT /api/complaints/:id/status returns 400 when status is missing', async () => {
        jest.resetModules();
        jest.clearAllMocks();

        const supabaseMock = require('../config/supabase');
        supabaseMock.from.mockImplementation(() => ({}));

        const app = buildFreshApp();
        const res = await request(app)
            .put('/api/complaints/c1/status')
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});
