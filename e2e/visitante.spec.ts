import { expect, test } from '@playwright/test'
import { semRolagemHorizontal, vigiarErros } from './ajuda'

test.describe('Visitante (sem login)', () => {
  test('a landing abre e o menu rola até as seções, sem entrar no sistema', async ({ page }) => {
    const erros = vigiarErros(page)
    // O menu se esconde ao descer a página; cada seção é testada numa visita nova.
    for (const rotulo of ['Como funciona', 'A cidade', 'Em números', 'Experimente']) {
      await page.goto('/')
      await page.getByRole('link', { name: rotulo }).first().click()
      await expect(page).toHaveURL(/localhost:5191\/$/)
      await page.waitForTimeout(600)
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200)
    }
    expect(erros).toEqual([])
  })

  test('"Entrar" leva à tela de entrada com as contas demo', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /^Entrar/ }).first().click()
    await expect(page).toHaveURL(/\/entrar/)
    await expect(page.getByRole('button', { name: /Entrar como cidadã/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Entrar como gestor/i })).toBeVisible()
  })

  test('o painel do órgão não abre para quem não é órgão', async ({ page }) => {
    await page.goto('/painel')
    await expect(page.getByText(/painel do órgão é só para|Entrar|entre/i).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: /Bom dia|Boa tarde|Boa noite/ })).toHaveCount(0)
  })

  test('Projetos é público e mostra os projetos', async ({ page }) => {
    await page.goto('/projetos')
    await expect(page.getByRole('heading', { name: 'Projetos', exact: true })).toBeVisible()
    await expect(page.locator('a[href^="/projetos/"]').first()).toBeVisible({ timeout: 15_000 })
  })

  test('o link antigo /projetos/p1 continua abrindo o projeto', async ({ page }) => {
    await page.goto('/projetos/p1')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Av. Norte', { timeout: 15_000 })
  })

  test('rota que não existe não derruba o app', async ({ page }) => {
    const erros = vigiarErros(page)
    await page.goto('/rota-que-nao-existe')
    await expect(page.locator('body')).not.toBeEmpty()
    expect(erros).toEqual([])
  })

  for (const rota of ['/', '/entrar', '/projetos']) {
    test(`sem rolagem horizontal no celular: ${rota}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(rota)
      await page.waitForTimeout(1500)
      expect(await semRolagemHorizontal(page)).toBe(true)
    })
  }
})
