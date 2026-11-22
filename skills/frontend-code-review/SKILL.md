---
name: frontend-code-review
description: >-
  Conduct comprehensive frontend code reviews and audits for React / Next.js / Vite web applications
  following Snapsec UI standards. Enforces standard page structure (page-name/, store.js for Zustand cross-component state,
  page-name.jsx composer, components/ with forms/ and schema.jsx, and per-component isLoading skeletons), standard API error
  handling (<ApiErrorHandler error={error} />), iconless tab headers (<TabsTrigger>), fallback placeholders for empty table cells
  ('-' or '--'), iconless form labels, chart card info icons with hover tooltips, layout-reflecting loading skeletons,
  primary-styled page action buttons with icons, empty screens for zero-data states, and Zod + React Hook Form validation with
  descriptive placeholders. Generates a standalone Markdown review report file detailing each issue (file, line, issue description,
  and proposed fix) and waits for user decision before modifying code. Activate this skill whenever the user asks to review
  frontend code, audit a React component or page, check UI quality or compliance, inspect PRs for frontend changes, or verify UI
  components against design standards, even if they simply say "review this UI", "audit my page", or "check this frontend code".
---

# Frontend Code Review Skill

A comprehensive review framework for auditing and reviewing React frontend code across `snapsec-ui` and modern web applications.

This skill equips agents to act as rigorous, architecture- and design-system-aware frontend reviewers. It ensures code quality, architectural consistency, error resilience, and strict adherence to Snapsec structural and UI design standards.

---

## When to Use This Skill

Activate this skill whenever:
- **Reviewing frontend PRs or files**: Checking page directories, components, modal forms, tables, tabs, or dashboard widgets.
- **Auditing page structure & architecture**: Ensuring pages adhere to the standard `page-name/`, `store.js`, `page-name.jsx`, and `components/` layout.
- **Auditing UI consistency**: Ensuring components match design patterns for loading, error, empty, and data states.
- **Validating form implementations**: Verifying React Hook Form, co-located Zod schemas (`schema.jsx`), input placeholders, and button states.
- **Checking API integration**: Ensuring network queries handle HTTP error states (403, 404, 500, 503) using standard error handlers.

---

## 1. Architectural Standard: Page Structure & Component Composition

*Reference Guide: [references/page-structure-and-composition.md](./references/page-structure-and-composition.md)*

Every feature page in the frontend must adhere to a standardized directory layout and composition model:

```text
page-name/
├── store.js                  # Zustand store for cross-component communication & transient state
├── page-name.jsx             # Root page component (lean orchestrator & composer)
└── components/               # Modular child components used to assemble the page
    ├── forms/                # Form components and validation schemas
    │   ├── form1.jsx         # Form implementation (React Hook Form)
    │   └── schema.jsx        # Co-located Zod validation schema
    ├── tables/               # Table views (accepts { data, isLoading } -> internal skeleton)
    ├── charts/               # Chart cards (accepts { data, isLoading } -> internal skeleton)
    └── modals/               # Modal dialogs and drawers
```

### Core Architectural Rules:

1. **`page-name.jsx` is a Lean Composer**:
   - `page-name.jsx` must **compose** components defined in `components/` rather than being an 800-line monolithic file containing inline tables, modal JSX, and form state.
   - It executes top-level queries (e.g. RTK Query hooks).
   - It performs top-level **API error handling** (`<ApiErrorHandler error={error} />`).
   - It performs top-level **empty screen handling** (`<EmptyScreen />` when 0 records exist).
   - It passes `data` and `isLoading` flags down to child components.

2. **Zustand Store (`store.js`) for Cross-Component Communication**:
   - Page-level transient state (e.g. opening a create/edit modal from an action button or table row, selected table item, active tab/filter) must be managed in `store.js` using Zustand (`create((set) => ({ ... }))`).
   - Avoid prop-drilling callbacks and states across multiple component tiers.

3. **The `isLoading` Prop Contract & Localized Skeletons**:
   - Every child component in `components/` that renders dynamic data (tables, charts, metric cards) **must accept an `isLoading` prop**.
   - Based on `isLoading`, each component encapsulates and renders its own internal `<Skeleton>` matching its exact geometry during the loading phase.

4. **Co-located Forms & Schemas (`components/forms/`)**:
   - Forms belong in `components/forms/form1.jsx`.
   - Zod validation schemas belong co-located in `components/forms/schema.jsx`.

---

## 2. The 9 Golden UI Rules of Frontend Code Review

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   THE 9 GOLDEN FRONTEND REVIEW RULES                   │
├────────────────────────────────────────────────────────────────────────┤
│ 1. API Error Handling    │ <ApiErrorHandler error={error} />           │
│ 2. Tab Navigation        │ TabsTrigger must NEVER contain icons        │
│ 3. Table Cell Fallbacks  │ Empty values rendered as '-' or '--'        │
│ 4. Form Labels           │ Labels must NEVER contain icons             │
│ 5. Chart Cards           │ Info icon on right with hover tooltip       │
│ 6. Loading States        │ Skeletons must reflect exact page layout    │
│ 7. Page Action Buttons   │ Primary color + leading action icon         │
│ 8. Empty Data States     │ <EmptyScreen /> when 0 items returned       │
│ 9. Form Validation       │ Zod schema + React Hook Form + placeholders │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Rule 1: API Error Handling via `ApiErrorHandler`

*Reference Guide: [references/api-error-handling-guide.md](./references/api-error-handling-guide.md)*

**Requirement**: Every page or container that performs asynchronous data fetching (via RTK Query or `fetch`) **must** handle HTTP error states using the application standard `<ApiErrorHandler error={error} />`.

#### What to Check:
- **RTK Query Hooks**: Check that query calls destructure `isError` and `error` in addition to `data` and `isLoading`.
- **Render Guard**: Verify an explicit error guard exists before rendering main content:
  ```jsx
  import ApiErrorHandler from '@/components/common/api-error-handler';

  const { data, isLoading, isError, error } = useGetResourceQuery();

  if (!isLoading && isError) {
    return <ApiErrorHandler error={error} />;
  }
  ```
- **Multiple Queries**: If multiple queries execute, verify that all primary queries that block the page have their error states checked.
- **Public Fetch / Async**: For native `fetch()`, ensure errors (including non-2xx status codes) are caught into state with `{ status, data: { message } }` and rendered with `<ApiErrorHandler />`.

#### Anti-Patterns (Must Flag):
- ❌ Destructuring only `{ data, isLoading }` and omitting `isError` / `error`.
- ❌ Rendering unstyled inline text: `if (error) return <p>Error loading data</p>`.
- ❌ Silently falling back to hardcoded mock data or empty lists when the API fails.

---

### Rule 2: Tabs Must Never Contain Icons

*Reference Guide: [references/ui-component-conventions.md](./references/ui-component-conventions.md#1-tabs-clean-text-only-navigation)*

**Requirement**: In tab-based interfaces using `<Tabs>` and `<TabsTrigger>`, tab triggers **must NEVER contain icons**.

#### What to Check:
- Inspect every `<TabsTrigger>` component in the file.
- Verify the children of `<TabsTrigger>` contain only text labels (and optional numeric counter badges).

#### Anti-Patterns (Must Flag):
- ❌ `<TabsTrigger value="tab1"><Folder className="h-4 w-4" /> Overview</TabsTrigger>`
- ❌ `<TabsTrigger value="tab2"><Activity className="h-4 w-4" /> Activity</TabsTrigger>`

#### Approved Pattern:
```jsx
// ✅ Correct: Clean text with optional count badge
<TabsList>
  <TabsTrigger value="overview">Overview</TabsTrigger>
  <TabsTrigger value="findings">
    Findings <Badge size="sm" variant="secondary" className="ml-1.5">24</Badge>
  </TabsTrigger>
  <TabsTrigger value="settings">Settings</TabsTrigger>
</TabsList>
```

---

### Rule 3: Table Cells Must Display `'-'` or `'--'` for Empty Values

*Reference Guide: [references/ui-component-conventions.md](./references/ui-component-conventions.md#2-table-cells-empty-value-fallbacks---or---)*

**Requirement**: In any data table (`cell: ({ row }) => ...`), when a value is `null`, `undefined`, or an empty string `""`, it **must** render a fallback placeholder of `'-'` or `'--'`.

#### What to Check:
- Review all table column definitions and cell renderers.
- Verify fallback operators (`|| '-'`, `?? '--'`) are applied to optional fields, names, emails, IPs, and dates.
- Never allow a cell to render blank whitespace or raw `null`/`undefined`.

#### Anti-Patterns (Must Flag):
- ❌ `cell: ({ row }) => <span>{row.original.description}</span>` (renders empty whitespace if null)
- ❌ `cell: ({ row }) => row.original.ownerName` (missing fallback)

#### Approved Pattern:
```jsx
// ✅ Correct: Fallback with '-' or '--'
cell: ({ row }) => {
  const value = row.original.description;
  return (
    <span className={!value ? 'text-muted-foreground' : ''}>
      {value || '-'}
    </span>
  );
}

// Or inline:
cell: ({ row }) => <span>{row.original.ipAddress ?? '--'}</span>
```

---

### Rule 4: Inside Labels, Never Include Icons

*Reference Guide: [references/ui-component-conventions.md](./references/ui-component-conventions.md#3-labels-zero-icons-inside-label--formlabel)*

**Requirement**: Inside `<Label>` and `<FormLabel>`, icons **must NEVER** be included.

#### What to Check:
- Inspect all `<Label>` and `<FormLabel>` elements.
- Verify labels contain only plain text and optional required asterisks (`<span className="text-destructive">*</span>`).
- If an info icon, tooltip, or help trigger is required, verify it is placed **adjacent to or outside** the label, never inside it.

#### Anti-Patterns (Must Flag):
- ❌ `<FormLabel><Info className="h-4 w-4" /> Project Name</FormLabel>`
- ❌ `<Label className="flex items-center gap-1"><HelpCircle className="h-3 w-3" /> API Key</Label>`

#### Approved Pattern:
```jsx
// ✅ Correct: Plain text label with external info tooltip
<div className="flex items-center justify-between">
  <FormLabel>
    Project Name <span className="text-destructive">*</span>
  </FormLabel>
  <CustomTooltip text="Enter the official repository or project name.">
    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-pointer" />
  </CustomTooltip>
</div>
```

---

### Rule 5: Chart Cards Must Have an Info Hover Tooltip on the Right

*Reference Guide: [references/ui-component-conventions.md](./references/ui-component-conventions.md#4-chart-cards-header-with-info-hover-tooltip)*

**Requirement**: Every card component that displays a chart must include an `<Info />` icon on the right side of the card header. On hover, this icon must display a tooltip explaining what the chart represents and how metrics are calculated.

#### What to Check:
- Locate all chart containers (BarChart, PieChart, DonutChart, LineChart, Recharts).
- Check that the chart is wrapped in a `<Card>` with `<CardHeader>`.
- Check that the header has `<CardTitle>` on the left and a right-aligned `<CustomTooltip>` or `<Tooltip>` wrapping an `<Info className="h-4 w-4 text-muted-foreground cursor-pointer" />`.

#### Anti-Patterns (Must Flag):
- ❌ Chart rendered without any card header or title.
- ❌ Chart card header has title but no info icon.
- ❌ Info icon exists but lacks hover tooltip text.

#### Approved Pattern:
```jsx
// ✅ Correct: CardHeader with title and right-aligned Info tooltip
<Card className="h-full">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">
      Vulnerability Severity Distribution
    </CardTitle>
    <CustomTooltip text="Breakdown of open vulnerabilities by severity based on CVSS v3 score.">
      <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
    </CustomTooltip>
  </CardHeader>
  <CardContent>
    <SeverityChart data={data} isLoading={isLoading} />
  </CardContent>
</Card>
```

---

### Rule 6: Page Layout Must Be Reflected by Skeletons During Loading

*Reference Guide: [references/ui-component-conventions.md](./references/ui-component-conventions.md#5-loading-state-layout-reflecting-skeletons)*

**Requirement**: During data loading (`isLoading`), the UI **must** render `<Skeleton>` components that mirror the exact layout, geometry, and placement of the actual page components (headers, stat cards, tables, charts). Each composed child component should accept `isLoading` and render its localized skeleton.

#### What to Check:
- Verify that `isLoading` renders dedicated skeleton structures rather than a single generic spinner.
- Check that child components accept `isLoading` and render their internal skeleton.
- Check that the skeleton structure matches the page grid:
  - Header actions: `h-8 w-48`
  - Stat / Metric cards: Grid of `h-24` rounded cards
  - Table: Skeleton rows with matching column count
  - Charts: `h-[300px]` or `h-[400px]` card skeletons

#### Anti-Patterns (Must Flag):
- ❌ Returning `null` or a blank white screen during `isLoading`.
- ❌ Using a centered spinner `<Loader className="animate-spin" />` that causes Cumulative Layout Shift (CLS).

---

### Rule 7: Page-Level Action Buttons Must Be Primary Colored and Have an Icon

*Reference Guide: [references/ui-component-conventions.md](./references/ui-component-conventions.md#6-page-level-action-buttons-primary-variant-with-action-icon)*

**Requirement**: Global and page-level call-to-action (CTA) buttons (e.g., "Create Assessment", "New Project", "Export Data") **must** be styled with the primary color (`variant="primary"`) and **must** include an action icon (e.g. `<Plus className="h-4 w-4" />`, `<Upload className="h-4 w-4" />`).

#### What to Check:
- Identify primary page-level buttons in headers, toolbar actions, or modal triggers.
- Check that `variant="primary"` is applied (or the default primary button styling).
- Check that an appropriate icon from `lucide-react` is placed inside the button alongside the text.

#### Anti-Patterns (Must Flag):
- ❌ Primary page CTA rendered with `variant="outline"`, `variant="ghost"`, or `variant="secondary"`.
- ❌ Primary page CTA containing text only with no icon: `<Button>Create Assessment</Button>`.

#### Approved Pattern:
```jsx
// ✅ Correct: Primary button with leading icon
<Button variant="primary" onClick={handleCreate}>
  <Plus className="h-4 w-4" /> Create Assessment
</Button>
```

---

### Rule 8: Render `<EmptyScreen>` When Zero Data Is Returned

*Reference Guide: [references/ui-component-conventions.md](./references/ui-component-conventions.md#7-empty-state-emptyscreen-for-zero-data-pages)*
*Reference Code: [`src/pages/auto-pt/cloud-security/projects.jsx:L54-L79`](file:///mnt/localdisk/work/dev-setup/snapsec-ui/src/pages/auto-pt/cloud-security/projects.jsx#L54-L79)*

**Requirement**: When an entity collection is empty (no items exist on the page, and no search query is active), an `<EmptyScreen>` component **must** be rendered with title, subtitle, and an actionable CTA.

#### What to Check:
- Check that `page-name.jsx` guards against empty list states:
  ```jsx
  if (!isLoading && !isFetching && !searchQuery && items.length === 0) {
    return (
      <EmptyScreen
        title="No Cloud Projects Found"
        subTitle="Connect an AWS, GCP, or Azure account to scan for IAM and resource misconfigurations."
        engage={
          <Button variant="primary" onClick={openModal}>
            <Plus className="h-4 w-4" /> Create New Project
          </Button>
        }
      />
    );
  }
  ```
- Distinguish between **zero items existing** (renders `<EmptyScreen>`) vs. **active search filter returning 0 matches** (renders "No results found for search").

---

### Rule 9: Forms Must Enforce Zod Schemas (`schema.jsx`), React Hook Form, and Descriptive Placeholders

*Reference Guide: [references/form-validation-standards.md](./references/form-validation-standards.md)*
*Reference Code: [`src/pages/VM/pages/assessment/components/Modal/create-assessment-model.jsx`](file:///mnt/localdisk/work/dev-setup/snapsec-ui/src/pages/VM/pages/assessment/components/Modal/create-assessment-model.jsx)*

**Requirement**: All forms **must** enforce validation using a Zod schema co-located in `components/forms/schema.jsx` via `react-hook-form` and `@hookform/resolvers/zod`. All form controls **must** have descriptive placeholders, and submit buttons **must** be disabled when invalid or submitting.

#### What to Check:
1. **Schema Validation**:
   - Form uses `useForm({ resolver: zodResolver(schema), mode: "onChange", defaultValues: {...} })`.
   - Zod schema validates required fields, string lengths (`min`, `max`), and formats in `components/forms/schema.jsx`.
2. **Descriptive Placeholders**:
   - Every input, select, and textarea has a clear placeholder (`placeholder="Enter Assessment Name"`, `searchPlaceholder="..."`).
3. **Form Feedback & Messages**:
   - Every `<FormField>` includes a `<FormMessage />` component for rendering field errors.
4. **Submit Button State**:
   - Submit button is disabled when invalid or submitting:
     `disabled={!form.formState.isValid || form.formState.isSubmitting}`

---

## Review Workflow & Output Protocol

When reviewing a page or frontend component, the agent must strictly follow this **3-Phase Protocol**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   REVIEW WORKFLOW & OUTPUT PROTOCOL                    │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 1: Audit        │ Inspect target against Page Structure & Rules  │
│ Phase 2: Report File  │ Generate standalone FRONTEND_REVIEW_<name>.md  │
│ Phase 3: User Decision│ Present summary & file link; wait for user     │
└────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: Targeted Audit
- Inspect target component(s) and directory structure against:
  1. **Page Structure Standards** (`page-name/`, `store.js`, `page-name.jsx` composer, `components/forms/schema.jsx`, child `isLoading` contracts).
  2. **The 9 Golden UI Rules** (API error handling, iconless tabs, table cell fallbacks, iconless labels, chart card tooltips, skeletons, primary action buttons, empty screens, Zod form validation).
- Record exact file paths and line numbers for every defect found.

### Phase 2: Generate the Markdown Review Report File
The review must **not** merely be dumped in chat. The agent **must write a standalone Markdown file** documenting all findings and proposed fixes.
- **File Name**: `FRONTEND_REVIEW_<page-name>.md` in the current working directory, or `<page-directory>/FRONTEND_REVIEW.md`.
- **Mandatory Content for Each Issue**:
  1. **File**: Full or workspace-relative path.
  2. **Line**: Exact line number or range (e.g. `L42-L58`).
  3. **Issue Description**: Concise explanation of what rule is violated and its impact.
  4. **Current Code**: The offending snippet.
  5. **Proposed Fix**: Drop-in code replacement and clear instructions on how to resolve it.

*Template Reference: [references/review-output-template.md](./references/review-output-template.md)*

### Phase 3: Present Summary and Await User Decision
Once the report file is generated:
1. Provide a concise executive summary in the chat turn.
2. Link directly to the generated report file: `[FRONTEND_REVIEW_<name>.md](file:///absolute/path/to/report.md)`.
3. **DO NOT modify the codebase automatically.**
4. Ask the user how they would like to proceed:
   - Apply all proposed fixes automatically.
   - Apply specific selected fixes (e.g., "apply fixes for Issues 1, 3, and 5").
   - Leave source files untouched for manual modification.

---

## Report Structure Template

The generated Markdown file must follow this exact format:

```markdown
# 📋 Frontend Code Review Report: [Page / Component Name]

- **Target Path**: `[path/to/page-or-component]`
- **Review Date**: [YYYY-MM-DD]
- **Overall Status**: 🔴 Action Required / 🟡 Needs Minor Polish / 🟢 Approved
- **Total Issues Found**: [Count]

---

## 1. Executive Summary
[Brief 2-3 sentence overview of the component/page architecture, overall compliance, and critical findings.]

---

## 2. Detailed Issues & Fixes

### Issue 1: [Short Title, e.g. Missing ApiErrorHandler on RTK Query]
- **File**: `[path/to/file.jsx]` (Line: [LineNumber])
- **Severity**: 🔴 Critical / 🟡 Warning / 🔵 Suggestion
- **Rule Violated**: [Rule Name]
- **Issue Description**: [Detailed explanation of defect]
- **Current Code**:
  ```jsx
  // Offending snippet
  ```
- **Proposed Fix**:
  ```jsx
  // Exact replacement code
  ```

---

### Issue 2: [Short Title, e.g. TabsTrigger Contains Navigation Icon]
- **File**: `[path/to/file.jsx]` (Line: [LineNumber])
- **Severity**: 🔴 Critical / 🟡 Warning / 🔵 Suggestion
- **Rule Violated**: [Rule Name]
- **Issue Description**: [Detailed explanation of defect]
- **Current Code**:
  ```jsx
  // Offending snippet
  ```
- **Proposed Fix**:
  ```jsx
  // Exact replacement code
  ```

---

## 3. Architectural & Page Structure Audit

| Requirement | Status | Notes |
| :--- | :---: | :--- |
| **Directory Layout** (`page-name/`, `store.js`, `page-name.jsx`, `components/`) | ✅ / ❌ | [Notes] |
| **Lean Composer Pattern** (`page-name.jsx` delegates to `components/`) | ✅ / ❌ | [Notes] |
| **Zustand State Management** (`store.js` for cross-component comms) | ✅ / ❌ | [Notes] |
| **Form & Zod Schema Co-location** (`components/forms/schema.jsx`) | ✅ / ❌ | [Notes] |
| **Component `isLoading` Contract** (Localized Skeletons per component) | ✅ / ❌ | [Notes] |
| **Top-Level `ApiErrorHandler`** | ✅ / ❌ | [Notes] |
| **Top-Level `EmptyScreen`** | ✅ / ❌ | [Notes] |
| **Iconless Tab Headers** (`TabsTrigger`) | ✅ / ❌ | [Notes] |
| **Table Cell Fallbacks** (`'-'` or `'--'`) | ✅ / ❌ | [Notes] |
| **Iconless Form Labels** (`<FormLabel>`, `<Label>`) | ✅ / ❌ | [Notes] |
| **Chart Card Header Info Tooltips** | ✅ / ❌ | [Notes] |
| **Primary Action Buttons with Icons** | ✅ / ❌ | [Notes] |
| **Zod Schema & Descriptive Placeholders** | ✅ / ❌ | [Notes] |

---

## 4. Next Steps & User Decision

Please review the issues and proposed fixes above. You can choose to:
1. **Apply All Fixes**: Instruct the agent to execute all proposed fixes automatically.
2. **Selective Fixes**: Specify which issues to apply (e.g. "Apply fixes for Issues 1 and 3").
3. **Manual Adjustments**: Implement fixes manually or request alternative approaches.
```
