type McpToolResult = {
  content: { type: string; text?: string }[]
  isError?: boolean
}

const isMcpResult = (output: unknown): output is McpToolResult =>
  typeof output === 'object' &&
  output !== null &&
  'content' in output &&
  Array.isArray(output.content)

/** The text a tool returned (MCP tools return JSON as text). */
export const toolOutputText = (output: unknown): string => {
  if (typeof output === 'string') return output
  if (!isMcpResult(output)) return JSON.stringify(output)
  return output.content.map(part => part.text ?? '').join('')
}

export const isToolError = (output: unknown): boolean =>
  isMcpResult(output) && output.isError === true
