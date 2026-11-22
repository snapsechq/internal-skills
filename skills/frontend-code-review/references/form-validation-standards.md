# Form Validation and Input Standards

Reference: [`src/pages/VM/pages/assessment/components/Modal/create-assessment-model.jsx`](file:///mnt/localdisk/work/dev-setup/snapsec-ui/src/pages/VM/pages/assessment/components/Modal/create-assessment-model.jsx)

---

## 1. Core Architecture

All forms in the frontend must use:
1. **`react-hook-form`** (`useForm` hook)
2. **`zod`** for schema validation
3. **`@hookform/resolvers/zod`** (`zodResolver`)
4. Standard UI components: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` from `@/components/ui/form`

---

## 2. Dedicated Schema Definition in `components/forms/schema.jsx`

Schemas should be co-located with the form inside `components/forms/` (e.g. `components/forms/schema.jsx` or `components/forms/schema.js`):

```javascript
import { z } from "zod";

export const createAssessmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Assessment name is required")
    .max(35, "Assessment name must be less than 35 characters"),
  category: z
    .string()
    .min(1, "Category is required"),
  departmentIds: z
    .array(z.any())
    .default([]),
});
```

---

## 3. Standard Form Component Implementation

```jsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { createAssessmentSchema } from "./schemas/create-assessment-schema";

export function ExampleForm({ onSubmit, onSuccess }) {
  const form = useForm({
    resolver: zodResolver(createAssessmentSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      category: "",
      departmentIds: [],
    },
  });

  const handleSubmit = async (values) => {
    try {
      await onSubmit(values);
      form.reset();
      onSuccess?.();
    } catch (err) {
      // handled via toast or form.setError
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
        {/* Input Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel>
                Assessment Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter Assessment Name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button
          variant="primary"
          type="submit"
          disabled={!form.formState.isValid || form.formState.isSubmitting}
        >
          <Plus className="h-4 w-4" /> Create Assessment
        </Button>
      </form>
    </Form>
  );
}
```

---

## 4. Key Review Rules for Forms

1. **Descriptive Placeholders**:
   - Every input, select, and textarea must provide a clear, context-specific placeholder.
   - ✅ `placeholder="Enter Assessment Name"`
   - ✅ `searchPlaceholder="Search by Assessment Category Name"`
   - ❌ `placeholder=""` or generic `placeholder="Text"`
2. **No Icons Inside `<FormLabel>`**:
   - Labels must contain plain text and optional required indicator asterisk (`<span className="text-destructive">*</span>`).
   - Never embed icons inside `<FormLabel>`.
3. **Zod Validation Required**:
   - Never use manual state `const [name, setName] = useState('')` with manual `if (!name) alert(...)`.
   - Always bind form state through `react-hook-form` and `zodResolver`.
4. **Submit Button State**:
   - Submit buttons must be disabled when invalid or submitting:
     `disabled={!form.formState.isValid || form.formState.isSubmitting}`
   - Action buttons must be primary colored (`variant="primary"`) and include an action icon.
