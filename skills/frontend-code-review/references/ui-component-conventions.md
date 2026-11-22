# UI Component Conventions & Design Standards

This guide provides concrete implementation patterns for the UI design rules enforced during frontend code review.

---

## 1. Tabs: Clean, Text-Only Navigation

### Rule
**If a page has Tab-based UI, `<TabsTrigger>` must NEVER have icons in them.**

### Why
Tabs serve as primary category and view selectors. Embedding icons in tab triggers causes visual clutter, misaligns tab text, wastes horizontal screen real estate, and breaks responsiveness across screen sizes.

### Pattern
```jsx
// ❌ REJECTED: Icons inside TabsTrigger
<TabsList>
  <TabsTrigger value="overview">
    <Home className="h-4 w-4" /> Overview
  </TabsTrigger>
  <TabsTrigger value="vulnerabilities">
    <ShieldAlert className="h-4 w-4" /> Vulnerabilities
  </TabsTrigger>
</TabsList>

// ✅ APPROVED: Clean text-only tabs (with optional count badges)
<TabsList>
  <TabsTrigger value="overview">Overview</TabsTrigger>
  <TabsTrigger value="vulnerabilities">
    Vulnerabilities <Badge size="sm" variant="secondary" className="ml-1.5">14</Badge>
  </TabsTrigger>
  <TabsTrigger value="settings">Settings</TabsTrigger>
</TabsList>
```

---

## 2. Table Cells: Empty Value Fallbacks (`-` or `--`)

### Rule
**In a table cell, an empty value (null, undefined, or empty string `""`) must be rendered as `'-'` or `'--'`.**

### Why
Leaving a table cell blank looks like an unrendered defect, broken fetch, or missing column data. Explicit fallback indicators reassure the user that the property is intentionally unset.

### Pattern
```jsx
// ❌ REJECTED: Blank or undefined output
cell: ({ row }) => (
  <span>{row.original.description}</span>
)

// ✅ APPROVED: Fallback with '-' or '--'
cell: ({ row }) => {
  const value = row.original.description;
  return (
    <span className={!value ? 'text-muted-foreground' : ''}>
      {value || '-'}
    </span>
  );
}

// Or with double dash:
cell: ({ row }) => <span>{row.original.ipAddress ?? '--'}</span>
```

---

## 3. Labels: Zero Icons Inside `<Label>` / `<FormLabel>`

### Rule
**Inside `<Label>` and `<FormLabel>`, NEVER include icons.**

### Why
Icons inside labels interfere with standard typography line-heights, break label-for focus associations for accessibility and screen readers, and add unnecessary noise. Explanations or helper icons belong adjacent to or below the label.

### Pattern
```jsx
// ❌ REJECTED: Icon embedded inside label
<FormLabel className="flex items-center gap-1">
  <Info className="h-4 w-4" /> Assessment Name
</FormLabel>

// ✅ APPROVED: Clean text with optional required marker; info tooltip placed externally
<div className="flex items-center justify-between">
  <FormLabel>
    Assessment Name <span className="text-destructive">*</span>
  </FormLabel>
  <CustomTooltip text="Unique name identifying this assessment campaign.">
    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-pointer" />
  </CustomTooltip>
</div>
```

---

## 4. Chart Cards: Header with Info Hover Tooltip

### Rule
**The card component inside of which a chart is shown must have an info icon to the right. On hover, it must show an explanatory tooltip about the chart.**

### Why
Charts represent aggregated, domain-specific metrics. Users need immediate clarity on what data is visualized, calculation formulas, and time windows without needing to read external documentation.

### Pattern
```jsx
import { Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CustomTooltip } from '@/components/custom/tooltip';

export function VulnerabilityDistributionChart({ data, isLoading }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Vulnerability Distribution
        </CardTitle>
        <CustomTooltip text="Aggregated count of active vulnerabilities grouped by severity rating according to CVSS v3.1 scoring.">
          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
        </CustomTooltip>
      </CardHeader>
      <CardContent>
        {/* Chart Visualization */}
      </CardContent>
    </Card>
  );
}
```

---

## 5. Loading State: Layout-Reflecting Skeletons

### Rule
**Page loading states must be represented by Skeleton components that reflect the actual layout and structure of the page.**

### Why
Generic circular spinners cause jarring Layout Shift (CLS) when data loads. Skeletons prime the user for where headers, stat cards, charts, and tables will appear.

### Pattern
```jsx
// ❌ REJECTED: Generic spinner or blank screen
if (isLoading) return <div className="spinner"><Loader /></div>;

// ✅ APPROVED: Skeleton matching exact page grid and layout
import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>

      {/* Main Table / Chart Skeleton */}
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  );
}
```

---

## 6. Page-Level Action Buttons: Primary Variant with Action Icon

### Rule
**Global or page-level action buttons (primary CTAs) must be styled with the primary color and include an icon.**

### Why
Primary CTAs ("Create Project", "Add Vulnerability", "Export Report") are the most important actions on a page. Clear visual weight (`variant="primary"`) and intuitive icons provide quick visual scanning and guide user workflow.

### Pattern
```jsx
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

// ❌ REJECTED: Missing icon, or using secondary/outline for primary CTA
<Button variant="outline">Create Assessment</Button>
<Button variant="primary">Create Assessment</Button> {/* Missing icon */}

// ✅ APPROVED: Primary variant with icon
<Button variant="primary">
  <Plus className="h-4 w-4" /> Create Assessment
</Button>
```

---

## 7. Empty State: `EmptyScreen` for Zero-Data Pages

### Rule
**If no data is returned on the page (empty collection, no items created yet), an `<EmptyScreen>` component must be rendered.**

Reference: [`src/pages/auto-pt/cloud-security/projects.jsx:L54-L79`](file:///mnt/localdisk/work/dev-setup/snapsec-ui/src/pages/auto-pt/cloud-security/projects.jsx#L54-L79)

### Distinction
- **Empty Collection (0 items exist in organization):** Render `<EmptyScreen title="..." subTitle="..." engage={<Button>Create...</Button>} />`.
- **Active Search / Filter Yields 0 matches:** Render an in-table "No matching results found for '[query]'" message with a "Clear Filters" button.

### Pattern
```jsx
import EmptyScreen from '@/components/common/empty-screen';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

if (!isLoading && !isFetching && !searchQuery && items.length === 0) {
  return (
    <EmptyScreen
      title="No Cloud Projects Found"
      subTitle="Connect an AWS, GCP, or Azure account to scan for IAM and resource misconfigurations."
      engage={
        <Button variant="primary" onClick={handleCreate}>
          <Plus className="h-4 w-4" /> Create New Project
        </Button>
      }
    />
  );
}
```
