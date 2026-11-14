import { expect, type Page } from '@playwright/test'

export type Conta = 'cidadã' | 'gestor'

/** Entra pela tela "Entrar" com uma das contas demo (botões da própria tela). */
export async function entrar(page: Page, conta: Conta) {
  await page.goto('/entrar')
  await page.getByRole('button', { name: conta === 'cidadã' ? /Entrar como cidadã/i : /Entrar como gestor/i }).click()
  await expect(page).toHaveURL(/\/feed/, { timeout: 20_000 })
}

/** Falhas que não podem acontecer em nenhuma tela: exceção de JS e violação de CSP. */
export function vigiarErros(page: Page) {
  const erros: string[] = []
  page.on('pageerror', (e) => erros.push(`exceção: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error' && /Content Security Policy|violates the following/i.test(m.text())) erros.push(`CSP: ${m.text().slice(0, 160)}`)
  })
  return erros
}

export const semRolagemHorizontal = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
