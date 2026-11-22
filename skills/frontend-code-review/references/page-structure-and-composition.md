# Page Structure and Component Composition Standards

This document specifies the standard architecture and directory structure for all frontend pages in `snapsec-ui`.

---

## 1. Standard Directory Layout

Every page in the application must follow this modular directory hierarchy:

```text
page-name/
├── store.js                  # Zustand store for cross-component communication & transient state
├── page-name.jsx             # Root page component (orchestrator & composer)
└── components/               # Modular child components used to assemble the page
    ├── forms/                # Form components and validation schemas
    │   ├── form1.jsx         # Form implementation (React Hook Form)
    │   └── schema.jsx        # Zod validation schema
    ├── tables/               # Table views and column definitions
    │   └── items-table.jsx   # Accepts { data, isLoading } -> renders internal skeleton
    ├── charts/               # Chart cards
    │   └── metrics-chart.jsx # Accepts { data, isLoading } -> renders internal skeleton
    └── modals/               # Modal dialogs and drawers
        └── create-modal.jsx
```

---

## 2. Responsibilities of `page-name.jsx` (The Composer)

`page-name.jsx` is the root orchestrator. It should remain clean, lean, and declarative by composing components defined in `components/`.

### Mandatory Composer Responsibilities:
1. **API Data Fetching**: Initiates RTK Query hooks (or data fetches) for the page.
2. **Top-Level API Error Handling**: Guards against network and server failures using `<ApiErrorHandler error={error} />`.
3. **Top-Level Empty Screen Handling**: Guards against 0-data states using `<EmptyScreen />` with an actionable `engage` CTA.
4. **Component Composition**: Assembles child components (`<PageHeading />`, `<MetricsChart />`, `<ItemsTable />`, `<CreateModal />`) passing relevant data and `isLoading` flags down.
5. **Delegated Cross-Component Communication**: Relies on `store.js` rather than excessive prop drilling (more than 2 levels deep).

### Composer Blueprint:
```jsx
import { Helmet } from 'react-helmet';
import { useGetProjectsQuery } from '@/services/projectsApi';
import ApiErrorHandler from '@/components/common/api-error-handler';
import { EmptyScreen } from '@/components/common/empty-screen';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useStore } from './store';
import { ProjectsTable } from './components/tables/projects-table';
import { ProjectsMetricsChart } from './components/charts/projects-metrics-chart';
import { CreateProjectModal } from './components/forms/create-project-modal';

export default function ProjectsPage() {
  const { data: projects, isLoading, isFetching, isError, error } = useGetProjectsQuery();
  const { openCreateModal } = useStore();

  // 1. API Error Guard
  if (!isLoading && isError) {
    return <ApiErrorHandler error={error} />;
  }

  // 2. Empty Screen Guard (0 data returned and not actively searching)
  if (!isLoading && !isFetching && projects?.length === 0) {
    return (
      <EmptyScreen
        title="No Projects Found"
        subTitle="Get started by creating your first cloud security project."
        engage={
          <Button variant="primary" onClick={openCreateModal}>
            <Plus className="h-4 w-4" /> Create Project
          </Button>
        }
      />
    );
  }

  // 3. Page Composition
  return (
    <div className="p-4 space-y-6">
      <Helmet>
        <title>Snapsec | Projects</title>
      </Helmet>

      {/* Header & Metrics */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projects</h1>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </div>

      {/* Composed Child Components (Each handles its own isLoading skeleton) */}
      <ProjectsMetricsChart data={projects} isLoading={isLoading} />
      <ProjectsTable data={projects} isLoading={isLoading} />

      {/* Modal Dialog (controlled via Zustand store) */}
      <CreateProjectModal />
    </div>
  );
}
```

---

## 3. The `isLoading` Prop Contract & Localized Skeletons

Every component in `components/` that renders data must accept an `isLoading` prop and encapsulate its own loading state.

### Rules:
- The component **must** check `if (isLoading)` and render an internal `<Skeleton>` matching its exact geometry and dimensions.
- The parent page does not need to build complex composite skeletons; it simply passes `isLoading={isLoading}` down to each composed component.

### Example Child Component (`components/tables/items-table.jsx`):
```jsx
import { Skeleton } from '@/components/ui/skeleton';

export function ItemsTable({ data = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-2 border border-border rounded-lg p-4">
        <Skeleton className="h-8 w-full rounded" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg">
      {/* Table implementation with '-' or '--' empty cell fallbacks */}
    </div>
  );
}
```

---

## 4. Zustand Store (`store.js`) for Cross-Component Communication

Use `store.js` in the page directory for transient state and communication across child components (e.g. opening a modal from a table row action, filter state, selected items).

### Rules:
- Co-locate `store.js` in the root of the page folder.
- Use Zustand's `create((set) => ({ ... }))`.
- Keep persistent server data in RTK Query; use Zustand exclusively for local UI/client state.

### Example `store.js`:
```javascript
import { create } from 'zustand';

export const useStore = create((set) => ({
  // Modal state
  isCreateModalOpen: false,
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),

  // Selection & filter state
  selectedItem: null,
  setSelectedItem: (item) => set({ selectedItem: item }),
  activeTab: 'all',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
```

---

## 5. Form & Schema Co-Location (`components/forms/`)

Forms and their validation schemas must be co-located under `components/forms/`:
- `components/forms/schema.jsx` (or `.js`): Zod schema definition.
- `components/forms/form1.jsx`: React Hook Form implementation using the schema via `zodResolver`.

### Example `components/forms/schema.jsx`:
```javascript
import { z } from "zod";

export const projectFormSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
  environment: z.string().min(1, "Environment is required"),
  description: z.string().optional(),
});
```

### Example `components/forms/form1.jsx`:
```jsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { projectFormSchema } from "./schema";

export function ProjectForm({ onSubmit, isSubmitting }) {
  const form = useForm({
    resolver: zodResolver(projectFormSchema),
    mode: "onChange",
    defaultValues: { name: "", environment: "", description: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter Project Name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          variant="primary"
          type="submit"
          disabled={!form.formState.isValid || isSubmitting}
        >
          <Plus className="h-4 w-4" /> Save Project
        </Button>
      </form>
    </Form>
  );
}
```

---

## 6. Review Checklist for Page Structure

- [ ] Does the page directory contain `page-name.jsx`, `store.js`, and `components/`?
- [ ] Is `page-name.jsx` acting as a clean composer rather than a monolithic single-file implementation?
- [ ] Are forms and their Zod schemas co-located in `components/forms/` (`form1.jsx` and `schema.jsx`)?
- [ ] Does `store.js` use Zustand for cross-component communication (modal triggers, tab/filter state)?
- [ ] Does every child component in `components/` accept an `isLoading` prop and render its own internal `<Skeleton>`?
- [ ] Does `page-name.jsx` implement top-level `<ApiErrorHandler error={error} />` and `<EmptyScreen />`?
