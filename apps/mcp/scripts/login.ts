import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline/promises'

import { loadConfig } from '../src/config.js'
import { updateEnvFile } from './env-file.js'

type LoginResponse = {
  success?: boolean
  need_otp?: boolean
  errors?: string[]
  data?: { user: { email: string }; access_token: string; client: string }
}

const ask = async (question: string, hidden = false): Promise<string> => {
  const rl = createInterface({ input: stdin, output: stdout, terminal: true })
  if (hidden) {
    const write = stdout.write.bind(stdout)
    // Echo the question, but mask everything typed after it.
    ;(rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput =
      s =>
        write(s.startsWith(question) ? question : s.includes('\n') ? '\n' : '*')
  }
  const answer = await rl.question(question)
  rl.close()
  if (hidden) stdout.write('\n')
  return answer.trim()
}

const login = async (body: Record<string, string>): Promise<LoginResponse> => {
  const response = await fetch(`${loadConfig().baseUrl}/api/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  return (await response.json()) as LoginResponse
}

const { baseUrl } = loadConfig()
console.info(
  `Log in to Quivr (${baseUrl}). Your password is only sent to Quivr.`
)
const email = await ask('Email: ')
const password = await ask('Password: ', true)

let result = await login({ email, password })
if (result.success === false && result.need_otp) {
  const otp = await ask('One-time code: ', true)
  result = await login({ email, password, otp_attempt: otp })
}

if (!result.data) {
  console.error(
    `\nLogin failed: ${result.errors?.join(', ') ?? 'unknown error'}`
  )
  process.exit(1)
}

updateEnvFile({
  QUIVR_UID: result.data.user.email,
  QUIVR_CLIENT: result.data.client,
  QUIVR_ACCESS_TOKEN: result.data.access_token,
})
console.info(
  '\nLogged in. Token saved to .env. Run `just logout` when you are done.'
)
