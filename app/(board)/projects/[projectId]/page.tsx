'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Project, Module } from '@/lib/types'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const load = async () => {
    const [pRes, mRes] = await Promise.all([
      apiFetch(`/api/projects/${projectId}`),
      apiFetch(`/api/modules/${projectId}`),
    ])
    const pData = await pRes.json()
    const mData = await mRes.json()
    setProject(pData.project)
    setModules(mData.modules || [])
  }

  useEffect(() => { load() }, [projectId])

  const create = async () => {
    if (!name.trim()) return
    await apiFetch(`/api/modules/${projectId}`, { method: 'POST', body: JSON.stringify({ name, description }) })
    setName(''); setDescription('')
    setModalOpen(false)
    await load()
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Link href="/projects" className="text-sm text-gray-400 hover:text-gray-600">Projects</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          {project && <span className="w-3 h-3 rounded-full" style={{ background: project.color }} />}
          {project?.name}
        </h1>
      </div>
      {project?.description && <p className="text-sm text-gray-500 mb-6">{project.description}</p>}

      <div className="flex items-center justify-between mb-4 mt-6">
        <h2 className="font-semibold text-gray-700">Modules</h2>
        <Button size="sm" onClick={() => setModalOpen(true)}>+ Module</Button>
      </div>

      {modules.length === 0 ? (
        <EmptyState icon="📦" title="No modules yet" description="Modules group related tasks and docs together" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map(mod => (
            <div key={mod.id} className="bg-white rounded-xl p-5 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-1">{mod.name}</h3>
              {mod.description && <p className="text-sm text-gray-500 mb-3">{mod.description}</p>}
              <div className="flex gap-2 mt-3">
                <Link href={`/projects/${projectId}/${mod.id}/board`}>
                  <Button variant="secondary" size="sm">📋 Board</Button>
                </Link>
                <Link href={`/projects/${projectId}/${mod.id}/docs`}>
                  <Button variant="secondary" size="sm">📄 Docs</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Module">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Name</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
              value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Core API" autoFocus />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
              value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={create} disabled={!name.trim()}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
