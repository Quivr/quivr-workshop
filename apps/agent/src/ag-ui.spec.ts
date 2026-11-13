import { EventType, type BaseEvent } from '@ag-ui/core'
import { describe, expect, it } from 'vitest'

import { TOOL_TIMING_EVENT, toAgUiEvents } from './ag-ui.js'
import type { AgentStreamPart } from './run-agent.js'

const ids = { threadId: 'thread-1', runId: 'run-1' }

async function* streamOf(parts: object[]) {
  for (const part of parts) yield part as AgentStreamPart
}

const collect = async (parts: object[]) => {
  const events: BaseEvent[] = []
  for await (const event of toAgUiEvents(streamOf(parts), ids)) {
    events.push(event)
  }
  return events
}

describe('toAgUiEvents', () => {
  it('wraps text in run and message events', async () => {
    const events = await collect([
      { type: 'text-start', id: 't1' },
      { type: 'text-delta', id: 't1', text: 'Hello' },
      { type: 'text-delta', id: 't1', text: '' },
      { type: 'text-end', id: 't1' },
      { type: 'finish' },
    ])

    expect(events.map(e => e.type)).toEqual([
      EventType.RUN_STARTED,
      EventType.TEXT_MESSAGE_START,
      EventType.TEXT_MESSAGE_CONTENT,
      EventType.TEXT_MESSAGE_END,
      EventType.RUN_FINISHED,
    ])
    expect(events[2]).toMatchObject({ delta: 'Hello' })
    expect(events[1]?.messageId).toBe(events[2]?.messageId)
  })

  it('emits tool call start, args, end and the MCP text result', async () => {
    const events = await collect([
      {
        type: 'tool-call',
        toolCallId: 'c1',
        toolName: 'get_menu',
        input: { date: '2026-11-13' },
      },
      {
        type: 'tool-result',
        toolCallId: 'c1',
        toolName: 'get_menu',
        input: {},
        output: { content: [{ type: 'text', text: '{"dishes":[]}' }] },
      },
    ])

    expect(events.map(e => e.type)).toEqual([
      EventType.RUN_STARTED,
      EventType.TOOL_CALL_START,
      EventType.TOOL_CALL_ARGS,
      EventType.TOOL_CALL_END,
      EventType.TOOL_CALL_RESULT,
      EventType.CUSTOM,
      EventType.RUN_FINISHED,
    ])
    expect(events[1]).toMatchObject({ toolCallName: 'get_menu' })
    expect(events[2]).toMatchObject({ delta: '{"date":"2026-11-13"}' })
    expect(events[4]).toMatchObject({
      toolCallId: 'c1',
      content: '{"dishes":[]}',
    })
    expect(events[5]).toMatchObject({ name: TOOL_TIMING_EVENT })
  })

  it('marks MCP tool errors in the result', async () => {
    const events = await collect([
      { type: 'tool-call', toolCallId: 'c1', toolName: 'get_menu', input: {} },
      {
        type: 'tool-result',
        toolCallId: 'c1',
        toolName: 'get_menu',
        input: {},
        output: {
          isError: true,
          content: [{ type: 'text', text: 'Not logged in' }],
        },
      },
    ])

    const result = events.find(e => e.type === EventType.TOOL_CALL_RESULT)
    expect(result).toMatchObject({ content: 'Error: Not logged in' })
  })

  it('turns a failing stream into a RUN_ERROR instead of crashing', async () => {
    async function* failing(): AsyncGenerator<AgentStreamPart> {
      yield* []
      throw new Error('Model "x" is not allowed')
    }
    const events: BaseEvent[] = []
    for await (const event of toAgUiEvents(failing(), ids)) events.push(event)

    expect(events.at(-1)).toMatchObject({
      type: EventType.RUN_ERROR,
      message: 'Model "x" is not allowed',
    })
  })
})
