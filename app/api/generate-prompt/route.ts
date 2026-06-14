import { NextRequest } from 'next/server'
import { validatePin, unauthorizedResponse } from '@/lib/auth'
import { readJSON } from '@/lib/data'
import { Project, Module, Task, Doc } from '@/lib/types'

interface ProjectsData { projects: Project[] }
interface ModulesData  { modules: Module[] }
interface TasksData    { tasks: Task[] }
interface DocsData     { docs: Doc[] }

export async function POST(req: NextRequest) {
  if (!validatePin(req)) return unauthorizedResponse()

  const { projectId } = await req.json()
  if (!projectId) return Response.json({ error: 'projectId required' }, { status: 400 })

  const { projects } = await readJSON<ProjectsData>('projects')
  const project = projects.find(p => p.id === projectId)
  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 })

  const { modules } = await readJSON<ModulesData>('modules')
  const { tasks }   = await readJSON<TasksData>('tasks')
  const { docs }    = await readJSON<DocsData>('docs')

  const projectModules = modules.filter(m => m.project_id === projectId)

  const moduleSummaries = projectModules.map(mod => {
    const modTasks = tasks.filter(t => t.module_id === mod.id)
    const modDocs  = docs.filter(d => d.module_id === mod.id)
    return {
      name: mod.name,
      description: mod.description,
      tasks: modTasks.map(t => ({ title: t.title, status: t.status, priority: t.priority, tags: t.tags })),
      docs: modDocs.map(d => d.title),
    }
  })

  const todoCount     = tasks.filter(t => projectModules.some(m => m.id === t.module_id) && t.status === 'TODO').length
  const doneCount     = tasks.filter(t => projectModules.some(m => m.id === t.module_id) && t.status === 'DONE').length
  const inProgressCount = tasks.filter(t => projectModules.some(m => m.id === t.module_id) && t.status === 'IN_PROGRESS').length

  const prompt = `You are a senior software architect and project planner.

I am working on a project and need you to generate a FULL project plan in a specific markdown format that I will import back into my project management tool.

## My Project Context

**Project Name:** ${project.name}
**Description:** ${project.description || 'Not provided'}

### Current Progress
- Modules built so far: ${projectModules.length}
- Tasks: ${doneCount} done, ${inProgressCount} in progress, ${todoCount} todo

### Existing Modules & Tasks
${moduleSummaries.length === 0 ? 'No modules yet — this is a fresh project.' : moduleSummaries.map(m => `
**Module: ${m.name}**
${m.description ? `Description: ${m.description}` : ''}
Tasks (${m.tasks.length}):
${m.tasks.map(t => `  - [${t.status}] ${t.title} (${t.priority})`).join('\n') || '  None yet'}
Docs: ${m.docs.join(', ') || 'None yet'}
`).join('\n')}

---

## What I Need From You

Based on my project context above, generate a **complete project plan** in EXACTLY this markdown format. Do not deviate from this structure — my import tool depends on it.

\`\`\`markdown
# PROJECT: <project name>
DESCRIPTION: <one line description>

## MODULE: <module name>
DESCRIPTION: <what this module covers>

### TASK: <task title>
PRIORITY: HIGH | MEDIUM | LOW | CRITICAL
STATUS: TODO | IN_PROGRESS | IN_REVIEW | DONE
TAGS: tag1, tag2
DESCRIPTION: <what needs to be done>

### TASK: <another task>
...

### DOC: <doc title>
CONTENT: <brief outline of what this doc should cover, 2-3 sentences>

## MODULE: <another module>
...
\`\`\`

## Rules for your response:
1. Output ONLY the markdown code block above — no explanation before or after
2. Suggest modules I haven't built yet based on my project description
3. Each module must have at least 3 tasks and 1 doc
4. Tasks should be specific and actionable, not vague
5. Include tech notes as a final module called "Tech Notes" with docs covering architecture decisions, deployment, and gotchas
6. If I already have modules, build on top of them — don't repeat what I already have
7. Prioritize tasks logically — foundational work is HIGH/CRITICAL, polish is LOW

Generate the plan now.`

  return Response.json({ prompt, project: project.name })
}
