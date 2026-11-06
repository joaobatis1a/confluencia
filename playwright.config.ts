import { defineConfig } from '@playwright/test'

// Testes de ponta a ponta (E2E). Rodam no Edge do sistema contra a versão
// compilada (npm run build), com as contas demo e só LEITURA: nenhum teste
// publica, vota, apaga ou grava nada no banco.
//   npm run e2e            roda tudo
//   npm run e2e -- --ui    abre o painel visual do Playwright
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 12_000 },
  retries: 1,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5191',
    channel: 'msedge',
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--use-angle=d3d11'] },
  },
  webServer: {
    command: 'npx vite preview --port 5191 --strictPort',
    url: 'http://localhost:5191',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
