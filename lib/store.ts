import "server-only"
import fs from "fs"
import path from "path"
import { unstable_noStore as noStore } from "next/cache"
import { buildDemos } from "./synthetic"
import type { Study } from "./types"
import { normalizeWorkspace, type Workspace } from "./workspace"

const VERSION = 1
const DEMO_ORDER = ["northwind", "brightline", "halcyon", "lumen"]

interface DB {
  version: number
  studies: Study[]
  workspace?: Workspace
}

let memory: DB | null = null
let chosenFile: string | null | undefined

function writableFile(): string | null {
  if (chosenFile !== undefined) return chosenFile
  const candidates = [path.join(process.cwd(), "data", "db.json"), path.join("/tmp", "harrierstone-db.json")]
  for (const candidate of candidates) {
    try {
      fs.mkdirSync(path.dirname(candidate), { recursive: true })
      fs.accessSync(path.dirname(candidate), fs.constants.W_OK)
      chosenFile = candidate
      return candidate
    } catch {
      continue
    }
  }
  chosenFile = null
  return null
}

function writeDb(db: DB): void {
  memory = db
  const file = writableFile()
  if (!file) return
  try {
    fs.writeFileSync(file, JSON.stringify(db))
  } catch {
    chosenFile = null
  }
}

export function readDb(): DB {
  noStore()
  if (memory) return memory
  const file = writableFile()
  try {
    if (!file) throw new Error("No writable store")
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as DB
    if (!parsed || parsed.version !== VERSION || !Array.isArray(parsed.studies)) {
      const user = Array.isArray(parsed?.studies) ? parsed.studies.filter((study) => !study.demo) : []
      const next = { version: VERSION, studies: [...buildDemos(), ...user], workspace: parsed?.workspace }
      writeDb(next)
      return next
    }
    memory = parsed
    return parsed
  } catch {
    const next = { version: VERSION, studies: buildDemos() }
    writeDb(next)
    return next
  }
}

export function listStudies(): Study[] {
  const studies = readDb().studies
  const demos = studies.filter((study) => study.demo).sort((a, b) => DEMO_ORDER.indexOf(a.id) - DEMO_ORDER.indexOf(b.id))
  const own = studies.filter((study) => !study.demo).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return [...demos, ...own]
}

export function getStudy(id: string): Study | null {
  return readDb().studies.find((study) => study.id === id) ?? null
}

export function saveStudy(study: Study): void {
  const db = readDb()
  const index = db.studies.findIndex((item) => item.id === study.id)
  if (index === -1) db.studies.push(study)
  else db.studies[index] = study
  writeDb(db)
}

export function removeStudy(id: string): void {
  const db = readDb()
  db.studies = db.studies.filter((study) => study.id !== id || study.demo)
  writeDb(db)
}

export function resetDemos(): void {
  const db = readDb()
  const own = db.studies.filter((study) => !study.demo)
  writeDb({ version: VERSION, studies: [...buildDemos(), ...own], workspace: db.workspace })
}

export function getWorkspace(): Workspace {
  return normalizeWorkspace(readDb().workspace)
}

export function saveWorkspace(workspace: Workspace): void {
  const db = readDb()
  db.workspace = workspace
  writeDb(db)
}
