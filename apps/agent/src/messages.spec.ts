import type { Message } from '@ag-ui/core'
import { describe, expect, it } from 'vitest'

import { toModelMessages } from './messages.js'

describe('toModelMessages', () => {
  it('converts a chat with a tool call into model messages', () => {
    const messages: Message[] = [
      { id: '1', role: 'user', content: 'Menu at Alma 2?' },
      {
        id: '2',
        role: 'assistant',
        toolCalls: [
          {
            id: 'c1',
            type: 'function',
            function: { name: 'get_menu', arguments: '{"restaurantId":"3"}' },
          },
        ],
      },
      { id: '3', role: 'tool', toolCallId: 'c1', content: '{"dishes":[]}' },
      { id: '4', role: 'assistant', content: 'Nothing today.' },
    ]

    expect(toModelMessages(messages)).toEqual([
      { role: 'user', content: 'Menu at Alma 2?' },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'c1',
            toolName: 'get_menu',
            input: { restaurantId: '3' },
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'c1',
            toolName: 'get_menu',
            output: { type: 'text', value: '{"dishes":[]}' },
          },
        ],
      },
      {
        role: 'assistant',
        content: [{ type: 'text', text: 'Nothing today.' }],
      },
    ])
  })
})
