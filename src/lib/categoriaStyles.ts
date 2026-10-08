import type { Categoria } from '../types/database'

// Identidade visual de cada categoria do Feed (referência: protótipo do Figma
// Make). Reaproveita as cores de status quando o significado combina
// tematicamente (segurança~urgente, praças~verde, iluminação~quente) e usa
// as cores de categoria dedicadas (rosa/ciano/violeta) para o resto.
export const CATEGORIA_STYLES: Record<Categoria, string> = {
  mobilidade: 'bg-status-azul-50 text-status-azul-700',
  iluminacao: 'bg-status-terracota-50 text-status-terracota-700',
  seguranca: 'bg-status-vermelho-50 text-status-vermelho-700',
  saneamento: 'bg-categoria-ciano-50 text-categoria-ciano-700',
  pracas_lazer: 'bg-status-verde-50 text-status-verde-700',
  saude: 'bg-categoria-rosa-50 text-categoria-rosa-700',
  educacao: 'bg-categoria-violeta-50 text-categoria-violeta-700',
  outros: 'bg-grafite-200 text-grafite-700',
}
