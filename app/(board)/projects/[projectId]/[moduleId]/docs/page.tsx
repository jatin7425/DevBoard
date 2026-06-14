'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Doc } from '@/lib/types'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'

export default function DocsPage() {
  const { projectId, moduleId } = useParams<{ projectId: string; moduleId: string }>()
  const [docs, setDocs] = useState<Doc[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState('')

  const load = async () => {
    const res = await apiFetch(`/api/docs/${moduleId}`)
    const data = await res.json()
    setDocs(data.docs || [])
  }

  useEffect(() => { load() }, [moduleId])

  const create = async () => {
    if (!title.trim()) return
    await apiFetch(`/api/docs/${moduleId}`, { method: 'POST', body: JSON.stringify({ title }) })
    setTitle('')
    setModalOpen(false)
    await load()
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-400">
        <Link href="/projects" className="hover:text-gray-600">Projects</Link>
        <span>/</span>
        <Link href={`/projects/${projectId}`} className="hover:text-gray-600">Project</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Docs</span>
        <div className="ml-auto">
          <Link href={`/projects/${projectId}/${moduleId}/board`}
            className="text-sm text-indigo-600 hover:text-indigo-800">📋 Switch to Board →</Link>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-700">Documentation</h2>
        <Button size="sm" onClick={() => setModalOpen(true)}>+ New Doc</Button>
      </div>

      {docs.length === 0 ? (
        <EmptyState icon="📄" title="No docs yet" description="Create documentation for this module" />
      ) : (
        <div className="space-y-2">
          {docs.map(doc => (
            <Link key={doc.id} href={`/projects/${projectId}/${moduleId}/docs/${doc.id}`}>
              <div className="bg-white rounded-xl px-5 py-4 border border-gray-100 hover:shadow-sm transition-shadow cursor-pointer flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{doc.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Updated {new Date(doc.updated_at).toLocaleDateString()}</p>
                </div>
                <span className="text-gray-300">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Doc">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Title</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
              value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. API Reference" autoFocus
              onKeyDown={e => e.key === 'Enter' && create()} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={create} disabled={!title.trim()}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
