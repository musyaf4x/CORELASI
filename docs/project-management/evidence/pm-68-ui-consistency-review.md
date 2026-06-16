# UI Consistency Review - CORELASI

This document presents a comprehensive review of the UI/UX consistency across Admin, Guru, and Siswa roles in CORELASI. It evaluates the application against the Creative North Star ("The Academic Ledger") and structural guidelines documented in `PRODUCT.md` and `DESIGN.md`.

---

## 1. Creative North Star & Brand Personality

CORELASI is designed as a calm, highly structured, and dense academic workspace for school administrations in Indonesia.

| Aspect | Requirement | Review Status | Notes / Findings |
| :--- | :--- | :---: | :--- |
| **Canvas Color** | Off-white cool-neutral (`#f8f9fa`) | **Passed** | Pure neutral canvas layer provides high legibility. No warm beige or yellow bias. |
| **Sidebar Contrast** | Slate/gray dark contrast (`#eef0f3`) | **Passed** | Standard GitHub-style navigation layout. No unnecessary decorators. |
| **Accent Color** | Institutional Green (`#0f5132`) ≤ 10% | **Passed** | Limited to primary action buttons, active navigation indicator, focus ring, and brand logo. |
| **Elevation** | Border-only (`border: 1px solid #e5e7eb`) | **Passed** | Shadow is reserved for floating elements (modals, dropdowns, tooltips). Cards are flat-resting. |
| **Typography** | Inter variable-weight only | **Passed** | Font weight contrast (700 vs. 600 vs. 400) creates structural hierachy without varying sizes excessively. |
| **Color Control** | Single-accent brand structure | **Passed** | Zero role-specific color codes (no Indigo/Admin, Amber/Guru, Teal/Siswa). Standard semantic palette is used. |

---

## 2. Page & Layout Structure

Dashboard and operational workflows are verified for consistent structural density and comfortable spacing.

- **Asymmetric Dashboard Grid (2/3 + 1/3)**:
  - Left column (2/3): Contains schedule boards, class lists, learning material cards, and core tasks.
  - Right column (1/3): Vertically stacks `SummaryMetricCard` components.
- **Metric Card Standard (The 28px Stat Rule)**:
  - All numeric metric displays in `SummaryMetricCard` use exactly `28px` font size, `700` weight, and `-0.5px` letter-spacing.
  - Standardized across all roles to allow instant scanning.
- **Spacing Unit (Base-8)**:
  - Spacings, paddings, and margin grids strictly follow multiples of 8px (e.g. `p-3` (12px), `p-4` (16px), `gap-6` (24px)).
- **Border Radius Constraint (The 6px Card Rule)**:
  - All cards, panels, inputs, and buttons are constrained to a border radius of `rounded-[6px]`.
  - Pill shape (`rounded-full`) is strictly restricted to status badges and filter chips.

---

## 3. Role-Based Workspace & Workflow Audits

### A. Authentication & General Elements
- **Login Panel**: Left side features Institutional Green backing with white text and clean, squircle-free CORELASI icon.
- **Role Redirection**: Authenticating via Quick Login or default forms redirects to respective role-specific dashboard views.
- **Logout Action**: Clears tokens from memory and returns the user to the Login page with a neutral hover redirection.

### B. Admin Workspace
- **Dashboard**: High-density overview showing total counts of students, teachers, classes, and schedules.
- **Academic Setup**: High-contrast tables showing terms and subjects with standardized inline action buttons.
- **Operational Reports**: Consistent column widths, search filters, and exporting options.

### C. Guru Workspace
- **Dashboard**: Display active schedule cards, class summaries, and quick action banners.
- **Role Assignment Banner**: Displays active responsibilities (e.g., Wali Kelas, Guru Piket) using clean status chips without shadow.
- **Attendance Form (Role Rules)**:
  - **Guru Pengampu**: Restrained strictly to `Hadir` and `Alpa` options only.
  - **Guru Piket / Admin**: Authorized to override or log `Sakit` and `Izin` with valid notes.
- **Grading & Submissions**: Supports tabbed list of submissions and inline numeric scoring inputs.

### D. Siswa Workspace
- **Dashboard**: Simple, clean schedule, grade progress bar, and active homework lists.
- **Learning & Submissions**: Access to download files, view instructions, and submit files directly via secure attachments.
- **Grades Board**: Organized per semester with explicit letter grades and teacher notes.

---

## 4. UI/UX Consistency Matrix

| Element | Verified Styling | Role Consistency | Status |
| :--- | :--- | :---: | :---: |
| **Buttons** | Solid `#0f5132` (Primary) / White border `#e5e7eb` (Secondary) | 100% Shared | **PASSED** |
| **Status Badges** | Pill-shaped (rounded-full) with semantic colored dot indicator | 100% Shared | **PASSED** |
| **Data Tables** | Cool-neutral header, neutral hover state (`bg-bg-paper`), no green row hover | 100% Shared | **PASSED** |
| **Input Fields** | Flat border, primary focus outline (`ring-primary`), clear labels | 100% Shared | **PASSED** |
| **States** | Standardized `LoadingState` (spinner) and `ErrorState` (icon + text + retry button) | 100% Shared | **PASSED** |

---

## 5. Summary of Review Findings

1. **Branding & Consistency**: The design successfully enforces "The Academic Ledger" aesthetic. The interface feels structured, lightweight, and professional.
2. **Aesthetic Violations**: None found. No over-rounded containers, gradient text, or glassmorphism effects are present.
3. **Accessibility**: All semantic colors are coupled with visible labels. Font contrast is well within standard limits.
4. **Conclusion**: The user interface matches the requirements of `PRODUCT.md` and `DESIGN.md` across all roles. The UI is consistent and ready for Sprint 11 integration.
