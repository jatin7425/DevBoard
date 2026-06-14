'use client'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Doc } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { apiFetch } from '@/lib/api'

export function DocEditor({ doc, onSaved }: { doc: Doc; onSaved: (doc: Doc) => void }) {
  const [title, setTitle] = useState(doc.title)
  const [content, setContent] = useState(doc.content)
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    const res = await apiFetch(`/api/docs/${doc.module_id}/${doc.id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, content }),
    })
    const data = await res.json()
    onSaved(data.doc)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 gap-4">
        <input
          className="flex-1 text-xl font-bold text-gray-900 outline-none border-b border-transparent focus:border-indigo-300 pb-1"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPreview(p => !p)}>
            {preview ? '✏️ Edit' : '👁️ Preview'}
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save'}
          </Button>
        </div>
      </div>

      {preview ? (
        <div className="flex-1 overflow-y-auto prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      ) : (
        <div className="flex-1 flex gap-4">
          <textarea
            className="flex-1 border border-gray-200 rounded-lg p-4 text-sm font-mono outline-none focus:border-indigo-400 resize-none"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write markdown here..."
          />
          <div className="flex-1 border border-gray-100 rounded-lg p-4 overflow-y-auto prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '*Nothing yet...*'}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}
