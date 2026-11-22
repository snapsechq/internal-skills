# Review Output Report Template

When performing a frontend code review, the agent must generate a dedicated markdown report file (e.g., `FRONTEND_REVIEW_<page-name>.md` or `<page-directory>/FRONTEND_REVIEW.md`).

The generated file must adhere to this structured format:

---

```markdown
# 📋 Frontend Code Review Report: [Page / Component Name]

- **Target Path**: `[path/to/page-or-component]`
- **Review Date**: [YYYY-MM-DD]
- **Overall Status**: 🔴 Action Required / 🟡 Needs Minor Polish / 🟢 Approved
- **Total Issues Found**: [Count] (Critical: [Count], Warnings: [Count], Suggestions: [Count])

---

## 1. Executive Summary

[Brief 2-3 sentence overview of the component/page architecture, overall adherence to Snapsec frontend standards, and main areas needing attention.]

---

## 2. Issues Breakdown

### Issue 1: [Short Descriptive Title, e.g. Missing ApiErrorHandler on RTK Query]
- **File**: `[file/path.jsx]` (Line: [LineNumber])
- **Severity**: 🔴 Critical / 🟡 Warning / 🔵 Suggestion
- **Rule Violated**: [Rule Name, e.g. Rule 1: API Error Handling]
- **Issue Description**:
  [Detailed description explaining the defect, why it violates the standard, and its runtime impact.]
- **Current Code**:
  ```jsx
  // [Relevant snippet from target file]
  ```
- **Proposed Fix**:
  ```jsx
  // [Exact replacement code resolving the issue]
  ```

---

### Issue 2: [Short Descriptive Title, e.g. TabsTrigger Contains Navigation Icon]
- **File**: `[file/path.jsx]` (Line: [LineNumber])
- **Severity**: 🔴 Critical / 🟡 Warning / 🔵 Suggestion
- **Rule Violated**: [Rule Name, e.g. Rule 2: Tabs Must Never Contain Icons]
- **Issue Description**:
  [Detailed description explaining the defect.]
- **Current Code**:
  ```jsx
  // [Relevant snippet from target file]
  ```
- **Proposed Fix**:
  ```jsx
  // [Exact replacement code resolving the issue]
  ```

---

### Issue 3: [Short Descriptive Title, e.g. Table Cell Missing Empty Value Fallback]
- **File**: `[file/path.jsx]` (Line: [LineNumber])
- **Severity**: 🔴 Critical / 🟡 Warning / 🔵 Suggestion
- **Rule Violated**: [Rule Name, e.g. Rule 3: Table Cells Empty Value Fallback]
- **Issue Description**:
  [Detailed description explaining the defect.]
- **Current Code**:
  ```jsx
  // [Relevant snippet from target file]
  ```
- **Proposed Fix**:
  ```jsx
  // [Exact replacement code resolving the issue]
  ```

---

## 3. Architectural & Page Structure Audit Checklist

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
2. **Selective Fixes**: Specify which issues to apply (e.g. "Apply fixes for Issues 1, 3, and 5").
3. **Manual Adjustments**: Implement fixes manually or request alternative approaches.
```
