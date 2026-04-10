/**
 * Bug Condition Exploration Test
 *
 * Property 1: Case-Sensitive Category Filter Returns Empty Results
 *
 * Validates: Requirements 1.1, 1.2, 1.3
 *
 * CRITICAL: This test MUST FAIL on unfixed code.
 * Failure confirms the bug exists — the `.eq('category', category)` filter
 * silently excludes complaints whose stored category differs in casing from
 * the query parameter.
 *
 * Three concrete failing cases:
 *   1. DB stores "library" (lowercase), request sends category=Library → expect non-empty
 *   2. DB stores "LIBRARY" (uppercase), request sends category=Library → expect non-empty
 *   3. DB stores "Library" (title-case), request sends category=library (lowercase) → expect non-empty
 */

'use strict';

// ── Mock the Supabase module BEFORE requiring the app ──────────────────────
jest.mock('../config/supabase');

const request = require('supertest');
const express = require('express');

// We load the router fresh for each test group so the mock is in place
function buildApp() {
    const app = express();
    app.use(express.json());
    // Re-require to pick up the mock
    const complaintRoutes = require('../routes/complaints');
    app.use('/api', complaintRoutes);
    return app;
}

// Helper: build a minimal complaint row with the given stored category
function makeComplaint(storedCategory) {
    return {
        id: 'c1',
        student_id: 'STU001',
        category: storedCategory,
        description: 'Test complaint',
        status: 'Open',
        created_at: new Date().toISOString(),
    };
}

// ── Shared mock setup ──────────────────────────────────────────────────────
const supabase = require('../config/supabase');

/**
 * Configure the Supabase mock so that:
 *  - .from('complaints').select(...).order(...) → returns `complaints`
 *  - .eq('category', value) → filters by EXACT match (case-sensitive, mimicking the bug)
 *  - .from('users').select(...).in(...) → returns empty students list
 */
function setupMock(seedComplaints) {
    // We need to simulate the chained Supabase query builder.
    // The buggy handler does:
    //   let query = supabase.from('complaints').select('*').order(...)
    //   if (category) query = query.eq('category', category)
    //   const { data, error } = await query
    //
    // We model this as a chainable object whose final await resolves with data.

    supabase.from.mockImplementation((table) => {
        if (table === 'complaints') {
            return buildComplaintsQueryBuilder(seedComplaints);
        }
        if (table === 'users') {
            return buildUsersQueryBuilder();
        }
        return {};
    });
}

function buildComplaintsQueryBuilder(seedComplaints) {
    let filtered = [...seedComplaints];

    const builder = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockImplementation((col, val) => {
            // case-sensitive match for non-category columns (e.g. status)
            filtered = filtered.filter(c => c[col] === val);
            return builder;
        }),
        ilike: jest.fn().mockImplementation((col, val) => {
            // Simulate the FIX: case-insensitive match for category
            filtered = filtered.filter(c => c[col].toLowerCase() === val.toLowerCase());
            return builder;
        }),
        neq: jest.fn().mockReturnThis(),
        // Make the builder thenable so `await query` works
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

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Bug Condition Exploration — Case-Sensitive Category Filter', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    });

    /**
     * Case 1: DB stores "library" (lowercase), request sends category=Library
     *
     * Counterexample: GET /api/complaints/all?category=Library returns []
     * when DB has category='library'
     */
    test('Case 1: stored "library" + query "Library" → should return non-empty (FAILS on unfixed code)', async () => {
        const supabaseMock = require('../config/supabase');
        const seed = [makeComplaint('library')];
        setupMockOnInstance(supabaseMock, seed);

        const app = buildFreshApp();
        const res = await request(app).get('/api/complaints/all?category=Library');

        expect(res.status).toBe(200);
        // This assertion FAILS on unfixed code because .eq returns [] for case mismatch
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        res.body.forEach(c => {
            expect(c.category.toLowerCase()).toBe('library');
        });
    });

    /**
     * Case 2: DB stores "LIBRARY" (uppercase), request sends category=Library
     *
     * Counterexample: GET /api/complaints/all?category=Library returns []
     * when DB has category='LIBRARY'
     */
    test('Case 2: stored "LIBRARY" + query "Library" → should return non-empty (FAILS on unfixed code)', async () => {
        const supabaseMock = require('../config/supabase');
        const seed = [makeComplaint('LIBRARY')];
        setupMockOnInstance(supabaseMock, seed);

        const app = buildFreshApp();
        const res = await request(app).get('/api/complaints/all?category=Library');

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        res.body.forEach(c => {
            expect(c.category.toLowerCase()).toBe('library');
        });
    });

    /**
     * Case 3: DB stores "Library" (title-case), request sends category=library (lowercase)
     *
     * Counterexample: GET /api/complaints/all?category=library returns []
     * when DB has category='Library'
     */
    test('Case 3: stored "Library" + query "library" → should return non-empty (FAILS on unfixed code)', async () => {
        const supabaseMock = require('../config/supabase');
        const seed = [makeComplaint('Library')];
        setupMockOnInstance(supabaseMock, seed);

        const app = buildFreshApp();
        const res = await request(app).get('/api/complaints/all?category=library');

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        res.body.forEach(c => {
            expect(c.category.toLowerCase()).toBe('library');
        });
    });
});

// ── Helpers that work with jest.resetModules() ─────────────────────────────

function buildFreshApp() {
    const app = express();
    app.use(express.json());
    const complaintRoutes = require('../routes/complaints');
    app.use('/api', complaintRoutes);
    return app;
}

function setupMockOnInstance(supabaseMock, seedComplaints) {
    supabaseMock.from.mockImplementation((table) => {
        if (table === 'complaints') {
            return buildComplaintsQueryBuilder(seedComplaints);
        }
        if (table === 'users') {
            return buildUsersQueryBuilder();
        }
        return {};
    });
}
