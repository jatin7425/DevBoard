'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Doc } from '@/lib/types'
import { apiFetch } from '@/lib/api'
import { DocEditor } from '@/components/docs/DocEditor'
import { Button } from '@/components/ui/Button'

export default function DocPage() {
  const { projectId, moduleId, docId } = useParams<{ projectId: string; moduleId: string; docId: string }>()
  const [doc, setDoc] = useState<Doc | null>(null)
  const router = useRouter()

  useEffect(() => {
    apiFetch(`/api/docs/${moduleId}/${docId}`).then(r => r.json()).then(d => setDoc(d.doc))
  }, [moduleId, docId])

  const deleteDoc = async () => {
    if (!confirm('Delete this doc?')) return
    await apiFetch(`/api/docs/${moduleId}/${docId}`, { method: 'DELETE' })
    router.push(`/projects/${projectId}/${moduleId}/docs`)
  }

  if (!doc) return <div className="text-gray-400 text-sm">Loading...</div>

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
        <Link href="/projects" className="hover:text-gray-600">Projects</Link>
        <span>/</span>
        <Link href={`/projects/${projectId}`} className="hover:text-gray-600">Project</Link>
        <span>/</span>
        <Link href={`/projects/${projectId}/${moduleId}/docs`} className="hover:text-gray-600">Docs</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium truncate">{doc.title}</span>
        <div className="ml-auto">
          <Button variant="danger" size="sm" onClick={deleteDoc}>Delete</Button>
        </div>
      </div>
      <div className="flex-1 bg-white rounded-xl border border-gray-100 p-6 overflow-hidden flex flex-col">
        <DocEditor doc={doc} onSaved={setDoc} />
      </div>
    </div>
  )
}
