# Librarian Library Complaints Fetch Bugfix Design

## Overview

The LibrarianDashboard displays zero complaints because `GET /api/complaints/all?category=Library`
uses a case-sensitive `.eq('category', category)` Supabase filter. If any complaint is stored with
a different casing (e.g. `"library"`, `"LIBRARY"`), it is silently excluded. The fix replaces the
exact-match filter with a case-insensitive `ilike` filter on the backend. The frontend already sends
`category=Library`, which is acceptable once the backend comparison is case-insensitive.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — a category filter is applied using
  case-sensitive `.eq()`, causing a casing mismatch between the query parameter and stored values.
- **Property (P)**: The desired behavior — all complaints whose category matches "library"
  (any casing) are returned to the librarian.
- **Preservation**: All other complaint-fetching behavior (non-library categories, student-specific
  queries, status updates) must remain unchanged by the fix.
- **`fetchComplaints` (F)**: The current (unfixed) handler in `backend/routes/complaints.js` for
  `GET /api/complaints/all` that uses `.eq('category', category)`.
- **`fetchComplaints'` (F')**: The fixed handler that uses `.ilike('category', category)` for
  case-insensitive matching.
- **`ilike`**: Supabase/PostgreSQL operator for case-insensitive pattern matching (equivalent to
  `ILIKE` in SQL).
- **`storedCategory`**: The value of the `category` column as it exists in the Supabase `complaints`
  table (casing may vary by how the complaint was submitted).

## Bug Details

### Bug Condition

The bug manifests when the LibrarianDashboard calls `GET /api/complaints/all?category=Library` and
the `category` column in the database contains values with different casing (e.g. `"library"`,
`"LIBRARY"`, `"Library"`). The backend handler applies `.eq('category', category)`, which is a
strict case-sensitive equality check in PostgreSQL/Supabase, so only rows whose `category` column
value is byte-for-byte identical to `"Library"` are returned.

**Formal Specification:**

```
FUNCTION isBugCondition(X)
  INPUT: X of type ComplaintFetchRequest
  OUTPUT: boolean

  RETURN X.category IS NOT NULL
     AND storedCategory(X) != X.category   // case-sensitive mismatch exists
END FUNCTION
```

### Examples

- Frontend sends `category=Library`; DB stores `"library"` → `.eq` returns 0 rows (bug triggered).
- Frontend sends `category=Library`; DB stores `"LIBRARY"` → `.eq` returns 0 rows (bug triggered).
- Frontend sends `category=Library`; DB stores `"Library"` → `.eq` returns correct rows (no bug).
- Frontend sends `category=Hostel`; DB stores `"Hostel"` → `.eq` returns correct rows (no bug,
  outside scope of this fix).

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Complaints with non-library categories (e.g. `"Hostel"`, `"Canteen"`) must continue to be
  excluded from the librarian's view.
- The Peon dashboard and other consumers calling `/api/complaints/all` with their own filters must
  continue to receive correctly filtered results.
- Student-specific complaint fetching via `GET /api/complaints/:studentId` must remain unaffected.
- Status update operations (`PUT /api/complaints/:id`) must continue to work correctly.
- Frontend search and status filters applied on the fetched complaints array must continue to work.

**Scope:**
All requests that do NOT involve a category filter with a casing mismatch are completely unaffected
by this fix. This includes:
- Requests with no `category` query parameter.
- Requests where the stored category casing already matches the query parameter exactly.
- All `exclude_category`, `status`, and `department` filter paths.

## Hypothesized Root Cause

Based on the bug description and code inspection of `backend/routes/complaints.js`:

1. **Case-Sensitive Equality Filter**: Line `if (category) query = query.eq('category', category);`
   uses Supabase's `.eq()` which maps to PostgreSQL `=` — a byte-exact comparison. This is the
   direct cause.

2. **Inconsistent Data Entry Casing**: Complaints may be submitted by students via
   `POST /api/complaints` where the `category` value is taken directly from the request body
   without normalization. Different UI components or historical data may have stored categories
   with varying casing.

3. **No Normalization on Write**: The `POST /api/complaints` handler stores `category` as-is
   without lowercasing or canonicalizing, so the database accumulates mixed-case values over time.

4. **Frontend Sends Title-Case**: `LibrarianDashboard.jsx` hardcodes `category=Library`
   (title-case), which may not match `"library"` (lowercase) stored by the student submission form.

## Correctness Properties

Property 1: Bug Condition - Case-Insensitive Category Fetch

_For any_ `ComplaintFetchRequest` where `isBugCondition` returns true (i.e. the `category`
parameter is present and stored values differ in casing), the fixed `GET /api/complaints/all`
handler SHALL return all complaints whose category matches the query parameter in a
case-insensitive manner, with `result.length >= 0` and every returned complaint satisfying
`LOWERCASE(c.category) = LOWERCASE(X.category)`.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Non-Buggy Request Behavior

_For any_ `ComplaintFetchRequest` where `isBugCondition` returns false (no category filter, or
casing already matches), the fixed handler SHALL produce the same result set as the original
handler, preserving all existing filtering behavior for `exclude_category`, `status`,
`department`, and student-specific queries.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming the root cause is the case-sensitive `.eq()` filter (hypothesis 1 above):

**File**: `backend/routes/complaints.js`

**Function**: `router.get('/complaints/all', ...)`

**Specific Changes**:

1. **Replace `.eq` with `.ilike` for category filter**:
   - Before: `if (category) query = query.eq('category', category);`
   - After: `if (category) query = query.ilike('category', category);`
   - `ilike` performs a case-insensitive match. Since no wildcard (`%`) is added, it behaves like
     a case-insensitive equality check (`ILIKE 'Library'` matches `'library'`, `'LIBRARY'`, etc.).

2. **Verify frontend category value** (no change needed):
   - `LibrarianDashboard.jsx` already sends `category=Library` which is a reasonable canonical
     value. No change required on the frontend once the backend is case-insensitive.

3. **No change to `exclude_category` filter**:
   - The `exclude_category` filter uses `.neq()` which is also case-sensitive, but this is used
     by the Peon dashboard to exclude a specific category. Changing it is out of scope and could
     introduce regressions; leave it as-is unless a separate bug is filed.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate
the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or
refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that mock the Supabase client and simulate a database containing
complaints with lowercase `"library"` category. Call the unfixed handler with `category=Library`
and assert that the response is empty (demonstrating the bug). Run these tests on the UNFIXED code
to observe failures and understand the root cause.

**Test Cases**:
1. **Lowercase stored, title-case queried**: DB has `category="library"`, request sends
   `category=Library` → expect non-empty result (will fail on unfixed code).
2. **Uppercase stored, title-case queried**: DB has `category="LIBRARY"`, request sends
   `category=Library` → expect non-empty result (will fail on unfixed code).
3. **Mixed-case stored**: DB has `category="Library"`, request sends `category=library` →
   expect non-empty result (will fail on unfixed code).
4. **No category filter**: Request sends no `category` param → expect all complaints returned
   (should pass on both unfixed and fixed code).

**Expected Counterexamples**:
- The handler returns `[]` when complaints exist with a different-cased category value.
- Possible causes: `.eq()` strict equality, no normalization on write, no normalization on read.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces
the expected behavior.

**Pseudocode:**
```
FOR ALL X WHERE isBugCondition(X) DO
  result := fetchComplaints'(X)   // fixed handler using ilike
  ASSERT result.length >= 0
  ASSERT ALL c IN result: LOWERCASE(c.category) = LOWERCASE(X.category)
  ASSERT no_crash(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function
produces the same result as the original function.

**Pseudocode:**
```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT fetchComplaints(X) = fetchComplaints'(X)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain.
- It catches edge cases that manual unit tests might miss.
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs.

**Test Plan**: Observe behavior on UNFIXED code first for requests without a category filter or
with exact-match categories, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Non-library category preservation**: Verify that `category=Hostel` still returns only hostel
   complaints after the fix.
2. **No-filter preservation**: Verify that omitting `category` still returns all complaints.
3. **Status filter preservation**: Verify that `status=Open` filter continues to work correctly
   alongside the category fix.
4. **Student-specific query preservation**: Verify `GET /api/complaints/:studentId` is unaffected.
5. **Status update preservation**: Verify `PUT /api/complaints/:id` continues to update status
   correctly.

### Unit Tests

- Test that `GET /api/complaints/all?category=Library` returns complaints stored as `"library"`.
- Test that `GET /api/complaints/all?category=Library` returns complaints stored as `"LIBRARY"`.
- Test that `GET /api/complaints/all?category=Hostel` does NOT return library complaints.
- Test edge case: no complaints in DB → returns empty array without crashing.
- Test that `exclude_category` filter still excludes the correct category.

### Property-Based Tests

- Generate random category strings with varying casing and verify that `ilike` matching returns
  all complaints whose lowercased category equals the lowercased query parameter.
- Generate random sets of complaints with mixed categories and verify that non-library complaints
  are never included in a `category=Library` response.
- Generate random non-category-filter requests and verify the fixed handler returns the same
  result set as the original handler.

### Integration Tests

- Full flow: student submits a complaint with `category="library"` (lowercase) → librarian
  dashboard loads → complaint appears in the list.
- Full flow: librarian updates complaint status → status persists and is reflected on reload.
- Verify Peon dashboard (`exclude_category` path) is unaffected by the fix.
