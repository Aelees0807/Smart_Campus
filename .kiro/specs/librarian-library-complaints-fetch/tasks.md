# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Case-Sensitive Category Filter Returns Empty Results
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate `.eq('category', category)` silently excludes complaints with different-cased categories
  - **Scoped PBT Approach**: Scope the property to the three concrete failing cases for reproducibility:
    - DB stores `"library"` (lowercase), request sends `category=Library` → expect non-empty result
    - DB stores `"LIBRARY"` (uppercase), request sends `category=Library` → expect non-empty result
    - DB stores `"Library"` (title-case), request sends `category=library` (lowercase) → expect non-empty result
  - Mock the Supabase client in `backend/routes/complaints.js` to return complaints with the mismatched-case category
  - Call `GET /api/complaints/all?category=Library` against the unfixed handler
  - Assert that `result.length >= 1` and every returned complaint satisfies `complaint.category.toLowerCase() === 'library'`
  - Run test on UNFIXED code (the `.eq` line is still present)
  - **EXPECTED OUTCOME**: Test FAILS — handler returns `[]` instead of the seeded complaints (proves the bug)
  - Document counterexamples found, e.g. `"GET /api/complaints/all?category=Library returns [] when DB has category='library'"`
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Library and Non-Category-Filter Requests Are Unaffected
  - **IMPORTANT**: Follow observation-first methodology — observe UNFIXED code behavior first
  - Observe: `GET /api/complaints/all?category=Hostel` returns only hostel complaints on unfixed code
  - Observe: `GET /api/complaints/all` (no category param) returns all complaints on unfixed code
  - Observe: `GET /api/complaints/all?status=Open` returns only open complaints on unfixed code
  - Observe: `GET /api/complaints/:studentId` returns only that student's complaints on unfixed code
  - Observe: `PUT /api/complaints/:id` with `{ status: "Resolved" }` persists the status change on unfixed code
  - Write property-based tests capturing these observed behaviors:
    - For all non-library category values (e.g. "Hostel", "Canteen", "Transport"), the handler returns only complaints matching that exact category
    - For requests with no `category` param, the handler returns all complaints regardless of category
    - For requests with a `status` filter, the handler returns only complaints matching that status
    - `GET /api/complaints/:studentId` is unaffected (separate route, no change)
    - `PUT /api/complaints/:id` status updates continue to work correctly
  - Run all preservation tests on UNFIXED code
  - **EXPECTED OUTCOME**: All preservation tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix the case-sensitive category filter in the complaints route

  - [x] 3.1 Replace `.eq` with `.ilike` for the category filter
    - In `backend/routes/complaints.js`, inside `router.get('/complaints/all', ...)`:
    - Before: `if (category) query = query.eq('category', category);`
    - After:  `if (category) query = query.ilike('category', category);`
    - `ilike` performs a case-insensitive match without wildcards, equivalent to SQL `ILIKE 'Library'` which matches `'library'`, `'LIBRARY'`, `'Library'`, etc.
    - Do NOT change the `exclude_category` filter (`.neq`) — it is out of scope
    - Do NOT change the `status` filter (`.eq('status', status)`) — status values are already consistent
    - Do NOT modify `LibrarianDashboard.jsx` — it already sends `category=Library` which is correct
    - _Bug_Condition: isBugCondition(X) where X.category IS NOT NULL AND storedCategory(X) != X.category (case-sensitive mismatch)_
    - _Expected_Behavior: For all X where isBugCondition(X), result.length >= 0 AND ALL c IN result: LOWERCASE(c.category) = LOWERCASE(X.category)_
    - _Preservation: All requests where isBugCondition(X) is false must produce the same result set as the original handler_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Case-Insensitive Category Fetch Returns All Matching Complaints
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior (non-empty result for mismatched-case categories)
    - When this test passes, it confirms `.ilike` correctly returns complaints regardless of stored casing
    - Run bug condition exploration test from step 1 against the FIXED code
    - **EXPECTED OUTCOME**: Test PASSES — handler now returns the seeded complaints for all three casing variants
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Library and Non-Category-Filter Requests Are Unaffected
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run all preservation property tests from step 2 against the FIXED code
    - **EXPECTED OUTCOME**: All preservation tests PASS — no regressions introduced by the `.ilike` change
    - Confirm non-library categories (Hostel, Canteen, etc.) are still correctly filtered
    - Confirm no-filter requests still return all complaints
    - Confirm status filter still works alongside the category fix
    - Confirm student-specific route and status update route are unaffected

- [x] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite (exploration test + preservation tests)
  - Confirm Property 1 (Bug Condition) now PASSES on fixed code
  - Confirm Property 2 (Preservation) still PASSES on fixed code
  - Manually verify: start the backend, open LibrarianDashboard, confirm library complaints appear
  - Ensure all tests pass; ask the user if any questions arise
