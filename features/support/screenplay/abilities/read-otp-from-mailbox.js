import { connect } from 'node:tls'

function env(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required for @email BDD scenarios.`)
  return value
}

function quote(value) {
  return `"${value.replace(/["\\]/gu, '\\$&')}"`
}

function connectImap(host, port = 993) {
  return new Promise((resolve, reject) => {
    const socket = connect({ host, port, servername: host, rejectUnauthorized: true })
    socket.once('secureConnect', () => resolve(socket))
    socket.once('error', reject)
  })
}

async function readUntil(socket, tag) {
  let buffer = ''
  return await new Promise((resolve, reject) => {
    const onData = (chunk) => {
      buffer += chunk.toString('utf8')
      if (buffer.includes(`\r\n${tag} `) || buffer.startsWith(`${tag} `)) {
        cleanup()
        resolve(buffer)
      }
    }
    const onError = (error) => {
      cleanup()
      reject(error)
    }
    const cleanup = () => {
      socket.off('data', onData)
      socket.off('error', onError)
    }
    socket.on('data', onData)
    socket.on('error', onError)
  })
}

async function command(socket, tag, text) {
  socket.write(`${tag} ${text}\r\n`)
  const reply = await readUntil(socket, tag)
  if (!new RegExp(`${tag} OK`, 'u').test(reply)) {
    throw new Error(`IMAP command failed: ${text}`)
  }
  return reply
}

function parseSearchIds(reply) {
  const line = reply.split(/\r?\n/u).find((entry) => entry.startsWith('* SEARCH '))
  if (!line) return []
  return line
    .slice('* SEARCH '.length)
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .map((value) => Number(value))
    .filter(Number.isFinite)
}

function extractOtpFromMessage(message) {
  if (!message) return null
  const patterns = [
    /recovery email verification code is:\s*(\d{6})/iu,
    /password recovery code is:\s*(\d{6})/iu,
    /\b(\d{6})\b/u,
  ]
  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

async function latestMessageFor(recipient) {
  const host = env('NUXT_TEST_IMAP_HOST')
  const user = env('NUXT_TEST_IMAP_USER')
  const pass = env('NUXT_TEST_IMAP_PASS')
  const socket = await connectImap(host)
  try {
    await readUntil(socket, '* OK')
    await command(socket, 'A1', `LOGIN ${quote(user)} ${quote(pass)}`)
    await command(socket, 'A2', 'SELECT INBOX')
    const search = await command(socket, 'A3', `SEARCH TEXT ${quote(recipient)}`)
    const ids = parseSearchIds(search)
    if (!ids.length) return null
    const latest = Math.max(...ids)
    return await command(socket, 'A4', `FETCH ${latest} BODY.PEEK[]`)
  } finally {
    socket.write('A9 LOGOUT\r\n')
    socket.end()
  }
}

export class ReadOtpFromMailbox {
  static recoveryEmailFor(actor) {
    const domain = env('NUXT_TEST_EMAIL_DOMAIN').replace(/^@/u, '')
    const slug = actor.name.toLowerCase().replace(/[^a-z0-9]+/gu, '-') || 'reader'
    const unique = `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`
    return `${slug}-${unique}@${domain}`
  }

  static async latestCodeFor(recipient) {
    const deadline = Date.now() + 60_000
    while (Date.now() < deadline) {
      const message = await latestMessageFor(recipient)
      const code = extractOtpFromMessage(message)
      if (code) return code
      await new Promise((resolve) => setTimeout(resolve, 2_000))
    }
    throw new Error(`No OTP email arrived for ${recipient}.`)
  }
}
