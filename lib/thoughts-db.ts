import { promises as fs } from "node:fs"
import path from "node:path"

export type ThoughtEntityType = "movie" | "tv" | "episode"

export type ThoughtLookup = {
  accountId: string
  entityType: ThoughtEntityType
  mediaId?: number
  seriesId?: number
  seasonNumber?: number
  episodeNumber?: number
}

export type ThoughtRecord = ThoughtLookup & {
  thought: string
  updatedAt: string
}

type SqliteDatabase = {
  exec: (sql: string) => void
  prepare: (sql: string) => {
    get: (...params: Array<string | number | null>) => unknown
    run: (...params: Array<string | number | null>) => unknown
  }
}

const DATA_DIR = path.join(process.cwd(), ".data")
const DB_PATH = path.join(DATA_DIR, "mediahub.sqlite")

let dbPromise: Promise<SqliteDatabase> | null = null

function buildThoughtKey(input: ThoughtLookup) {
  if (input.entityType === "episode") {
    return `${input.accountId}:episode:${input.seriesId}:${input.seasonNumber}:${input.episodeNumber}`
  }

  return `${input.accountId}:${input.entityType}:${input.mediaId}`
}

async function loadSqliteModule() {
  const importFn = Function("moduleName", "return import(moduleName)") as (moduleName: string) => Promise<unknown>
  return importFn("node:sqlite") as Promise<{ DatabaseSync?: new (fileName: string) => SqliteDatabase }>
}

async function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      await fs.mkdir(DATA_DIR, { recursive: true })

      const sqliteModule = await loadSqliteModule()
      const DatabaseSync = sqliteModule.DatabaseSync

      if (!DatabaseSync) {
        throw new Error("node:sqlite is not available in this runtime.")
      }

      const db = new DatabaseSync(DB_PATH)

      db.exec(`
        CREATE TABLE IF NOT EXISTS thoughts (
          thought_key TEXT PRIMARY KEY,
          account_id TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          media_id INTEGER,
          series_id INTEGER,
          season_number INTEGER,
          episode_number INTEGER,
          thought TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `)

      return db
    })()
  }

  return dbPromise
}

export async function getThought(input: ThoughtLookup): Promise<ThoughtRecord | null> {
  const db = await getDb()
  const thoughtKey = buildThoughtKey(input)
  const row = db
    .prepare(
      `SELECT thought, updated_at
       FROM thoughts
       WHERE thought_key = ?`
    )
    .get(thoughtKey) as { thought?: unknown; updated_at?: unknown } | undefined

  if (!row || typeof row.thought !== "string" || typeof row.updated_at !== "string") {
    return null
  }

  return {
    ...input,
    thought: row.thought,
    updatedAt: row.updated_at,
  }
}

export async function upsertThought(input: ThoughtLookup, thought: string) {
  const db = await getDb()
  const thoughtKey = buildThoughtKey(input)
  const updatedAt = new Date().toISOString()

  db.prepare(
    `INSERT INTO thoughts (
      thought_key,
      account_id,
      entity_type,
      media_id,
      series_id,
      season_number,
      episode_number,
      thought,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(thought_key)
    DO UPDATE SET
      thought = excluded.thought,
      updated_at = excluded.updated_at`
  ).run(
    thoughtKey,
    input.accountId,
    input.entityType,
    input.mediaId ?? null,
    input.seriesId ?? null,
    input.seasonNumber ?? null,
    input.episodeNumber ?? null,
    thought,
    updatedAt
  )

  return {
    thought,
    updatedAt,
  }
}

export async function removeThought(input: ThoughtLookup) {
  const db = await getDb()
  const thoughtKey = buildThoughtKey(input)

  db.prepare(`DELETE FROM thoughts WHERE thought_key = ?`).run(thoughtKey)
}