import type { TypedSchema, TypedSchemaError } from 'vee-validate'
import type { z } from 'zod'

/**
 * Adapts a Zod 4 schema to VeeValidate's TypedSchema.
 *
 * `@vee-validate/zod` 4.15 only supports Zod 3 (peer `zod@^3.24`) and this
 * project is on Zod 4, so `toTypedSchema` cannot be used. Swap this for the
 * official adapter once it supports Zod 4.
 */
export function toFormSchema<TSchema extends z.ZodType>(
  schema: TSchema,
): TypedSchema<z.input<TSchema>, z.output<TSchema>> {
  return {
    __type: 'VVTypedSchema',
    async parse(values) {
      const result = await schema.safeParseAsync(values)
      if (result.success) return { value: result.data, errors: [] }

      const byPath = new Map<string, string[]>()
      for (const issue of result.error.issues) {
        const path = issue.path.join('.')
        byPath.set(path, [...(byPath.get(path) ?? []), issue.message])
      }
      const errors: TypedSchemaError[] = [...byPath].map(([path, messages]) => ({
        path,
        errors: messages,
      }))
      return { errors }
    },
  }
}
