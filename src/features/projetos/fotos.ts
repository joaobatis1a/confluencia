// Fotos dos locais dos projetos de exemplo — Wikimedia Commons, licenças livres,
// com crédito exibido na tela. Provisório: quando `projetos` tiver uma coluna
// de foto no banco, este mapa sai e a foto vem do próprio projeto.
export interface FotoLocal {
  url: string
  local: string
  autor: string
  licenca: string
  fonte: string
}

export const FOTOS_PROJETO: Record<string, FotoLocal> = {
  p1: {
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Avenida-norte-1.jpg/1280px-Avenida-norte-1.jpg',
    local: 'Av. Norte · Recife',
    autor: 'Abmac',
    licenca: 'Domínio público',
    fonte: 'https://commons.wikimedia.org/wiki/File:Avenida-norte-1.jpg',
  },
  p2: {
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Quartel_do_Derby%2C_Recife.jpg/1280px-Quartel_do_Derby%2C_Recife.jpg',
    local: 'Derby · Recife',
    autor: 'Rolejarg',
    licenca: 'CC BY 4.0',
    fonte: 'https://commons.wikimedia.org/wiki/File:Quartel_do_Derby,_Recife.jpg',
  },
  p4: {
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0b/Rio_Capibaribe_no_Recife_02.jpg/1280px-Rio_Capibaribe_no_Recife_02.jpg',
    local: 'Rio Capibaribe · Recife',
    autor: 'lailtonaraujo',
    licenca: 'CC0',
    fonte: 'https://commons.wikimedia.org/wiki/File:Rio_Capibaribe_no_Recife_02.jpg',
  },
}
