import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

// Fade + leve deslocamento vertical a cada troca de rota (ver AnimatePresence
// em App.tsx, que precisa da key={location.pathname} pra disparar isso).
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
