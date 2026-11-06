import AxeBuilder from '@axe-core/playwright'
import { test } from '@playwright/test'
import { entrar, type Conta } from './ajuda'

// Auditoria de acessibilidade (axe). Lista as violações sérias e críticas de cada
// tela; o teste só falha se aparecer uma crítica, para a lista servir de guia.
const TELAS: { nome: string; conta?: Conta; rota: string; espera?: string }[] = [
  { nome: 'Landing', rota: '/' },
  { nome: 'Entrar', rota: '/entrar' },
  { nome: 'Projetos (público)', rota: '/projetos' },
  { nome: 'Projeto (detalhe)', rota: '/projetos/5ec1fe00-0000-4000-8000-000000000001' },
  { nome: 'Feed (cidadã)', conta: 'cidadã', rota: '/feed', espera: '.maplibregl-canvas' },
  { nome: 'Relatar (cidadã)', conta: 'cidadã', rota: '/feed/novo' },
  { nome: 'Central (gestor)', conta: 'gestor', rota: '/feed', espera: 'li[id^="ticket-"]' },
  { nome: 'Quadro (gestor)', conta: 'gestor', rota: '/projetos', espera: 'ul li button' },
  { nome: 'Painel (gestor)', conta: 'gestor', rota: '/painel', espera: 'h2' },
]

for (const t of TELAS) {
  test(`acessibilidade: ${t.nome}`, async ({ page }) => {
    if (t.conta) await entrar(page, t.conta)
    await page.goto(t.rota)
    if (t.espera) await page.locator(t.espera).first().waitFor({ timeout: 20_000 })
    await page.waitForTimeout(2500)
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    const graves = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    for (const v of graves) console.log(`  [${t.nome}] ${v.impact} ${v.id} (${v.nodes.length}x): ${v.help} | ${v.nodes[0].target.join(' ')}`)
    if (graves.some((v) => v.impact === 'critical')) throw new Error(`violação crítica em ${t.nome}`)
  })
}
