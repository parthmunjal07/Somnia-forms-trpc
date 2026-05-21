import { z } from "zod";
import { db } from "@repo/database";
import { fieldsTable } from "@repo/database/models/form";
import { eq, asc } from "drizzle-orm";

/**
 * Compiles a runtime Zod validator from a form's field definitions.
 *
 * The returned schema keys responses by field UUID:
 *   { [fieldId: string]: fieldValue }
 *
 * The public form submission payload on the frontend MUST use field.id
 * as the key — NOT field order index, label, or any other identifier.
 *
 * Example payload:
 *   { "a3f2-...": "some text", "b7c1-...": 3 }
 */
export async function compileFormSchema(formId: string) {
  const fields = await db
    .select()
    .from(fieldsTable)
    .where(eq(fieldsTable.formId, formId))
    .orderBy(asc(fieldsTable.order));

  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case "short_text":
      case "long_text":
        fieldSchema = z.string();
        break;

      case "email":
        fieldSchema = z.string().email();
        break;

      case "number":
        fieldSchema = z.coerce.number();
        break;

      case "single_select": {
        const opts = field.options as string[] | null;
        fieldSchema =
          opts && opts.length > 0
            ? z.enum(opts as [string, ...string[]])
            : z.string();
        break;
      }

      case "multi_select": {
        const opts = field.options as string[] | null;
        fieldSchema =
          opts && opts.length > 0
            ? z.array(z.enum(opts as [string, ...string[]]))
            : z.array(z.string());
        break;
      }

      case "rating": {
        let maxVal = 5;
        const opts = field.options;
        if (typeof opts === "number") {
          maxVal = opts;
        } else if (Array.isArray(opts) && opts.length > 0) {
          maxVal = Number(opts[0]) || 5;
        } else if (opts && typeof opts === "object" && !Array.isArray(opts)) {
          maxVal = (opts as Record<string, unknown>).max as number || 5;
        }
        fieldSchema = z.coerce.number().min(1).max(maxVal);
        break;
      }

      case "date":
        fieldSchema = z
          .string()
          .datetime({ precision: 3, offset: true })
          .or(z.string().date());
        break;

      case "checkbox":
        fieldSchema = z.boolean();
        break;

      default: {
        // Exhaustiveness check — TypeScript will error here if a new
        // fieldTypeEnum value is added without a corresponding case above.
        const exhaustiveCheck: never = field.type;
        throw new Error(`Unhandled field type: ${exhaustiveCheck}`);
      }
    }

    shape[field.id] = field.required ? fieldSchema : fieldSchema.optional();
  }

  return z.object(shape);
}