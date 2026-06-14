import fs from 'fs'
import path from 'path'

const dataDir = path.join(process.cwd(), 'data')

export function readJSON<T>(file: string): T {
  const filePath = path.join(dataDir, `${file}.json`)
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(getDefault(file), null, 2))
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

export function writeJSON(file: string, data: unknown): void {
  const filePath = path.join(dataDir, `${file}.json`)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

function getDefault(file: string) {
  const defaults: Record<string, unknown> = {
    projects: { projects: [] },
    modules:  { modules: [] },
    tasks:    { tasks: [] },
    docs:     { docs: [] },
  }
  return defaults[file] ?? {}
}
