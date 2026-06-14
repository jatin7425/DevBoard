'use client'
import { useEffect, useState, useRef } from 'react'
import { Project } from '@/lib/types'
import { apiFetch } from '@/lib/api'

export default function AIToolsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    summary?: { projectName: string; projectCreated: boolean; modulesCreated: number; tasksCreated: number; docsCreated: number }
    error?: string
  } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    apiFetch('/api/projects').then(r => r.json()).then(d => setProjects(d.projects || []))
  }, [])

  const generatePrompt = async () => {
    if (!selectedProject) return
    setGenerating(true)
    setPrompt('')
    const res = await apiFetch('/api/generate-prompt', {
      method: 'POST',
      body: JSON.stringify({ projectId: selectedProject }),
    })
    const data = await res.json()
    setPrompt(data.prompt || '')
    setGenerating(false)
  }

  const copy = async () => {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const importPlan = async () => {
    if (!file) return
    setImporting(true)
    setImportResult(null)
    const fd = new FormData()
    fd.append('file', file)
    const pin = localStorage.getItem('devboard_pin') || ''
    const res = await fetch('/api/import-plan', {
      method: 'POST',
      headers: { 'x-devboard-pin': pin },
      body: fd,
    })
    const data = await res.json()
    setImportResult(data)
    setImporting(false)
    if (data.success) { setFile(null); if (fileRef.current) fileRef.current.value = '' }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">AI Tools</h1>
        <p className="text-sm text-gray-500">Generate prompts for AI planning · Import AI responses as tasks</p>
      </div>

      {/* ── STEP 1 ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center gap-3">
          <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">STEP 1</span>
          <h2 className="text-white font-semibold">Generate planning prompt</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Pick a project → copy the generated prompt → paste into ChatGPT or Claude → get back a full plan.
          </p>
          <div className="flex gap-3">
            <select
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-gray-50"
              value={selectedProject}
              onChange={e => { setSelectedProject(e.target.value); setPrompt('') }}
            >
              <option value="">Select a project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              onClick={generatePrompt}
              disabled={!selectedProject || generating}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              {generating ? 'Generating...' : '⚡ Generate'}
            </button>
          </div>

          {prompt && (
            <div className="relative">
              <pre className="bg-gray-950 text-gray-100 rounded-xl p-4 text-xs overflow-auto max-h-72 whitespace-pre-wrap font-mono leading-relaxed">
                {prompt}
              </pre>
              <button
                onClick={copy}
                className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          )}

          {prompt && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              <strong>Next:</strong> Paste this into ChatGPT or Claude → get the response → save it as a <code>.md</code> file → import below ↓
            </div>
          )}
        </div>
      </div>

      {/* ── STEP 2 ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center gap-3">
          <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">STEP 2</span>
          <h2 className="text-white font-semibold">Import AI plan</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Upload the <code className="bg-gray-100 px-1 rounded">.md</code> file from the AI response.
            Projects, modules, tasks and docs will be created automatically.
          </p>

          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
              ${file ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'}`}
          >
            <div className="text-3xl mb-2">{file ? '📄' : '📁'}</div>
            <p className="text-sm font-medium text-gray-700">
              {file ? file.name : 'Click to upload .md file'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Markdown files only'}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".md,text/markdown"
              className="hidden"
              onChange={e => { setFile(e.target.files?.[0] || null); setImportResult(null) }}
            />
          </div>

          {file && (
            <button
              onClick={importPlan}
              disabled={importing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              {importing ? 'Importing...' : '🚀 Import Plan'}
            </button>
          )}

          {importResult && (
            <div className={`rounded-xl p-4 text-sm ${importResult.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              {importResult.success && importResult.summary ? (
                <div className="space-y-2">
                  <p className="font-semibold text-emerald-800">✅ Import successful!</p>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {[
                      { label: 'Project', value: importResult.summary.projectCreated ? `"${importResult.summary.projectName}" created` : `"${importResult.summary.projectName}" already existed` },
                      { label: 'Modules created', value: importResult.summary.modulesCreated },
                      { label: 'Tasks created', value: importResult.summary.tasksCreated },
                      { label: 'Docs created', value: importResult.summary.docsCreated },
                    ].map(item => (
                      <div key={item.label} className="bg-white rounded-lg px-3 py-2 border border-emerald-100">
                        <p className="text-xs text-gray-500">{item.label}</p>
                        <p className="font-medium text-gray-900 text-sm">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Head to Projects to see your new tasks 👇</p>
                </div>
              ) : (
                <p className="text-red-700">❌ {importResult.error || 'Import failed. Check your markdown format.'}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── FORMAT reference ── */}
      <div className="bg-gray-950 rounded-2xl p-6">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Expected markdown format</p>
        <pre className="text-gray-300 text-xs font-mono leading-relaxed whitespace-pre">{`# PROJECT: My Project Name
DESCRIPTION: What this project does

## MODULE: Core API
DESCRIPTION: Backend API layer

### TASK: Build authentication
PRIORITY: HIGH
STATUS: TODO
TAGS: backend, auth
DESCRIPTION: JWT-based auth with refresh tokens

### DOC: API Reference
CONTENT: Documents all endpoints, request/response schemas`}</pre>
      </div>
    </div>
  )
}
