/**
 * Regenerate committed PWA icons from public/pwa/icon.svg.
 * Run: ./scripts/with-nvm.sh node scripts/generate-pwa-icons.mjs
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(root, 'public')
const svgPath = path.join(publicDir, 'pwa', 'icon.svg')
const svg = await readFile(svgPath)

async function writePng(name, size, { maskable = false } = {}) {
  const out = path.join(publicDir, name)
  let pipeline = sharp(svg).resize(size, size)
  if (maskable) {
    const iconSize = Math.round(size * 0.8)
    const pad = Math.round((size - iconSize) / 2)
    const icon = await sharp(svg).resize(iconSize, iconSize).png().toBuffer()
    pipeline = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 203, g: 246, b: 248, alpha: 1 },
      },
    }).composite([{ input: icon, left: pad, top: pad }])
  }
  await pipeline.png().toFile(out)
  console.log(`wrote ${name}`)
}

await writePng('pwa-192x192.png', 192)
await writePng('pwa-maskable-192x192.png', 192, { maskable: true })
await writePng('pwa-512x512.png', 512)
await writePng('pwa-maskable-512x512.png', 512, { maskable: true })
await writePng('apple-touch-icon.png', 180)

await sharp(svg).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'))
console.log('wrote favicon-32x32.png')

const maskIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#0F2940" d="M248 128h16c17.7 0 32 14.3 32 32v48c0 17.7-14.3 32-32 32h-16c-17.7 0-32-14.3-32-32v-48c0-17.7 14.3-32 32-32zm8 224c-53 0-96 43-96 96h192c0-53-43-96-96-96z"/></svg>\n`
await writeFile(path.join(publicDir, 'mask-icon.svg'), maskIcon)
console.log('wrote mask-icon.svg')
