import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Post } from '../../../types/database'
import { Card } from '../../../components/ui'
import CategoryBadge from '../../../components/CategoryBadge'
import RepercussaoBar from '../../../components/RepercussaoBar'
import { formatRelativo } from '../../../lib/repercussao'

// Tarefa 2.1 do João: componente reutilizável, usado na listagem do Feed.
export default function PostCard({ post }: { post: Post }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/feed/${post.id}`}>
        <Card className="hover:border-amarelo-500 hover:shadow-md transition-[border-color,box-shadow] cursor-pointer h-full flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <CategoryBadge categoria={post.categoria} />
            <span className="text-xs text-grafite-500">{post.bairro}</span>
          </div>
          <p className="text-sm text-grafite-900 flex-1">{post.descricao}</p>
          <div className="mt-3 pt-3 border-t border-grafite-200 space-y-2">
            <RepercussaoBar valor={post.repercussao} />
            <div className="flex items-center justify-between">
              <span className="text-xs text-grafite-500">{formatRelativo(post.created_at)}</span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}
