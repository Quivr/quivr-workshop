import { anthropic } from '@ai-sdk/anthropic'
import { createProviderRegistry, type LanguageModel } from 'ai'

import { config } from './config.js'

/**
 * The only file that knows about LLM providers.
 * To add one: `yarn workspace agent add @ai-sdk/openai`, import it, add it below,
 * then add e.g. `openai:gpt-...` to ALLOWED_MODELS in .env.
 */
export const registry = createProviderRegistry({
  anthropic,
})

type ModelId = Parameters<typeof registry.languageModel>[0]

/** Any registered model, without the allow-list check (used by the judge). */
export const languageModel = (id: string): LanguageModel =>
  registry.languageModel(id as ModelId)

/** A chat model from the allow-list, or the default one. */
export const resolveModel = (requested?: string) => {
  const id = requested || config.defaultModel
  if (!config.allowedModels.includes(id)) {
    throw new Error(
      `Model "${id}" is not allowed. Allowed: ${config.allowedModels.join(', ')}`
    )
  }
  return { id, model: languageModel(id) }
}
