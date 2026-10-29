import { useEffect, useState } from 'react'
import { animate, motion } from 'framer-motion'

// Tela de abertura (só na primeira visita da sessão): a logo gira, o contador
// corre até 100 e a cortina amarela sobe revelando a página.
export default function Preloader({ onFim }: { onFim: () => void }) {
  const [n, setN] = useState(0)
  const [saindo, setSaindo] = useState(false)

  useEffect(() => {
    const controle = animate(0, 100, {
      duration: 1.6,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => setN(Math.round(v)),
      onComplete: () => setSaindo(true),
    })
    return () => controle.stop()
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[3000] flex flex-col items-center justify-center bg-amarelo-500"
      initial={{ clipPath: 'inset(0 0 0% 0)' }}
      animate={saindo ? { clipPath: 'inset(0 0 100% 0)' } : {}}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      onAnimationComplete={() => saindo && onFim()}
      aria-hidden
    >
      <motion.img
        src="/logo.png"
        alt=""
        className="h-24 w-24"
        initial={{ scale: 0.4, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
      />
      <p className="mt-6 font-heading text-sm font-extrabold uppercase tracking-[0.3em] text-grafite-900">
        Confluindo a cidade
      </p>
      <p className="absolute bottom-8 right-8 font-heading text-7xl font-extrabold text-grafite-900 sm:text-9xl">
        {n}
        <span className="text-3xl sm:text-5xl">%</span>
      </p>
    </motion.div>
  )
}
