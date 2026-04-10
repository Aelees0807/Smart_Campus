# Bugfix Requirements Document

## Introduction

The LibrarianDashboard fails to display student complaints categorized as "library". The frontend fetches complaints using a case-sensitive category filter (`category=Library`), while the backend performs an exact-match query against the database. If the stored category value does not match the exact casing sent by the frontend, no complaints are returned — leaving the librarian with an empty dashboard regardless of how many library complaints exist. The fix must ensure all library-category complaints are fetched regardless of department, and that the category matching is reliable.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the LibrarianDashboard loads and calls `GET /api/complaints/all?category=Library`, THEN the system returns an empty array even when library complaints exist in the database, because the backend performs a case-sensitive exact match on the `category` field.

1.2 WHEN complaints are stored in the database with a category value that differs in casing from the query parameter (e.g. `"library"` vs `"Library"`), THEN the system returns no results for the librarian.

1.3 WHEN the `/api/complaints/all` endpoint applies the `category` filter, THEN the system does not apply any case-insensitive or normalized comparison, causing complaints to be silently excluded.

### Expected Behavior (Correct)

2.1 WHEN the LibrarianDashboard calls `GET /api/complaints/all?category=Library`, THEN the system SHALL return all complaints whose category matches "library" in a case-insensitive manner, regardless of how the value is stored in the database.

2.2 WHEN complaints from students of any department are categorized as "library" (any casing), THEN the system SHALL include them in the response returned to the librarian.

2.3 WHEN the backend applies the category filter, THEN the system SHALL use a case-insensitive comparison (e.g. `ilike` or normalized lowercase matching) so that `"Library"`, `"library"`, and `"LIBRARY"` all resolve to the same result set.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a student submits a complaint with a non-library category (e.g. "Hostel", "Canteen"), THEN the system SHALL CONTINUE TO exclude those complaints from the librarian's view.

3.2 WHEN the librarian updates the status of a complaint (Open → In Progress → Resolved → Closed), THEN the system SHALL CONTINUE TO persist the status change correctly.

3.3 WHEN the Peon dashboard or other dashboards call `/api/complaints/all` with their own category or department filters, THEN the system SHALL CONTINUE TO return correctly filtered results for those consumers.

3.4 WHEN a student views their own complaints via `GET /api/complaints/:studentId`, THEN the system SHALL CONTINUE TO return only that student's complaints unaffected by this fix.

3.5 WHEN the LibrarianDashboard search and status filters are applied on the fetched complaints, THEN the system SHALL CONTINUE TO filter the displayed list correctly by name, student ID, description, and status.

---

## Bug Condition (Pseudocode)

**Bug Condition Function** — identifies requests that trigger the bug:

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type ComplaintFetchRequest
  OUTPUT: boolean

  // Bug is triggered when the librarian fetches complaints with a category
  // filter whose casing does not exactly match the stored value in the DB
  RETURN X.category IS NOT NULL
     AND storedCategory(X) != X.category   // case-sensitive mismatch
END FUNCTION
```

**Property: Fix Checking**

```pascal
FOR ALL X WHERE isBugCondition(X) DO
  result ← fetchComplaints'(X)   // F' = fixed backend query
  ASSERT result.length >= 0
  ASSERT ALL c IN result: LOWERCASE(c.category) = LOWERCASE(X.category)
  ASSERT no_crash(result)
END FOR
```

**Property: Preservation Checking**

```pascal
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT fetchComplaints(X) = fetchComplaints'(X)
END FOR
```
