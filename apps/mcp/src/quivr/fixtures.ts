import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { FIXTURES_DIR } from '../config.js'

type FixtureFile = Record<string, unknown>

const sortKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value === null || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => [key, sortKeys(nested)])
  )
}

export const fixtureKey = (variables: object): string =>
  JSON.stringify(sortKeys(variables))

const fileFor = (operationName: string, dir: string) =>
  join(dir, `${operationName}.json`)

export const readFixture = (
  operationName: string,
  variables: object,
  dir = FIXTURES_DIR
): unknown => {
  const file = fileFor(operationName, dir)
  const fixtures: FixtureFile = existsSync(file)
    ? (JSON.parse(readFileSync(file, 'utf8')) as FixtureFile)
    : {}
  const key = fixtureKey(variables)
  if (!(key in fixtures)) {
    throw new Error(
      `No recorded data for ${operationName} with ${key} (QUIVR_MODE=fixtures). Only dates around the recording day are available.`
    )
  }
  return fixtures[key]
}

export const writeFixtures = (
  operationName: string,
  entries: FixtureFile,
  dir = FIXTURES_DIR
) => {
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    fileFor(operationName, dir),
    `${JSON.stringify(entries, null, 2)}\n`
  )
}
