'use client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'

export default function BoardPage() {
  const { projectId, moduleId } = useParams<{ projectId: string; moduleId: string }>()
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link href="/projects" className="hover:text-gray-600">Projects</Link>
          <span>/</span>
          <Link href={`/projects/${projectId}`} className="hover:text-gray-600">Project</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">Board</span>
        </div>
        <Link href={`/projects/${projectId}/${moduleId}/docs`}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg">
          📄 Docs →
        </Link>
      </div>
      <KanbanBoard moduleId={moduleId} />
    </div>
  )
}
