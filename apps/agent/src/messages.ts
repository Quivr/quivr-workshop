import type { Message } from '@ag-ui/core'
import type { ModelMessage } from 'ai'

const textOf = (content: string | { type: string; text?: string }[]) =>
  typeof content === 'string'
    ? content
    : content.map(part => part.text ?? '').join('')

const parseArguments = (args: string): unknown => {
  try {
    return JSON.parse(args || '{}')
  } catch {
    return {}
  }
}

/** Converts the AG-UI chat history into AI SDK model messages. */
export const toModelMessages = (messages: Message[]): ModelMessage[] => {
  const toolNames = new Map<string, string>()

  return messages.flatMap((message): ModelMessage[] => {
    if (message.role === 'user') {
      return [{ role: 'user', content: textOf(message.content) }]
    }

    if (message.role === 'assistant') {
      const toolCalls = message.toolCalls ?? []
      toolCalls.forEach(call => toolNames.set(call.id, call.function.name))
      return [
        {
          role: 'assistant',
          content: [
            ...(message.content
              ? [{ type: 'text' as const, text: message.content }]
              : []),
            ...toolCalls.map(call => ({
              type: 'tool-call' as const,
              toolCallId: call.id,
              toolName: call.function.name,
              input: parseArguments(call.function.arguments),
            })),
          ],
        },
      ]
    }

    if (message.role === 'tool') {
      const text = textOf(message.content)
      return [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: message.toolCallId,
              toolName: toolNames.get(message.toolCallId) ?? 'unknown',
              output: message.error
                ? { type: 'error-text', value: message.error }
                : { type: 'text', value: text },
            },
          ],
        },
      ]
    }

    return []
  })
}
