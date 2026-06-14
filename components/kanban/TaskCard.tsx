'use client'
import { Draggable } from '@hello-pangea/dnd'
import { Task } from '@/lib/types'
import { PriorityBadge } from '@/components/ui/Badge'

export function TaskCard({ task, index, onClick }: { task: Task; index: number; onClick: (t: Task) => void }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={`bg-white rounded-xl p-3.5 border border-gray-100 cursor-pointer group transition-all
            ${snapshot.isDragging ? 'shadow-xl rotate-1 scale-105' : 'hover:shadow-md hover:border-indigo-100'}`}
        >
          <p className="text-sm font-medium text-gray-900 mb-3 leading-snug group-hover:text-indigo-700 transition-colors">
            {task.title}
          </p>
          {task.description ? (
            <p className="text-xs text-gray-500 leading-normal mb-3 overflow-hidden text-ellipsis line-clamp-2">
              {task.description}
            </p>
          ) : null}
          <div className="flex items-center justify-between gap-2">
            <PriorityBadge priority={task.priority} />
            {task.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap justify-end">
                {task.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
            <span>{task.id.toUpperCase()}</span>
            <span>{new Date(task.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </Draggable>
  )
}
