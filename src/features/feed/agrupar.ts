// Tarefa 4.2 do João: agrupa relatos que ficariam um em cima do outro na tela.
// O agrupamento é feito em pixels, depois de projetar cada ponto com a câmera
// atual — assim funciona igual com o mapa inclinado (3D) ou de cima (2D).

export interface PontoTela {
  id: string
  x: number
  y: number
}

export interface Grupo {
  ids: string[]
}

/**
 * Junta pontos a menos de `raio` pixels uns dos outros. Guloso e na ordem dada:
 * quem vem primeiro vira o centro do grupo (passe os de maior repercussão antes).
 * Pontos em `soltos` nunca entram num grupo (ex.: o relato em destaque).
 */
export function agrupar(pontos: PontoTela[], raio: number, soltos: ReadonlySet<string> = new Set()): Grupo[] {
  const usado = new Set<string>()
  const grupos: Grupo[] = []
  const r2 = raio * raio
  for (const centro of pontos) {
    if (usado.has(centro.id)) continue
    usado.add(centro.id)
    const ids = [centro.id]
    if (!soltos.has(centro.id)) {
      for (const outro of pontos) {
        if (usado.has(outro.id) || soltos.has(outro.id)) continue
        const dx = outro.x - centro.x
        const dy = outro.y - centro.y
        if (dx * dx + dy * dy <= r2) {
          usado.add(outro.id)
          ids.push(outro.id)
        }
      }
    }
    grupos.push({ ids })
  }
  return grupos
}
