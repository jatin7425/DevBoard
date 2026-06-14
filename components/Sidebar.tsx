'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { Project, Module } from '@/lib/types'
import { usePin } from '@/lib/hooks/usePin'

export function Sidebar() {
  const [projects, setProjects] = useState<Project[]>([])
  const [modules, setModules] = useState<Record<string, Module[]>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const pathname = usePathname()
  const router = useRouter()
  const { clearPin } = usePin()

  useEffect(() => {
    apiFetch('/api/projects').then(r => r.json()).then(d => setProjects(d.projects || []))
  }, [])

  const toggleProject = async (projectId: string) => {
    setExpanded(p => ({ ...p, [projectId]: !p[projectId] }))
    if (!modules[projectId]) {
      const res = await apiFetch(`/api/modules/${projectId}`)
      const data = await res.json()
      setModules(p => ({ ...p, [projectId]: data.modules || [] }))
    }
  }

  const activeProject = pathname.split('/')[2]
  const activeModule  = pathname.split('/')[3]

  return (
    <aside className="w-64 bg-[#0F1117] h-screen flex flex-col border-r border-white/5">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/5">
        <Link href="/projects" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">D</div>
          <span className="text-white font-semibold text-sm tracking-tight">DevBoard</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {/* AI Tools link */}
        <Link href="/ai"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors
            ${pathname === '/ai' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
          <span>✦</span> AI Tools
        </Link>

        <div className="px-3 pt-4 pb-1">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Projects</p>
        </div>

        {projects.map(project => (
          <div key={project.id}>
            <button
              onClick={() => toggleProject(project.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer
                ${activeProject === project.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: project.color }} />
              <span className="flex-1 truncate">{project.name}</span>
              <span className="text-gray-600 text-[10px]">{expanded[project.id] ? '▾' : '▸'}</span>
            </button>

            {expanded[project.id] && (
              <div className="ml-5 mt-0.5 space-y-0.5 border-l border-white/5 pl-3">
                {(modules[project.id] || []).map(mod => (
                  <div key={mod.id} className="space-y-0.5">
                    <p className="text-[10px] text-gray-600 px-2 pt-1.5 truncate">{mod.name}</p>
                    <Link href={`/projects/${project.id}/${mod.id}/board`}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors
                        ${activeModule === mod.id && pathname.includes('board') ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                      <span className="text-[10px]">▦</span> Board
                    </Link>
                    <Link href={`/projects/${project.id}/${mod.id}/docs`}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors
                        ${activeModule === mod.id && pathname.includes('docs') ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                      <span className="text-[10px]">≡</span> Docs
                    </Link>
                  </div>
                ))}
                {(modules[project.id] || []).length === 0 && (
                  <p className="text-[10px] text-gray-700 px-2 py-1">No modules</p>
                )}
              </div>
            )}
          </div>
        ))}

        {projects.length === 0 && (
          <p className="text-[10px] text-gray-700 px-3 py-2">No projects yet</p>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-white/5 space-y-0.5">
        <Link href="/projects"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors
            ${pathname === '/projects' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
          <span>⊞</span> All Projects
        </Link>
        <button
          onClick={() => { clearPin(); router.push('/') }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-left">
          <span>⊙</span> Lock
        </button>
      </div>
    </aside>
  )
}
