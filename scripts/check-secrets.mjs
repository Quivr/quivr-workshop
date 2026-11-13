// Fails if a staged file (or, with --all, any tracked file) contains something that looks like a secret.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const PATTERNS = [
  { name: 'Anthropic API key', regex: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: 'OpenAI-style API key', regex: /\bsk-[A-Za-z0-9]{32,}/ },
  {
    name: 'Quivr token in env format',
    regex: /QUIVR_(ACCESS_TOKEN|CLIENT)=\S{8,}/,
  },
  { name: 'Private key', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
]
const IGNORED = [/^\.env$/, /yarn\.lock$/, /\.(png|woff|svg|ico)$/]

const isAll = process.argv.includes('--all')
const gitArgs = isAll
  ? ['ls-files']
  : ['diff', '--cached', '--name-only', '--diff-filter=ACM']
const files = execFileSync('git', gitArgs, { encoding: 'utf8' })
  .split('\n')
  .filter(file => file && existsSync(file) && !IGNORED.some(r => r.test(file)))

const findings = files.flatMap(file => {
  const content = readFileSync(file, 'utf8')
  return PATTERNS.filter(({ regex }) => regex.test(content)).map(
    ({ name }) => `${file}: looks like a ${name}`
  )
})

if (findings.length > 0) {
  console.error(
    ['Possible secrets found, not committing:', ...findings].join('\n  ')
  )
  process.exit(1)
}
