import { expect, test } from '@playwright/test'
import { entrar, semRolagemHorizontal, vigiarErros } from './ajuda'

test.describe('Cidadã (conta demo)', () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page, 'cidadã')
  })

  test('o Feed mostra o mapa e os relatos', async ({ page }) => {
    const erros = vigiarErros(page)
    await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('heading', { name: 'Feed' })).toBeVisible()
    await expect(page.locator('a[href^="/feed/"]:not([href="/feed/novo"])').first()).toBeVisible()
    expect(erros).toEqual([])
  })

  test('a barra mostra Feed e Projetos, e não o painel do órgão', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Principal' })
    await expect(nav.getByRole('link', { name: 'Feed' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Projetos' })).toBeVisible()
    await expect(nav.getByRole('link', { name: /Painel/ })).toHaveCount(0)
  })

  test('o painel do órgão está bloqueado para a cidadã', async ({ page }) => {
    await page.goto('/painel')
    await expect(page.getByText(/só para contas de órgãos públicos/i)).toBeVisible()
  })

  test('Relatar: o bairro é uma lista oficial de 94 bairros agrupada por região', async ({ page }) => {
    await page.goto('/feed/novo')
    await page.getByRole('radio').first().click()
    await page.getByRole('button', { name: /Continuar/ }).click()
    const bairro = page.locator('#bairro')
    await expect(bairro).toBeVisible({ timeout: 20_000 })
    expect(await bairro.locator('option').count()).toBe(95) // 94 bairros + "escolha"
    expect(await bairro.locator('optgroup').count()).toBe(6)
  })

  test('Relatar: clicar fora do Recife mostra "Área bloqueada" e não avança', async ({ page }) => {
    await page.goto('/feed/novo')
    await page.getByRole('radio').first().click()
    await page.getByRole('button', { name: /Continuar/ }).click()
    const mapa = page.locator('.maplibregl-canvas')
    await expect(mapa).toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(3500)
    const caixa = (await mapa.boundingBox())!
    // canto superior esquerdo do mapa: cai em Olinda/Camaragibe, fora do município
    await page.mouse.click(caixa.x + 12, caixa.y + 12)
    await expect(page.getByText(/Área bloqueada|fora da cidade do Recife/i).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Continuar/ })).toBeDisabled()
  })

  test('Relatar: clicar dentro do Recife preenche o bairro e libera o avanço', async ({ page }) => {
    await page.goto('/feed/novo')
    await page.getByRole('radio').first().click()
    await page.getByRole('button', { name: /Continuar/ }).click()
    const mapa = page.locator('.maplibregl-canvas')
    await expect(mapa).toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(3500)
    const caixa = (await mapa.boundingBox())!
    await page.mouse.click(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2)
    await expect(page.locator('#bairro')).not.toHaveValue('', { timeout: 30_000 }) // depende do serviço de endereços (Nominatim)
    await expect(page.getByRole('button', { name: /Continuar/ })).toBeEnabled()
  })

  test('detalhe de um relato abre sem erro', async ({ page }) => {
    const erros = vigiarErros(page)
    await page.locator('a[href^="/feed/"]:not([href="/feed/novo"])').first().click()
    await expect(page).toHaveURL(/\/feed\/[0-9a-f-]{36}/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(erros).toEqual([])
  })

  test('um projeto em consulta mostra a cédula de voto (sem votar)', async ({ page }) => {
    await page.goto('/projetos')
    await page.getByText(/Em consulta/i).first().waitFor({ timeout: 15_000 })
    await page.locator('a[href^="/projetos/"]').first().click()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('a cidadã não vê "Responder" nem formulário de órgão no detalhe do relato', async ({ page }) => {
    await page.locator('a[href^="/feed/"]:not([href="/feed/novo"])').first().click()
    await expect(page.getByText(/Responder em nome do órgão/)).toHaveCount(0)
  })

  for (const rota of ['/feed', '/projetos', '/feed/novo']) {
    test(`sem rolagem horizontal no celular: ${rota}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(rota)
      await page.waitForTimeout(2500)
      expect(await semRolagemHorizontal(page)).toBe(true)
    })
  }
})
