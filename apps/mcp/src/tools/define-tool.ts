import { z } from 'zod'

import type { QuivrClient } from '../quivr/quivr-client.js'

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD format')

export type ToolDefinition<Shape extends z.ZodRawShape = z.ZodRawShape> = {
  name: string
  description: string
  inputSchema: Shape
  run: (
    input: z.infer<z.ZodObject<Shape>>,
    quivr: QuivrClient
  ) => Promise<unknown>
}

export const defineTool = <Shape extends z.ZodRawShape>(
  tool: ToolDefinition<Shape>
): ToolDefinition<Shape> => tool
