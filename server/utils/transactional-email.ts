import { connect as tlsConnect, type TLSSocket } from 'node:tls'

type SmtpConfig = {
  host: string
  port: number
  user: string
  pass: string
}

type MailMessage = {
  to: string
  subject: string
  text: string
}

function parseHost(raw: string): { host: string; port: number } {
  const value = raw.trim()
  const match = /^(?<host>[^:]+):(?<port>\d+)$/u.exec(value)
  if (!match?.groups) return { host: value, port: 465 }
  const host = match.groups.host ?? value
  return { host, port: Number(match.groups.port) || 465 }
}

function smtpConfig(): SmtpConfig | null {
  const rawHost = process.env.NUXT_SMTP_HOST?.trim()
  const user = process.env.NUXT_SMTP_USER?.trim()
  const pass = process.env.NUXT_SMTP_PASS?.trim()
  if (!rawHost || !user || !pass) return null
  const { host, port } = parseHost(rawHost)
  return { host, port, user, pass }
}

function encodeHeader(value: string): string {
  return value.replace(/[\r\n]+/gu, ' ').trim()
}

function dotStuff(text: string): string {
  return text.replace(/^\./gmu, '..')
}

async function readReply(socket: TLSSocket): Promise<string> {
  let buffer = ''
  return await new Promise((resolve, reject) => {
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString('utf8')
      const lines = buffer.split(/\r?\n/u).filter(Boolean)
      const last = lines.at(-1)
      if (last && /^\d{3} /u.test(last)) {
        cleanup()
        resolve(buffer)
      }
    }
    const onError = (error: Error) => {
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

function assertPositiveReply(reply: string, command: string) {
  const code = Number(reply.slice(0, 3))
  if (code < 200 || code >= 400) {
    throw new Error(`SMTP ${command} failed with ${reply.trim()}`)
  }
}

async function sendCommand(socket: TLSSocket, command: string): Promise<string> {
  socket.write(`${command}\r\n`)
  const reply = await readReply(socket)
  assertPositiveReply(reply, command.split(' ', 1)[0] ?? command)
  return reply
}

function connectSmtp(config: SmtpConfig): Promise<TLSSocket> {
  return new Promise((resolve, reject) => {
    const socket = tlsConnect({
      host: config.host,
      port: config.port,
      servername: config.host,
      rejectUnauthorized: true,
    })
    socket.once('secureConnect', () => resolve(socket))
    socket.once('error', reject)
  })
}

export function isTransactionalEmailConfigured(): boolean {
  return smtpConfig() !== null
}

export async function sendTransactionalEmail(message: MailMessage): Promise<void> {
  const config = smtpConfig()
  if (!config) {
    throw new Error('SMTP is not configured')
  }

  const socket = await connectSmtp(config)
  try {
    assertPositiveReply(await readReply(socket), 'CONNECT')
    await sendCommand(socket, 'EHLO infl0.local')
    await sendCommand(socket, `AUTH PLAIN ${Buffer.from(`\0${config.user}\0${config.pass}`).toString('base64')}`)
    await sendCommand(socket, `MAIL FROM:<${config.user}>`)
    await sendCommand(socket, `RCPT TO:<${message.to}>`)
    await sendCommand(socket, 'DATA')
    const body = [
      `From: ${config.user}`,
      `To: ${message.to}`,
      `Subject: ${encodeHeader(message.subject)}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      dotStuff(message.text),
    ].join('\r\n')
    socket.write(`${body}\r\n.\r\n`)
    assertPositiveReply(await readReply(socket), 'DATA body')
    await sendCommand(socket, 'QUIT').catch(() => undefined)
  } finally {
    socket.end()
  }
}
