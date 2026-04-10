# Requirements Document

## Introduction

This feature adds optional file attachment support to the complaint submission flow in Smart Campus. Students can attach proof files (images, PDFs, documents) when submitting a complaint. Reviewers — specifically the Librarian — can view and download those attachments when managing complaints. The implementation mirrors the existing leave-attachment pattern already in production.

## Glossary

- **Complaint_Form**: The UI form in `StudentDashboard` through which a student submits or edits a complaint.
- **Complaint_Submission_API**: The `POST /api/complaints` and `PUT /api/complaints/:id` backend endpoints.
- **Upload_API**: The existing `POST /api/upload` endpoint that accepts multipart files, stores them in Supabase Storage, and returns an array of `{ file_url, file_name, file_type, file_size }` objects.
- **Attachment**: A single file object with the shape `{ file_url, file_name, file_type, file_size }` returned by the Upload_API.
- **Attachments_Column**: A `JSONB` column named `attachments` on the `complaints` table that stores an array of Attachment objects.
- **Complaint_Card**: A UI element in `LibrarianDashboard` that displays a single complaint's details.
- **Complaint_Table_Row**: A row in the complaints table in `LibrarianDashboard`.
- **File_Preview_Modal**: The existing modal in `StudentDashboard` that renders images, videos, PDFs, and Office documents inline.
- **Reviewer**: Any dashboard user (currently Librarian) who can view and manage complaints.

---

## Requirements

### Requirement 1: Database Schema — Add Attachments Column

**User Story:** As a developer, I want the `complaints` table to have an `attachments` JSONB column, so that attachment metadata can be persisted alongside each complaint.

#### Acceptance Criteria

1. THE Database SHALL contain an `attachments` column of type `JSONB` with a default value of `'[]'::jsonb` on the `complaints` table.
2. WHEN the migration SQL is executed against an existing database, THE Database SHALL add the `attachments` column without dropping or modifying any existing rows or columns.
3. IF the `attachments` column already exists, THEN THE Database SHALL skip the addition without raising an error (idempotent migration).

---

### Requirement 2: Backend — Accept Attachments on Complaint Creation

**User Story:** As a student, I want my complaint submission to include any files I uploaded, so that the proof is stored with the complaint record.

#### Acceptance Criteria

1. WHEN a `POST /api/complaints` request is received with a valid `attachments` array, THE Complaint_Submission_API SHALL persist the `attachments` array in the `attachments` column of the new complaint row.
2. WHEN a `POST /api/complaints` request is received without an `attachments` field, THE Complaint_Submission_API SHALL store an empty array `[]` as the default value for `attachments`.
3. IF the `attachments` field in the request body is not an array, THEN THE Complaint_Submission_API SHALL respond with HTTP 400 and a descriptive error message.
4. WHEN a `GET /api/complaints/:studentId` request is processed, THE Complaint_Submission_API SHALL include the `attachments` array in each returned complaint object.
5. WHEN a `GET /api/complaints/all` request is processed, THE Complaint_Submission_API SHALL include the `attachments` array in each returned complaint object.

---

### Requirement 3: Backend — Accept Attachments on Complaint Edit

**User Story:** As a student, I want to update the attachments on a pending complaint, so that I can add or replace proof files before the complaint is reviewed.

#### Acceptance Criteria

1. WHEN a `PUT /api/complaints/:id` request is received with an `attachments` field, THE Complaint_Submission_API SHALL update the `attachments` column of the specified complaint row with the provided value.
2. WHEN a `PUT /api/complaints/:id` request is received without an `attachments` field, THE Complaint_Submission_API SHALL leave the existing `attachments` value unchanged.

---

### Requirement 4: Student Dashboard — File Selection UI

**User Story:** As a student, I want a file input in the complaint form, so that I can select proof files before submitting.

#### Acceptance Criteria

1. THE Complaint_Form SHALL display a file input labelled "Attach Files (optional)" below the description textarea.
2. THE Complaint_Form SHALL accept files of types: JPEG, PNG, GIF, WebP, PDF, DOC, DOCX, PPT, PPTX, MP4, MOV, AVI, WebM.
3. WHEN a student selects more than 5 files, THE Complaint_Form SHALL display an alert stating "Maximum 5 files allowed" and clear the file selection.
4. WHEN a student selects 1 to 5 files, THE Complaint_Form SHALL display a confirmation message showing the count of selected files (e.g., "✅ 2 file(s) selected").
5. WHEN the student clicks "Cancel" while editing a complaint, THE Complaint_Form SHALL clear the selected files and reset the file input.

---

### Requirement 5: Student Dashboard — File Upload and Submission

**User Story:** As a student, I want my selected files to be uploaded and linked to my complaint, so that reviewers can access the proof.

#### Acceptance Criteria

1. WHEN a student submits the Complaint_Form with one or more selected files, THE Complaint_Form SHALL call the Upload_API with the selected files before calling the Complaint_Submission_API.
2. WHEN the Upload_API returns a successful response, THE Complaint_Form SHALL include the returned `files` array as the `attachments` field in the Complaint_Submission_API request body.
3. IF the Upload_API returns an error, THEN THE Complaint_Form SHALL display an alert with the error message and SHALL NOT proceed to call the Complaint_Submission_API.
4. WHILE a file upload is in progress, THE Complaint_Form SHALL disable the submit button and display "Submitting..." text.
5. WHEN a student submits the Complaint_Form with no files selected, THE Complaint_Form SHALL send an empty `attachments` array to the Complaint_Submission_API.
6. WHEN the complaint is successfully submitted or updated, THE Complaint_Form SHALL clear the file selection state.

---

### Requirement 6: Student Dashboard — View Own Complaint Attachments

**User Story:** As a student, I want to see and open the files I attached to my complaints, so that I can verify what proof was submitted.

#### Acceptance Criteria

1. WHEN a complaint in the student's complaint list has one or more attachments, THE Complaint_Form SHALL render a link or badge for each attachment in the corresponding table row.
2. WHEN a student clicks an attachment link, THE Complaint_Form SHALL open the file URL in a new browser tab.
3. WHEN a complaint has no attachments, THE Complaint_Form SHALL display a "—" placeholder in the attachments column.
4. THE Complaint_Form SHALL display a file-type icon (🖼️ for images, 📕 for PDFs, 🎥 for videos, 📄 for other documents) alongside each attachment name.

---

### Requirement 7: Librarian Dashboard — Display Complaint Attachments

**User Story:** As a librarian, I want to see and download the files attached to a complaint, so that I can review the proof before taking action.

#### Acceptance Criteria

1. WHEN a complaint displayed in the Complaint_Card or Complaint_Table_Row has one or more attachments, THE Complaint_Card SHALL render a clickable link or badge for each attachment.
2. WHEN a Reviewer clicks an attachment link, THE Complaint_Card SHALL open the file URL in a new browser tab.
3. WHEN a complaint has no attachments, THE Complaint_Card SHALL not render an attachments section (or render a "—" placeholder in the table row).
4. THE Complaint_Card SHALL display a file-type icon (🖼️ for images, 📕 for PDFs, 🎥 for videos, 📄 for other documents) alongside each attachment name.
5. WHEN the Librarian views the complaints table, THE Complaint_Table_Row SHALL include an "Attachments" column that shows the count of attached files as a badge (e.g., "📎 2") or "—" if none.
