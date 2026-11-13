import { randomUUID } from 'node:crypto'

import { EventType, type BaseEvent } from '@ag-ui/core'

import type { AgentStreamPart } from './run-agent.js'
import { isToolError, toolOutputText } from './tool-output.js'

export const TOOL_TIMING_EVENT = 'tool_timing'

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

/** Translates the AI SDK stream into AG-UI events. */
export async function* toAgUiEvents(
  parts: AsyncIterable<AgentStreamPart>,
  ids: { threadId: string; runId: string }
): AsyncGenerator<BaseEvent> {
  const messageIds = new Map<string, string>()
  const startedToolCalls = new Set<string>()
  const toolCallStart = new Map<string, number>()

  yield { type: EventType.RUN_STARTED, ...ids }

  try {
    for await (const part of parts) {
      switch (part.type) {
        case 'text-start': {
          const messageId = randomUUID()
          messageIds.set(part.id, messageId)
          yield {
            type: EventType.TEXT_MESSAGE_START,
            messageId,
            role: 'assistant',
          }
          break
        }
        case 'text-delta':
          if (part.text) {
            yield {
              type: EventType.TEXT_MESSAGE_CONTENT,
              messageId: messageIds.get(part.id),
              delta: part.text,
            }
          }
          break
        case 'text-end':
          yield {
            type: EventType.TEXT_MESSAGE_END,
            messageId: messageIds.get(part.id),
          }
          break
        case 'tool-input-start':
          startedToolCalls.add(part.id)
          yield {
            type: EventType.TOOL_CALL_START,
            toolCallId: part.id,
            toolCallName: part.toolName,
          }
          break
        case 'tool-input-delta':
          yield {
            type: EventType.TOOL_CALL_ARGS,
            toolCallId: part.id,
            delta: part.delta,
          }
          break
        case 'tool-call':
          if (!startedToolCalls.has(part.toolCallId)) {
            yield {
              type: EventType.TOOL_CALL_START,
              toolCallId: part.toolCallId,
              toolCallName: part.toolName,
            }
            yield {
              type: EventType.TOOL_CALL_ARGS,
              toolCallId: part.toolCallId,
              delta: JSON.stringify(part.input ?? {}),
            }
          }
          toolCallStart.set(part.toolCallId, Date.now())
          yield { type: EventType.TOOL_CALL_END, toolCallId: part.toolCallId }
          break
        case 'tool-result':
        case 'tool-error': {
          const failed = part.type === 'tool-error' || isToolError(part.output)
          const text =
            part.type === 'tool-error'
              ? errorMessage(part.error)
              : toolOutputText(part.output)
          yield {
            type: EventType.TOOL_CALL_RESULT,
            messageId: randomUUID(),
            toolCallId: part.toolCallId,
            role: 'tool',
            content: failed ? `Error: ${text}` : text,
          }
          yield {
            type: EventType.CUSTOM,
            name: TOOL_TIMING_EVENT,
            value: {
              toolCallId: part.toolCallId,
              durationMs:
                Date.now() - (toolCallStart.get(part.toolCallId) ?? Date.now()),
            },
          }
          break
        }
        case 'error':
          yield { type: EventType.RUN_ERROR, message: errorMessage(part.error) }
          return
        default:
          break
      }
    }
    yield { type: EventType.RUN_FINISHED, ...ids }
  } catch (error) {
    yield { type: EventType.RUN_ERROR, message: errorMessage(error) }
  }
}
