import type { Categoria } from '../../../types/database'

// Pictograma de cada categoria (traço simples, 24×24).
const DESENHOS: Record<Categoria, React.ReactNode> = {
  mobilidade: (
    <>
      <rect x="5" y="4" width="14" height="13" rx="3" />
      <path d="M5 11h14M8 17v2.5M16 17v2.5" />
      <circle cx="8.5" cy="14" r=".9" fill="currentColor" />
      <circle cx="15.5" cy="14" r=".9" fill="currentColor" />
    </>
  ),
  iluminacao: (
    <>
      <path d="M9 17h6M10 20h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V17h5.2v-1.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" />
    </>
  ),
  seguranca: <path d="M12 3 5 6v5c0 4.4 3 8.2 7 10 4-1.8 7-5.6 7-10V6l-7-3Z" />,
  saneamento: <path d="M12 3s-6 6.6-6 11a6 6 0 0 0 12 0c0-4.4-6-11-6-11Z" />,
  pracas_lazer: (
    <>
      <path d="M12 21v-6" />
      <path d="M12 15c-3.9 0-6-2.2-6-5.2C6 6.6 8.7 4 12 4s6 2.6 6 5.8c0 3-2.1 5.2-6 5.2Z" />
    </>
  ),
  saude: <path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6V4Z" />,
  educacao: (
    <>
      <path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z" />
      <path d="M7 12v4c1.5 1.4 3.2 2 5 2s3.5-.6 5-2v-4" />
    </>
  ),
  outros: (
    <>
      <circle cx="6" cy="12" r="1.3" fill="currentColor" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      <circle cx="18" cy="12" r="1.3" fill="currentColor" />
    </>
  ),
}

export default function IconeCategoria({ categoria, size = 20 }: { categoria: Categoria; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {DESENHOS[categoria]}
    </svg>
  )
}
