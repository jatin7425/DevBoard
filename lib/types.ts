export interface Project {
  id: string
  name: string
  description: string
  color: string
  created_at: string
  updated_at: string
}

export interface Module {
  id: string
  project_id: string
  name: string
  description: string
  order: number
  created_at: string
  updated_at: string
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Task {
  id: string
  module_id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  tags: string[]
  order: number
  created_at: string
  updated_at: string
}

export interface Doc {
  id: string
  module_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}
