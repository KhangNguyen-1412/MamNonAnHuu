# Security Specification & Threat Model (THPT An Hữu School Portal)

## 1. Data Invariants

- **Student Identity**: A student profile must contain a verified ID that matches the document ID. No "shadow files" with extra fields are allowed.
- **Staff Status**: Staff must only be recorded with status values specified in the legal system (`Đang Công Tác`, `Nghỉ Phép`, `Bình Chỉ / Khóa`).
- **Verifiable Writers**: Any insert or modification to students or staff databases requires authenticated users with verified email tokens (`request.auth.token.email_verified == true`).
- **Path Poisoning Guard**: Document ID variables must be alphanumeric and length-restricted to prevent resource exhaust / buffer attacks.

---

## 2. The "Dirty Dozen" Payloads

The following 12 payloads represent malicious or deformed structure attempts designed to bypass validation. Under our fortress rules, every single one of these MUST return `PERMISSION_DENIED`.

### Student Payloads (Threat Matrix)
- **P1: Ghost Field (Privilege Escalation attempt)**: Attempting to insert a malicious boolean flag to gain elevated rights (e.g. `isAdmin: true`).
- **P2: ID Poisoning**: Specifying an extremely long document ID path containing dangerous character strings (e.g. `student-ids-longer-than-allowed-junk-symbols`).
- **P3: Invalid Status Injection**: Setting status to a forbidden value like `"deleted"` or `"graduated_early"`.
- **P4: Type Mismatch (Date of Birth)**: Submitting an integer array for the date of birth (`dob`) field.
- **P5: Size Overflow**: Submitting phone numbers or addresses exceeding safe character boundaries (e.g., telephone string of 1MB).
- **P6: Immutable Violation**: Modifying immutable field keys such as original database indices or student registration stamps.

### Staff Payloads (Threat Matrix)
- **P7: Spaced/Poisoned Path**: Creating staff accounts with non-approved characters in the path keys.
- **P8: Spoofed Author email**: Registering with a mismatched admin email claim.
- **P9: Non-verified Write**: Attempting to insert staff details when the writing auth token's `email_verified` is `false`.
- **P10: Invalid Role Size**: Providing a multi-megabyte string into the Department or Role section.
- **P11: Action Bypass**: Modifying system generation timestamps without using standard action branches.
- **P12: Terminal State Shortcircuit**: Overwriting static personnel tenure status codes after tenure termination.

---

## 3. Test Verification Rules

Our Security Rules explicitly deny all 12 malicious payloads. Below is the fortress rule file design that enforces this.
