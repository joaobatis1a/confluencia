import type { Categoria } from '../types/database'
import { CATEGORIAS } from '../types/database'
import { CATEGORIA_STYLES } from '../lib/categoriaStyles'

export default function CategoryBadge({ categoria }: { categoria: Categoria }) {
  const label = CATEGORIAS.find((c) => c.value === categoria)?.label ?? categoria
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${CATEGORIA_STYLES[categoria]}`}
    >
      {label}
    </span>
  )
}
