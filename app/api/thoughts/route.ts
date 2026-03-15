import { NextResponse } from "next/server"

import {
  getThought,
  removeThought,
  upsertThought,
  type ThoughtEntityType,
  type ThoughtLookup,
} from "@/lib/thoughts-db"

export const runtime = "nodejs"

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null

  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

function normalizeAccountId(input: string | null | undefined) {
  const value = (input ?? "").trim()
  return value || "guest"
}

function parseThoughtLookup(input: {
  accountId: string
  entityType: ThoughtEntityType
  mediaId: number | null
  seriesId: number | null
  seasonNumber: number | null
  episodeNumber: number | null
}): ThoughtLookup | { error: string } {
  if (input.entityType === "episode") {
    if (!input.seriesId || !input.seasonNumber || !input.episodeNumber) {
      return {
        error: "seriesId, seasonNumber, and episodeNumber are required for episode thoughts.",
      }
    }

    return {
      accountId: input.accountId,
      entityType: "episode",
      seriesId: input.seriesId,
      seasonNumber: input.seasonNumber,
      episodeNumber: input.episodeNumber,
    }
  }

  if (!input.mediaId) {
    return {
      error: "mediaId is required for movie/tv thoughts.",
    }
  }

  return {
    accountId: input.accountId,
    entityType: input.entityType,
    mediaId: input.mediaId,
  }
}

function parseEntityType(value: string | null | undefined): ThoughtEntityType {
  if (value === "tv") return "tv"
  if (value === "episode") return "episode"
  return "movie"
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const accountId = normalizeAccountId(searchParams.get("accountId"))
  const entityType = parseEntityType(searchParams.get("entityType"))
  const mediaId = parsePositiveInt(searchParams.get("mediaId"))
  const seriesId = parsePositiveInt(searchParams.get("seriesId"))
  const seasonNumber = parsePositiveInt(searchParams.get("seasonNumber"))
  const episodeNumber = parsePositiveInt(searchParams.get("episodeNumber"))

  const parsed = parseThoughtLookup({
    accountId,
    entityType,
    mediaId,
    seriesId,
    seasonNumber,
    episodeNumber,
  })

  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  try {
    const record = await getThought(parsed)

    return NextResponse.json(
      {
        thought: record?.thought ?? null,
        updatedAt: record?.updatedAt ?? null,
        source: "mediahub-db",
        tmdbSupportsThoughts: false,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load thought from persistent DB.",
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))

  const accountId = normalizeAccountId(
    typeof body.accountId === "string" ? body.accountId : null
  )
  const entityType = parseEntityType(
    typeof body.entityType === "string" ? body.entityType : null
  )
  const mediaId = Number.isFinite(Number(body.mediaId)) ? Number(body.mediaId) : null
  const seriesId = Number.isFinite(Number(body.seriesId)) ? Number(body.seriesId) : null
  const seasonNumber = Number.isFinite(Number(body.seasonNumber)) ? Number(body.seasonNumber) : null
  const episodeNumber = Number.isFinite(Number(body.episodeNumber)) ? Number(body.episodeNumber) : null
  const thought = typeof body.text === "string" ? body.text.trim() : ""

  if (thought.length > 1600) {
    return NextResponse.json(
      { error: "Thought is too long. Max 1600 characters." },
      { status: 400 }
    )
  }

  const parsed = parseThoughtLookup({
    accountId,
    entityType,
    mediaId,
    seriesId,
    seasonNumber,
    episodeNumber,
  })

  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  try {
    if (!thought.length) {
      await removeThought(parsed)
      return NextResponse.json(
        { success: true, thought: null },
        { headers: NO_STORE_HEADERS }
      )
    }

    const result = await upsertThought(parsed, thought)

    return NextResponse.json(
      {
        success: true,
        thought: result.thought,
        updatedAt: result.updatedAt,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save thought to persistent DB.",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)

  const accountId = normalizeAccountId(searchParams.get("accountId"))
  const entityType = parseEntityType(searchParams.get("entityType"))
  const mediaId = parsePositiveInt(searchParams.get("mediaId"))
  const seriesId = parsePositiveInt(searchParams.get("seriesId"))
  const seasonNumber = parsePositiveInt(searchParams.get("seasonNumber"))
  const episodeNumber = parsePositiveInt(searchParams.get("episodeNumber"))

  const parsed = parseThoughtLookup({
    accountId,
    entityType,
    mediaId,
    seriesId,
    seasonNumber,
    episodeNumber,
  })

  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  try {
    await removeThought(parsed)
    return NextResponse.json(
      { success: true, thought: null },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to remove thought from persistent DB.",
      },
      { status: 500 }
    )
  }
}