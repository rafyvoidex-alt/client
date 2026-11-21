# Security Specification: WhiteboardCraft Collaboration & Submissions

## 1. Data Invariants
1. Elements in a whiteboard cannot exist without a valid alphanumeric `boardId`.
2. Document IDs and User IDs must be sanitized alphanumeric/hyphen strings under 128 characters.
3. String sizes for names, titles, descriptions, and comments must not exceed declared limits to prevent Denial of Wallet.
4. User cursor coordinates and element coordinates must be finite numeric values.
5. BoardElement types must be one of the permitted enum values (`sticky`, `rect`, `circle`, `diamond`, `text`, `drawing`, `arrow`, `frame`, `badge`).
6. Submissions must include a valid generated entry ID and cannot exceed character limits.

## 2. The "Dirty Dozen" Payloads (Must Return PERMISSION_DENIED)
1. **Unsanitized ID Injection**: Path parameter `boardId` containing directory traversal or script tag (`../../etc/passwd` or `<script>`).
2. **Denial of Wallet Element Payload**: An element document with a 2MB `text` payload exceeding the 2000-character ceiling.
3. **Invalid Enum Element Type**: BoardElement with `type: "malicious_script"`.
4. **NaN / Infinite Coordinates**: BoardElement with `x: "NaN"` or infinite numeric overflow.
5. **Orphaned Element Write**: Attempting to write an element to a non-existent or blank board ID.
6. **Cursor Impersonation / Oversized Name**: UserCursor with 50KB `userName` payload.
7. **Negative or Array Injection on Numeric Property**: `strokeWidth: [-1, "hack"]`.
8. **Shadow Field Injection**: Inserting unapproved fields like `__isAdmin: true` or `systemAccessKey: "xyz"` during element creation.
9. **Status Hijacking on Submission**: Overwriting status to invalid states like `root_approved`.
10. **Huge Unbounded Points Array**: Injecting a drawing with 1,000,000 coordinate items to lock up client memory.
11. **Blank Required Property**: Creating an element without `id` or without `type`.
12. **Submission Without Entry ID**: Creating a submission entry missing the required `entryId` code.
