import type { ReactNode } from 'react'

const MARCAS = /[̀-ͯ]/g

/** Minúsculas e sem acento, caractere a caractere — mantém o mesmo comprimento do texto original. */
export function normalizar(texto: string): string {
  return Array.from(texto, (c) => c.normalize('NFD').replace(MARCAS, '').toLowerCase()[0] ?? c).join('')
}

/** Marca em amarelo cada ocorrência do termo buscado, ignorando acento e maiúscula. */
export function realcar(texto: string, termo: string): ReactNode {
  const alvo = normalizar(termo.trim())
  if (!alvo) return texto
  const base = normalizar(texto)
  const partes: ReactNode[] = []
  let inicio = 0
  let achado = base.indexOf(alvo)
  while (achado !== -1) {
    if (achado > inicio) partes.push(texto.slice(inicio, achado))
    partes.push(
      <mark key={achado} className="rounded-[3px] bg-amarelo-300/80 px-0.5 text-grafite-900">
        {texto.slice(achado, achado + alvo.length)}
      </mark>,
    )
    inicio = achado + alvo.length
    achado = base.indexOf(alvo, inicio)
  }
  partes.push(texto.slice(inicio))
  return partes
}
