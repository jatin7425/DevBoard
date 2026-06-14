'use client'
import { useEffect, useState, useCallback } from 'react'
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd'
import { Task, TaskStatus } from '@/lib/types'
import { TaskCard } from './TaskCard'
import { TaskModal } from './TaskModal'
import { apiFetch } from '@/lib/api'

const COLUMNS: { id: TaskStatus; label: string; color: string; bg: string; dot: string }[] = [
  { id: 'TODO',        label: 'To Do',       color: 'text-gray-500',   bg: 'bg-gray-50',     dot: 'bg-gray-300' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'text-blue-600',   bg: 'bg-blue-50/50',  dot: 'bg-blue-500' },
  { id: 'IN_REVIEW',   label: 'In Review',   color: 'text-violet-600', bg: 'bg-violet-50/50',dot: 'bg-violet-500' },
  { id: 'DONE',        label: 'Done',        color: 'text-emerald-600',bg: 'bg-emerald-50/50',dot: 'bg-emerald-500' },
]

export function KanbanBoard({ moduleId }: { moduleId: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [previewTask, setPreviewTask] = useState<Task | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('TODO')

  const load = useCallback(async () => {
    const res = await apiFetch(`/api/tasks/${moduleId}`)
    const data = await res.json()
    setTasks(data.tasks || [])
  }, [moduleId])

  useEffect(() => { load() }, [load])

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const taskId = result.draggableId
    const newStatus = result.destination.droppableId as TaskStatus
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    await apiFetch(`/api/tasks/${moduleId}/${taskId}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) })
  }

  const openCreate = (status: TaskStatus) => { setEditingTask(null); setDefaultStatus(status); setModalOpen(true) }
  const openEdit   = (task: Task) => { setEditingTask(task); setModalOpen(true) }
  const openPreview = (task: Task) => setPreviewTask(task)
  const byStatus   = (s: TaskStatus) => tasks.filter(t => t.status === s).sort((a, b) => a.order - b.order)

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(col => {
            const colTasks = byStatus(col.id)
            return (
              <div key={col.id} className="flex-shrink-0 w-72">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 w-5 h-5 rounded-full flex items-center justify-center font-medium">
                      {colTasks.length}
                    </span>
                  </div>
                  <button onClick={() => openCreate(col.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-lg">
                    +
                  </button>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2.5 rounded-2xl p-3 min-h-40 transition-colors
                        ${snapshot.isDraggingOver ? 'bg-indigo-50 ring-1 ring-indigo-200' : col.bg}`}
                    >
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <button onClick={() => openCreate(col.id)}
                          className="w-full border border-dashed border-gray-200 rounded-xl py-4 text-xs text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors cursor-pointer">
                          + Add task
                        </button>
                      )}
                      {colTasks.map((task, idx) => (
                        <TaskCard key={task.id} task={task} index={idx} onClick={openPreview} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm hidden xl:block">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Task preview</p>
              <p className="text-sm text-gray-500">Click a task to see details like Jira issue cards.</p>
            </div>
            <button onClick={() => openCreate('TODO')} className="rounded-full bg-indigo-600 text-white px-3 py-1 text-sm hover:bg-indigo-700 transition-colors">
              Create
            </button>
          </div>
          {previewTask ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-gray-500">{previewTask.id.toUpperCase()}</p>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900">{previewTask.title}</h3>
                    <p className="mt-2 text-sm text-gray-600">{previewTask.description || 'No description provided.'}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                      {previewTask.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-gray-100 p-4 bg-white">
                  <p className="text-xs text-gray-500 uppercase tracking-[0.24em]">Priority</p>
                  <p className="mt-2 font-semibold text-gray-900">{previewTask.priority}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 p-4 bg-white">
                  <p className="text-xs text-gray-500 uppercase tracking-[0.24em]">Updated</p>
                  <p className="mt-2 font-semibold text-gray-900">{new Date(previewTask.updated_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 p-4 bg-white">
                <p className="text-xs text-gray-500 uppercase tracking-[0.24em]">Tags</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {previewTask.tags.length > 0 ? previewTask.tags.map(tag => (
                    <span key={tag} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">{tag}</span>
                  )) : <span className="text-sm text-gray-400">No tags</span>}
                </div>
              </div>
              <button onClick={() => openEdit(previewTask)} className="w-full rounded-full bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                Edit task
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
              Select a task to preview details.
            </div>
          )}
        </div>
      </div>

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)} moduleId={moduleId} task={editingTask} onSaved={load} />
    </>
  )
}
