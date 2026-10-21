interface MarqueeProps {
  itens: string[]
  /** Segundos para uma volta completa. */
  duracao?: number
  reverso?: boolean
  className?: string
}

// Faixa de texto que corre sem parar (o conteúdo é duplicado para o loop
// ficar contínuo). A animação é CSS, no compositor; para quem prefere menos
// movimento, fica parada.
export default function Marquee({ itens, duracao = 28, reverso = false, className = '' }: MarqueeProps) {
  const faixa = (
    <span className="flex shrink-0 items-center">
      {itens.map((item, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6">{item}</span>
          <span aria-hidden className="text-[0.7em]">✦</span>
        </span>
      ))}
    </span>
  )

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`} aria-label={itens.join(' · ')}>
      <div
        aria-hidden
        className="anima-continua flex w-max will-change-transform"
        style={{ animation: `${reverso ? 'marquee-reverso' : 'marquee'} ${duracao}s linear infinite` }}
      >
        {faixa}
        {faixa}
      </div>
    </div>
  )
}
