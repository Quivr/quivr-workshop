import { config } from 'agent/config'
import { languageModel } from 'agent/models'
import { generateText, Output } from 'ai'
import { z } from 'zod'

import type { AgentResult } from './run.js'

export type Score = { name: string; score: number; reason: string }

const normalise = (text: string) => text.toLowerCase().replace(/\s+/g, ' ')

/** Deterministic: every required fact (string or regex) appears in the answer. */
export const includesFacts = (
  result: AgentResult,
  facts: (string | RegExp)[]
): Score => {
  const text = normalise(result.text)
  const missing = facts.filter(fact =>
    typeof fact === 'string'
      ? !text.includes(normalise(fact))
      : !fact.test(result.text)
  )
  return {
    name: 'facts',
    score: facts.length ? (facts.length - missing.length) / facts.length : 1,
    reason: missing.length
      ? `missing: ${missing.join(', ')}`
      : 'all facts present',
  }
}

/** Deterministic: each expected tool was called at least once. */
export const usedTools = (result: AgentResult, tools: string[]): Score => {
  const called = new Set(result.toolCalls.map(call => call.toolName))
  const missing = tools.filter(tool => !called.has(tool))
  return {
    name: 'tools',
    score: tools.length ? (tools.length - missing.length) / tools.length : 1,
    reason: missing.length
      ? `not called: ${missing.join(', ')} (called: ${[...called].join(', ') || 'none'})`
      : 'expected tools called',
  }
}

const verdictSchema = z.object({
  score: z.number().min(0).max(1).describe('1 = fully correct, 0 = wrong'),
  reason: z.string().describe('One short sentence'),
})

/** LLM-as-judge: does the answer match the expected answer, without inventing things? */
export const judge = async (
  question: string,
  expected: string,
  result: AgentResult
): Promise<Score> => {
  const { output } = await generateText({
    model: languageModel(config.judgeModel),
    output: Output.object({ schema: verdictSchema }),
    prompt: `You grade a student assistant. Compare its answer with the expected answer.
Score 1 if it gives the same key information and invents nothing, 0.5 if partly right, 0 if wrong or made up.

Question: ${question}
Expected answer: ${expected}
Assistant answer: ${result.text}`,
  })
  return { name: 'judge', ...output }
}
