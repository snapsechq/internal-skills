# API Error Handling Guide for Frontend Review

This guide outlines the mandatory API error handling standards in `snapsec-ui`, based on the application architecture and `api-error-handling-full.md`.

---

## 1. Core Component: `ApiErrorHandler`

The standard error presentation component is:
```jsx
import ApiErrorHandler from '@/components/common/api-error-handler';
```

`ApiErrorHandler` automatically handles standard HTTP status codes:
- **`404`**: Displays resource not found screen (`Error404`).
- **`403`**: Displays access denied / permission required screen (`Error403`).
- **`500`**: Displays internal server error screen (`Error500`).
- **`503`**: Displays system maintenance screen (`MaintenanceError`).
- **Network / Other**: Displays a fallback retry card.

---

## 2. Standard RTK Query Pattern

When a page mounts and fetches data using Redux Toolkit (RTK) Query:

```jsx
import ApiErrorHandler from '@/components/common/api-error-handler';
import { useGetProjectsQuery } from '@/services/projectsApi';
import PageSkeleton from './components/page-skeleton';

export default function ProjectsPage() {
  const { data, isLoading, isFetching, isError, error } = useGetProjectsQuery();

  // 1. Loading state handled with layout skeleton
  if (isLoading) {
    return <PageSkeleton />;
  }

  // 2. Error state MUST be guarded with ApiErrorHandler
  if (isError) {
    return <ApiErrorHandler error={error} />;
  }

  // 3. Render content
  return (
    <div className="p-4 space-y-4">
      {/* Page Content */}
    </div>
  );
}
```

---

## 3. Multiple Query Handling

When a page depends on multiple queries, all primary queries that block the page render must be checked:

```jsx
const { data: user, isLoading: userLoading, isError: userError, error: uErr } = useGetUserQuery();
const { data: stats, isLoading: statsLoading, isError: statsError, error: sErr } = useGetStatsQuery();

if (userLoading || statsLoading) return <DashboardSkeleton />;
if (userError) return <ApiErrorHandler error={uErr} />;
if (statsError) return <ApiErrorHandler error={sErr} />;
```

---

## 4. Standard Fetch Pattern (Public Pages & Reports)

For unauthenticated or public reports using native `fetch`:

```jsx
import { useState, useEffect } from 'react';
import ApiErrorHandler from '@/components/common/api-error-handler';

export default function PublicReport({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/reports/${token}`);
        if (!res.ok) {
          setApiError({ status: res.status, data: { message: res.statusText } });
          return;
        }
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setApiError({ status: 500, data: { message: err?.message || 'Network error' } });
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [token]);

  if (loading) return <ReportSkeleton />;
  if (apiError) return <ApiErrorHandler error={apiError} />;

  return <div>{/* Report */}</div>;
}
```

---

## 5. Review Checklist & Anti-Patterns to Flag

| Anti-Pattern | Why It Fails | Required Correction |
|:---|:---|:---|
| **Omitting `isError` / `error`**<br>`const { data, isLoading } = useGetQuery()` | When the endpoint fails, the page shows empty states or crashes with `undefined` property access. | Destructure `isError, error` and return `<ApiErrorHandler error={error} />`. |
| **Inline Plain Text Error**<br>`if (error) return <p>Error loading</p>` | Breaks design consistency and ignores HTTP status codes (403, 404, 500). | Replace with `<ApiErrorHandler error={error} />`. |
| **Silent Fallback to Mock Data**<br>`const list = data \|\| defaultMockList` | Hides backend bugs and confuses users with stale mock data. | Guard with `if (isError) return <ApiErrorHandler error={error} />;`. |
| **Unguarded Tab Shells**<br>Tab shell ignores errors while child tabs crash. | In tabs, either guard the top-level query or each child tab must handle its query errors. | Add `<ApiErrorHandler error={error} />` guard. |
