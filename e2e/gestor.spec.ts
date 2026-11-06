import { expect, test } from '@playwright/test'
import { entrar, semRolagemHorizontal, vigiarErros } from './ajuda'

// Nada aqui publica: os testes param antes do botão final, ou provam que ele recusa.
test.describe('Gestor (conta demo do órgão)', () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page, 'gestor')
  })

  test('a barra vira Central, Quadro e Painel do órgão', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Principal' })
    await expect(nav.getByRole('link', { name: 'Central' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Quadro' })).toBeVisible()
    await expect(nav.getByRole('link', { name: /Painel do órgão/ })).toBeVisible()
  })

  test('não existe o botão de relatar para o órgão', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Relatar/i })).toHaveCount(0)
  })

  test('o Feed do órgão é a Central de relatos, sem mapa de morador', async ({ page }) => {
    const erros = vigiarErros(page)
    await expect(page.getByRole('heading', { name: /O que a cidade está pedindo/ })).toBeVisible()
    await expect(page.locator('.maplibregl-canvas')).toHaveCount(0)
    expect(erros).toEqual([])
  })

  test('Central: os filtros mostram contagem e mudam a lista', async ({ page }) => {
    const resumo = page.getByText(/neste recorte/)
    await expect(resumo).toBeVisible({ timeout: 15_000 })
    const antes = await resumo.innerText()
    await page.getByRole('radio', { name: /Todos \d+/ }).first().click()
    await expect(resumo).not.toHaveText(antes)
    await page.getByRole('radio', { name: /Iluminação/ }).click()
    await expect(page.getByRole('radio', { name: /Iluminação/ })).toHaveAttribute('aria-checked', 'true')
  })

  test('Central: clicar num relato abre o detalhe completo ao lado', async ({ page }) => {
    await page.locator('li[id^="ticket-"] button').first().click()
    const detalhe = page.getByRole('complementary', { name: 'Detalhe do relato' })
    await expect(detalhe.getByText(/Respostas do órgão/)).toBeVisible()
    await expect(detalhe.getByRole('link', { name: 'Virar projeto' })).toBeVisible()
    await expect(detalhe.getByText(/Responder em nome do órgão/)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(detalhe.getByText(/Respostas do órgão/)).toHaveCount(0)
  })

  test('Central: setas do teclado percorrem a fila', async ({ page }) => {
    await page.locator('li[id^="ticket-"]').first().waitFor()
    await page.keyboard.press('ArrowDown')
    const sel = page.locator('li[id^="ticket-"] button[aria-pressed="true"]')
    await expect(sel).toHaveCount(1)
    const primeiro = await sel.innerText()
    await page.keyboard.press('ArrowDown')
    await expect(sel).not.toHaveText(primeiro)
  })

  test('Central: a lista tem altura própria e rola por dentro', async ({ page }) => {
    await page.locator('li[id^="ticket-"]').first().waitFor()
    const rola = await page.locator('.rolagem-fina').first().evaluate((el) => getComputedStyle(el).overflowY === 'auto' && el.scrollHeight > el.clientHeight)
    expect(rola).toBe(true)
  })

  test('Central: responder exige texto (o botão fica desligado)', async ({ page }) => {
    await page.locator('li[id^="ticket-"] button').first().click()
    await expect(page.getByRole('button', { name: 'Publicar resposta' })).toBeDisabled()
  })

  test('Quadro: cartões dos projetos do órgão e filtro por etapa', async ({ page }) => {
    await page.goto('/projetos')
    await expect(page.getByRole('heading', { name: /Do papel à entrega/ })).toBeVisible()
    await expect(page.locator('ul li button').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('radio', { name: /Todos \d+/ })).toHaveAttribute('aria-checked', 'true')
  })

  test('Quadro: o formulário de atualização guia e valida antes de publicar', async ({ page }) => {
    await page.goto('/projetos')
    await page.locator('ul li button').first().click()
    const gaveta = page.getByRole('dialog')
    await expect(gaveta.getByText(/1\. O que aconteceu/)).toBeVisible()
    // sem escolher o tipo: o botão de publicar fica desligado
    await expect(gaveta.getByRole('button', { name: 'Publicar atualização' })).toBeDisabled()
    // aviso curto demais é recusado na tela
    await gaveta.getByRole('radio', { name: /Só um aviso/ }).click()
    await gaveta.getByLabel('Texto da atualização').fill('curto')
    await gaveta.getByRole('button', { name: 'Publicar atualização' }).click()
    await expect(gaveta.getByRole('alert')).toContainText(/pelo menos 10 caracteres/)
    // a prévia mostra o que a população vai ver
    await gaveta.getByLabel('Texto da atualização').fill('Estamos preparando a licitação do projeto.')
    await expect(gaveta.getByLabel('Prévia')).toContainText('Estamos preparando a licitação')
    await page.keyboard.press('Escape')
    await expect(gaveta).toHaveCount(0)
  })

  test('Quadro: rejeitar exige confirmar que não dá para desfazer', async ({ page }) => {
    await page.goto('/projetos')
    await page.getByRole('radio', { name: /Em consulta pública/ }).click()
    const cartao = page.locator('ul li button', { hasText: 'Em consulta pública' }).first()
    if ((await cartao.count()) === 0) test.skip(true, 'nenhum projeto em consulta nesta conta')
    await cartao.click()
    const gaveta = page.getByRole('dialog')
    await gaveta.getByRole('radio', { name: /Mudar de etapa/ }).click()
    await gaveta.getByRole('radio', { name: /Encerrar consulta: Rejeitado/ }).click()
    await gaveta.getByRole('button', { name: 'Publicar atualização' }).click()
    await expect(gaveta.getByRole('alert')).toContainText(/não pode ser desfeita/)
  })

  test('o órgão não vota: no projeto em consulta vê o resultado, não os botões', async ({ page }) => {
    await page.goto('/projetos')
    await page.locator('a[href^="/projetos/"]').first().waitFor({ timeout: 15_000 })
    await page.goto('/projetos/5ec1fe00-0000-4000-8000-000000000001')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /^(A favor|Contra|Votar)/i })).toHaveCount(0)
  })

  test('Painel: números, "Precisa de você hoje" e projetos em andamento', async ({ page }) => {
    await page.goto('/painel')
    await expect(page.getByRole('heading', { name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Precisa de você hoje' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Projetos em andamento' })).toBeVisible()
  })

  test('Novo projeto: o formulário mostra a prévia ao vivo', async ({ page }) => {
    await page.goto('/projetos/novo')
    await page.getByPlaceholder(/Requalificação da Av. Norte/).fill('Ciclovia de teste E2E')
    await expect(page.getByLabel('Prévia do projeto')).toContainText('Ciclovia de teste E2E')
  })

  test('?visao=morador mostra a tela pública para conferir', async ({ page }) => {
    await page.goto('/feed?visao=morador')
    await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 20_000 })
  })

  for (const rota of ['/painel', '/feed', '/projetos']) {
    test(`sem rolagem horizontal no celular: ${rota}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(rota)
      await page.waitForTimeout(2500)
      expect(await semRolagemHorizontal(page)).toBe(true)
    })
  }
})
