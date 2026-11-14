import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import { entrar, vigiarErros } from './ajuda'

// Os cabeçalhos do vercel.json (CSP etc.) são aplicados em cada resposta, como a
// Vercel faz, para provar que NENHUMA tela quebra por causa deles.
const cfg = JSON.parse(fs.readFileSync('vercel.json', 'utf8'))
const cabecalhos: Record<string, string> = Object.fromEntries(cfg.headers[0].headers.map((h: { key: string; value: string }) => [h.key, h.value]))

test.describe('Segurança no navegador', () => {
  test('o vercel.json define os cabeçalhos de segurança exigidos', () => {
    for (const k of ['Content-Security-Policy', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy']) expect(cabecalhos[k], k).toBeTruthy()
    const csp = cabecalhos['Content-Security-Policy']
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-(inline|eval)'/)
  })

  test.beforeEach(async ({ page }) => {
    await page.route('**/*', async (route) => {
      if (route.request().resourceType() !== 'document') return route.continue()
      const resp = await route.fetch()
      await route.fulfill({ response: resp, headers: { ...resp.headers(), ...cabecalhos } })
    })
  })

  test('com a CSP ligada, a landing, o Feed, Relatar e os projetos funcionam sem violações', async ({ page }) => {
    const erros = vigiarErros(page)
    await page.goto('/')
    await page.waitForTimeout(1500)
    await entrar(page, 'cidadã')
    await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 20_000 })
    await page.goto('/feed/novo')
    await page.getByRole('radio').first().click()
    await page.getByRole('button', { name: /Continuar/ }).click()
    await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 20_000 })
    await page.goto('/projetos/5ec1fe00-0000-4000-8000-000000000001')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
    expect(erros).toEqual([])
  })

  test('com a CSP ligada, o órgão usa Central, Quadro e Painel sem violações', async ({ page }) => {
    const erros = vigiarErros(page)
    await entrar(page, 'gestor')
    for (const rota of ['/feed', '/projetos', '/painel']) {
      await page.goto(rota)
      await page.waitForTimeout(2500)
    }
    expect(erros).toEqual([])
  })

  test('texto malicioso em campos de busca não vira HTML', async ({ page }) => {
    await entrar(page, 'gestor')
    const alerta: string[] = []
    page.on('dialog', (d) => {
      alerta.push(d.message())
      void d.dismiss()
    })
    await page.getByPlaceholder(/Buscar por bairro/).fill('<img src=x onerror=alert(1)><script>alert(2)</script>')
    await page.waitForTimeout(800)
    expect(alerta).toEqual([])
    expect(await page.locator('img[src="x"]').count()).toBe(0)
  })
})
