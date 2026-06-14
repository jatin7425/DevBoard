'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Project } from '@/lib/types'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

const COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#f97316']

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const res = await apiFetch('/api/projects')
    const data = await res.json()
    setProjects(data.projects || [])
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    if (!name.trim()) return
    setLoading(true)
    await apiFetch('/api/projects', { method: 'POST', body: JSON.stringify({ name, description, color }) })
    setName(''); setDescription(''); setColor(COLORS[0])
    setModalOpen(false)
    await load()
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ New Project</Button>
      </div>

      {projects.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-20 text-center">
          <p className="text-4xl mb-3">🗂️</p>
          <p className="font-semibold text-gray-700 mb-1">No projects yet</p>
          <p className="text-sm text-gray-400 mb-4">Create your first project to get started</p>
          <Button onClick={() => setModalOpen(true)}>+ New Project</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(p => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-indigo-100 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ background: p.color }}>
                    {p.name[0]}
                  </div>
                  <span className="text-gray-300 group-hover:text-indigo-400 transition-colors">→</span>
                </div>
                <h2 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">{p.name}</h2>
                {p.description && <p className="text-sm text-gray-500 line-clamp-2">{p.description}</p>}
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Project">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Name</label>
            <input className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
              value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Courier Simulator" autoFocus />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Description</label>
            <input className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
              value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this project?" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg cursor-pointer transition-all ${color === c ? 'scale-110 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-105'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={loading || !name.trim()}>{loading ? 'Creating...' : 'Create Project'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
