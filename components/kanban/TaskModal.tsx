'use client'
import { useState } from 'react'
import { Task, TaskPriority, TaskStatus } from '@/lib/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { apiFetch } from '@/lib/api'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  moduleId: string
  task?: Task | null
  onSaved: () => void
}

export function TaskModal({ open, onClose, moduleId, task, onSaved }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'MEDIUM')
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'TODO')
  const [tags, setTags] = useState(task?.tags?.join(', ') || '')
  const [loading, setLoading] = useState(false)

  const isEdit = !!task

  const save = async () => {
    if (!title.trim()) return
    setLoading(true)
    const body = {
      title: title.trim(),
      description,
      priority,
      status,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    }
    try {
      if (isEdit) {
        await apiFetch(`/api/tasks/${moduleId}/${task.id}`, { method: 'PUT', body: JSON.stringify(body) })
      } else {
        await apiFetch(`/api/tasks/${moduleId}`, { method: 'POST', body: JSON.stringify(body) })
      }
      onSaved()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const remove = async () => {
    if (!task) return
    if (!confirm('Delete this task?')) return
    await apiFetch(`/api/tasks/${moduleId}/${task.id}`, { method: 'DELETE' })
    onSaved()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit task' : 'New task'}>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Title</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Task title"
            autoFocus
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 resize-none"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional description (markdown supported)"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Priority</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
              value={priority}
              onChange={e => setPriority(e.target.value as TaskPriority)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
              value={status}
              onChange={e => setStatus(e.target.value as TaskStatus)}
            >
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Tags (comma separated)</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="backend, api, redis"
          />
        </div>
        <div className="flex justify-between pt-2">
          {isEdit ? (
            <Button variant="danger" size="sm" onClick={remove}>Delete</Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={loading || !title.trim()}>
              {loading ? 'Saving...' : isEdit ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
