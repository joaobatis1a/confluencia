import { useMemo } from 'react'

// Linhas topográficas (curvas de nível) desenhadas de forma determinística a
// partir de uma "semente": o mesmo desenho sempre que a tela renderiza.
function curva(cx: number, cy: number, raio: number, semente: number) {
  const pontos: [number, number][] = []
  const passos = 48
  for (let i = 0; i < passos; i++) {
    const a = (i / passos) * Math.PI * 2
    const ruido =
      1 +
      0.18 * Math.sin(a * 3 + semente) +
      0.1 * Math.sin(a * 5 + semente * 1.7) +
      0.06 * Math.cos(a * 7 + semente * 0.6)
    pontos.push([cx + Math.cos(a) * raio * ruido, cy + Math.sin(a) * raio * ruido * 0.72])
  }
  // Curva suave (Catmull-Rom → Bézier) fechada.
  let d = `M ${pontos[0][0].toFixed(1)} ${pontos[0][1].toFixed(1)}`
  for (let i = 0; i < passos; i++) {
    const p0 = pontos[(i - 1 + passos) % passos]
    const p1 = pontos[i]
    const p2 = pontos[(i + 1) % passos]
    const p3 = pontos[(i + 2) % passos]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d + ' Z'
}

interface TopografiaProps {
  semente?: number
  className?: string
}

export default function Topografia({ semente = 1, className = '' }: TopografiaProps) {
  const caminhos = useMemo(() => {
    const centros: [number, number][] = [
      [220, 180],
      [880, 420],
      [560, 760],
    ]
    return centros.flatMap(([cx, cy], k) =>
      Array.from({ length: 9 }, (_, i) => curva(cx, cy, 40 + i * 46, semente + k * 2.3 + i * 0.35)),
    )
  }, [semente])

  return (
    <svg viewBox="0 0 1100 900" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      {caminhos.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}
