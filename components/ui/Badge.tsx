import { TaskPriority, TaskStatus } from '@/lib/types'

const priorityStyles: Record<TaskPriority, string> = {
  LOW:      'bg-gray-100 text-gray-500 border border-gray-200',
  MEDIUM:   'bg-blue-50 text-blue-600 border border-blue-100',
  HIGH:     'bg-amber-50 text-amber-600 border border-amber-100',
  CRITICAL: 'bg-red-50 text-red-600 border border-red-100',
}

const priorityDot: Record<TaskPriority, string> = {
  LOW: 'bg-gray-400', MEDIUM: 'bg-blue-500', HIGH: 'bg-amber-500', CRITICAL: 'bg-red-500',
}

const statusStyles: Record<TaskStatus, string> = {
  TODO:         'bg-gray-100 text-gray-500',
  IN_PROGRESS:  'bg-blue-100 text-blue-700',
  IN_REVIEW:    'bg-violet-100 text-violet-700',
  DONE:         'bg-emerald-100 text-emerald-700',
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${priorityStyles[priority]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[priority]}`} />
      {priority}
    </span>
  )
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
