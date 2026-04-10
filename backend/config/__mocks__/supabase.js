'use strict';

// Auto-mock for the Supabase client used in tests
const supabase = {
    from: jest.fn(),
};

module.exports = supabase;
