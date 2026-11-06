// Confere os cabeçalhos de segurança do vercel.json e, se passar uma URL, os da
// versão publicada.
//   npm run test:headers
//   npm run test:headers -- https://confluencia-xxx.vercel.app
import fs from 'node:fs'

const EXIGIDOS = ['Content-Security-Policy', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy']
const cfg = JSON.parse(fs.readFileSync('vercel.json', 'utf8'))
const doArquivo = Object.fromEntries((cfg.headers?.[0]?.headers ?? []).map((h) => [h.key.toLowerCase(), h.value]))
let falhas = 0
const marca = (ok, texto) => {
  if (!ok) falhas++
  console.log(`${ok ? '✔' : '✘'} ${texto}`)
}

console.log('vercel.json')
for (const k of EXIGIDOS) marca(Boolean(doArquivo[k.toLowerCase()]), k)
const csp = doArquivo['content-security-policy'] ?? ''
marca(!/script-src[^;]*'unsafe-(inline|eval)'/.test(csp), "CSP sem 'unsafe-inline' nem 'unsafe-eval' em script-src")
marca(csp.includes("object-src 'none'") && csp.includes("frame-ancestors 'none'") && csp.includes("base-uri 'self'"), "CSP fecha object-src, frame-ancestors e base-uri")

const url = process.argv[2]
if (url) {
  console.log(`\n${url}`)
  const r = await fetch(url, { method: 'HEAD' })
  for (const k of EXIGIDOS) marca(r.headers.has(k), k)
  marca(r.headers.has('strict-transport-security'), 'Strict-Transport-Security')
}
console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo')
process.exit(falhas ? 1 : 0)
