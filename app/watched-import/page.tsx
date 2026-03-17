"use client"

import * as React from "react"

import { useTmdbAuth } from "@/components/tmdb-auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type ParsedHistoryRow = {
    title: string
    year?: string
    watchedAt?: string
    source: "file" | "paste"
}

type ImportMatch = ParsedHistoryRow & {
    tmdbId?: number
    mediaType?: "movie" | "tv"
    matchedTitle?: string
    matchedYear?: string
    status: "matched" | "unmatched"
    alreadyInList?: boolean
    error?: string
}

type TmdbSearchResult = {
    id: number
    title: string
    year: string
    type: "movie" | "tv" | "person"
}

type TmdbMediaSearchResult = Omit<TmdbSearchResult, "type"> & {
    type: "movie" | "tv"
}

const DEFAULT_LIST_STORAGE_KEY = "tmdb.import.listId"
const TITLE_KEYS = [
    "title",
    "name",
    "video title",
    "show title",
    "program",
    "program title",
    "content title",
]

const YEAR_KEYS = ["year", "release year", "release_year"]
const DATE_KEYS = ["date", "watched", "watched at", "viewed", "watch date"]

function parseListId(value: string): number | null {
    const parsed = Number.parseInt(value.trim(), 10)
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return null
    }
    return parsed
}

function parseYearFromText(value: string): string | undefined {
    const match = value.match(/\b(19\d{2}|20\d{2}|21\d{2})\b/)
    return match?.[1]
}

function normalizeTitle(raw: string): string {
    return raw
        .replace(/\s+/g, " ")
        .replace(/\(\d{4}\)/g, "")
        .trim()
}

function stripEpisodePrefix(raw: string): string {
    return raw
        .replace(/^(?:episode\s*\d+|ep\.?\s*\d+|s\d+\s*e\d+|\d+)\s*[:\-.)]\s*/i, "")
        .trim()
}

function buildMatchQueries(rawTitle: string): string[] {
    const normalized = normalizeTitle(rawTitle)
    const candidates = new Set<string>()

    if (normalized) {
        candidates.add(normalized)
    }

    const withoutEpisodePrefix = normalizeTitle(stripEpisodePrefix(normalized))
    if (withoutEpisodePrefix) {
        candidates.add(withoutEpisodePrefix)
    }

    if (normalized.includes(":")) {
        const parts = normalized
            .split(":")
            .map((part) => normalizeTitle(part))
            .filter(Boolean)

        if (parts.length >= 2) {
            // Netflix history often stores TV rows as "Series: Episode".
            candidates.add(parts[0])

            const firstLooksLikeEpisode = /^(?:episode\s*\d+|ep\.?\s*\d+|s\d+\s*e\d+|\d+)$/i.test(parts[0])
            if (firstLooksLikeEpisode) {
                candidates.add(parts[1])
            }
        }
    }

    return Array.from(candidates).filter((query) => query.length > 1)
}

function normalizeKey(raw: string): string {
    return raw.trim().toLowerCase().replace(/[_-]+/g, " ")
}

function splitCsvLine(line: string): string[] {
    const values: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i]

        if (char === '"') {
            const next = line[i + 1]
            if (inQuotes && next === '"') {
                current += '"'
                i += 1
            } else {
                inQuotes = !inQuotes
            }
            continue
        }

        if (char === "," && !inQuotes) {
            values.push(current)
            current = ""
            continue
        }

        current += char
    }

    values.push(current)
    return values.map((entry) => entry.trim())
}

function parseCsvContent(content: string): ParsedHistoryRow[] {
    const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)

    if (!lines.length) return []

    const headerValues = splitCsvLine(lines[0])
    const headers = headerValues.map(normalizeKey)

    const titleIndex = headers.findIndex((header) => TITLE_KEYS.includes(header))
    const yearIndex = headers.findIndex((header) => YEAR_KEYS.includes(header))
    const dateIndex = headers.findIndex((header) => DATE_KEYS.includes(header))

    const mapped: ParsedHistoryRow[] = []

    for (let i = 1; i < lines.length; i += 1) {
        const row = splitCsvLine(lines[i])
        const fallbackTitle = row[0] ?? ""
        const rawTitle = titleIndex >= 0 ? row[titleIndex] ?? "" : fallbackTitle
        const title = normalizeTitle(rawTitle)

        if (!title) continue

        const explicitYear = yearIndex >= 0 ? row[yearIndex] ?? "" : ""
        const derivedYear = explicitYear || parseYearFromText(rawTitle) || parseYearFromText(row.join(" "))
        const watchedAt = dateIndex >= 0 ? row[dateIndex] ?? undefined : undefined

        mapped.push({
            title,
            year: derivedYear,
            watchedAt,
            source: "file",
        })
    }

    return mapped
}

function parseJsonContent(content: string): ParsedHistoryRow[] {
    const parsed = JSON.parse(content) as unknown

    const entries = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object" && Array.isArray((parsed as { items?: unknown[] }).items)
            ? (parsed as { items: unknown[] }).items
            : []

    const mapped: ParsedHistoryRow[] = []

    for (const entry of entries) {
        if (!entry || typeof entry !== "object") continue

        const objectEntry = entry as Record<string, unknown>
        const fields = Object.entries(objectEntry).reduce<Record<string, string>>((acc, [key, value]) => {
            if (typeof value === "string") {
                acc[normalizeKey(key)] = value
            }
            return acc
        }, {})

        const rawTitle = TITLE_KEYS.map((key) => fields[key]).find(Boolean) ?? ""
        const title = normalizeTitle(rawTitle)

        if (!title) continue

        const year = YEAR_KEYS.map((key) => fields[key]).find(Boolean) ?? parseYearFromText(rawTitle)
        const watchedAt = DATE_KEYS.map((key) => fields[key]).find(Boolean)

        mapped.push({
            title,
            year,
            watchedAt,
            source: "file",
        })
    }

    return mapped
}

function parsePlainTextContent(content: string): ParsedHistoryRow[] {
    return content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const year = parseYearFromText(line)
            return {
                title: normalizeTitle(line),
                year,
                source: "file" as const,
            }
        })
        .filter((item) => item.title)
}

function parsePastedTitles(content: string): ParsedHistoryRow[] {
    return content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const year = parseYearFromText(line)
            return {
                title: normalizeTitle(line),
                year,
                source: "paste" as const,
            }
        })
        .filter((item) => item.title)
}

function dedupeRows(rows: ParsedHistoryRow[]): ParsedHistoryRow[] {
    const seen = new Set<string>()
    const deduped: ParsedHistoryRow[] = []

    for (const row of rows) {
        const key = `${row.title.toLowerCase()}::${row.year ?? ""}`
        if (seen.has(key)) continue
        seen.add(key)
        deduped.push(row)
    }

    return deduped
}

function getRowKey(row: ParsedHistoryRow): string {
    return `${row.title.toLowerCase()}::${row.year ?? ""}`
}

function getMediaKey(mediaId: number, mediaType: "movie" | "tv"): string {
    return `${mediaType}:${mediaId}`
}

function selectBestMatch(
    mediaResults: TmdbMediaSearchResult[],
    year: string | undefined,
    preferTvMatches: boolean
): TmdbMediaSearchResult {
    const exactYearMatches = year ? mediaResults.filter((entry) => entry.year === year) : []

    if (preferTvMatches) {
        const tvExactYear = exactYearMatches.find((entry) => entry.type === "tv")
        if (tvExactYear) return tvExactYear

        const tvFallback = mediaResults.find((entry) => entry.type === "tv")
        if (tvFallback) return tvFallback
    }

    if (exactYearMatches.length) {
        return exactYearMatches[0]
    }

    return mediaResults[0]
}

async function matchRowWithTmdb(row: ParsedHistoryRow, preferTvMatches: boolean): Promise<ImportMatch> {
    const queries = buildMatchQueries(row.title)

    if (!queries.length) {
        return {
            ...row,
            status: "unmatched",
            error: "No valid title to search.",
        }
    }

    try {
        for (const query of queries) {
            const response = await fetch(`/api/tmdb?q=${encodeURIComponent(query)}&mode=media`)
            const payload = (await response.json()) as TmdbSearchResult[] | { error?: string }

            if (!response.ok) {
                continue
            }

            const mediaResults = (payload as TmdbSearchResult[]).filter(
                (entry): entry is TmdbMediaSearchResult => entry.type === "movie" || entry.type === "tv"
            )

            if (!mediaResults.length) {
                continue
            }

            const selected = selectBestMatch(mediaResults, row.year, preferTvMatches)

            return {
                ...row,
                status: "matched",
                tmdbId: selected.id,
                mediaType: selected.type,
                matchedTitle: selected.title,
                matchedYear: selected.year,
            }
        }

        return {
            ...row,
            status: "unmatched",
            error: "No TMDB result found.",
        }
    } catch (error) {
        return {
            ...row,
            status: "unmatched",
            error: error instanceof Error ? error.message : "Search failed.",
        }
    }
}

export default function WatchedImportPage() {
    const { isHydrated, sessionId } = useTmdbAuth()

    const [targetListInput, setTargetListInput] = React.useState("")
    const [fileName, setFileName] = React.useState("")
    const [pasteInput, setPasteInput] = React.useState("")
    const [parsedRows, setParsedRows] = React.useState<ParsedHistoryRow[]>([])
    const [matches, setMatches] = React.useState<ImportMatch[]>([])
    const [isMatching, setIsMatching] = React.useState(false)
    const [isImporting, setIsImporting] = React.useState(false)
    const [hideAlreadyInList, setHideAlreadyInList] = React.useState(false)
    const [preferTvMatches, setPreferTvMatches] = React.useState(true)
    const [status, setStatus] = React.useState<string | null>(null)
    const [error, setError] = React.useState<string | null>(null)

    const listId = React.useMemo(() => parseListId(targetListInput), [targetListInput])

    React.useEffect(() => {
        if (!isHydrated) return
        const savedListId = window.localStorage.getItem(DEFAULT_LIST_STORAGE_KEY) ?? ""
        setTargetListInput(savedListId)
    }, [isHydrated])

    React.useEffect(() => {
        if (!isHydrated) return
        const value = targetListInput.trim()
        if (value) {
            window.localStorage.setItem(DEFAULT_LIST_STORAGE_KEY, value)
        } else {
            window.localStorage.removeItem(DEFAULT_LIST_STORAGE_KEY)
        }
    }, [isHydrated, targetListInput])

    async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return

        const content = await file.text()
        const lowerName = file.name.toLowerCase()

        try {
            let nextRows: ParsedHistoryRow[] = []

            if (lowerName.endsWith(".json")) {
                nextRows = parseJsonContent(content)
            } else if (lowerName.endsWith(".csv")) {
                nextRows = parseCsvContent(content)
            } else if (lowerName.endsWith(".txt")) {
                nextRows = parsePlainTextContent(content)
            } else {
                nextRows = parseCsvContent(content)
            }

            const deduped = dedupeRows(nextRows)
            setFileName(file.name)
            setParsedRows((current) => dedupeRows([...current, ...deduped]))
            setMatches([])
            setError(null)
            setStatus(`Loaded ${deduped.length} entries from ${file.name}.`)
        } catch (parsingError) {
            setError(parsingError instanceof Error ? parsingError.message : "Unable to parse file.")
        }
    }

    function appendPastedTitles() {
        const nextRows = parsePastedTitles(pasteInput)

        if (!nextRows.length) {
            setError("Paste one title per line before appending.")
            return
        }

        setParsedRows((current) => dedupeRows([...current, ...nextRows]))
        setPasteInput("")
        setMatches([])
        setError(null)
        setStatus(`Added ${nextRows.length} pasted entries.`)
    }

    function clearAll() {
        setFileName("")
        setPasteInput("")
        setParsedRows([])
        setMatches([])
        setStatus(null)
        setError(null)
    }

    function removeRow(row: ParsedHistoryRow) {
        const rowKey = getRowKey(row)
        setParsedRows((current) => current.filter((entry) => getRowKey(entry) !== rowKey))
        setMatches((current) => current.filter((entry) => getRowKey(entry) !== rowKey))
    }

    async function loadExistingListItemKeys(targetListId: number): Promise<Set<string>> {
        const params = new URLSearchParams({
            feature: "lists",
            listId: String(targetListId),
        })

        if (sessionId.trim()) {
            params.set("sessionId", sessionId.trim())
        }

        const response = await fetch(`/api/tmdb?${params.toString()}`, {
            cache: "no-store",
        })
        const payload = await response.json()

        if (!response.ok) {
            throw new Error(payload?.error ?? "Unable to load target list for duplicate checks.")
        }

        const keys = new Set<string>()
        const listRows = Array.isArray(payload?.results) ? payload.results : []

        for (const entry of listRows) {
            const mediaId = Number(entry?.id)
            const mediaType = entry?.type === "tv" ? "tv" : "movie"

            if (Number.isFinite(mediaId) && mediaId > 0) {
                keys.add(getMediaKey(mediaId, mediaType))
            }
        }

        return keys
    }

    async function runMatchingScript() {
        if (!parsedRows.length) {
            setError("Add watch-history data first.")
            return
        }

        setIsMatching(true)
        setError(null)
        setStatus("Matching titles with TMDB...")

        let existingKeys = new Set<string>()

        if (listId) {
            try {
                existingKeys = await loadExistingListItemKeys(listId)
            } catch (duplicateCheckError) {
                setError(
                    duplicateCheckError instanceof Error
                        ? duplicateCheckError.message
                        : "Unable to verify existing list items."
                )
            }
        }

        const nextMatchesRaw = await Promise.all(parsedRows.map((row) => matchRowWithTmdb(row, preferTvMatches)))
        const nextMatches = nextMatchesRaw.map((entry) => {
            if (entry.status !== "matched" || !entry.tmdbId || !entry.mediaType) {
                return entry
            }

            const alreadyInList = existingKeys.has(getMediaKey(entry.tmdbId, entry.mediaType))
            return {
                ...entry,
                alreadyInList,
            }
        })

        setMatches(nextMatches)
        setIsMatching(false)

        const matchedCount = nextMatches.filter((entry) => entry.status === "matched").length
        const unmatchedCount = nextMatches.length - matchedCount
        const alreadyInListCount = nextMatches.filter((entry) => entry.alreadyInList).length

        setStatus(
            `Matching complete: ${matchedCount} matched, ${unmatchedCount} unmatched, ${alreadyInListCount} already in list.`
        )
    }

    async function importMatchedToList() {
        if (!listId) {
            setError("Enter a valid TMDB list id.")
            return
        }

        if (!sessionId.trim()) {
            setError("Create a TMDB session first. List imports require a session id.")
            return
        }

        const matchedItems = matches.filter(
            (entry) => entry.status === "matched" && entry.tmdbId && entry.mediaType && !entry.alreadyInList
        )

        if (!matchedItems.length) {
            setError("Run matching first and ensure there are matched entries.")
            return
        }

        setIsImporting(true)
        setError(null)

        let imported = 0
        let failed = 0

        for (const item of matchedItems) {
            const response = await fetch("/api/tmdb?feature=lists", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "add",
                    listId,
                    mediaId: item.tmdbId,
                    mediaType: item.mediaType,
                    sessionId,
                }),
            })

            if (response.ok) {
                imported += 1
            } else {
                failed += 1
            }
        }

        setIsImporting(false)
        setStatus(`Import complete. Added ${imported} items. Failed ${failed}.`)
    }

    const matchedCount = matches.filter((entry) => entry.status === "matched").length
    const unmatchedCount = matches.filter((entry) => entry.status === "unmatched").length
    const alreadyInListCount = matches.filter((entry) => entry.alreadyInList).length
    const visibleMatches = hideAlreadyInList ? matches.filter((entry) => !entry.alreadyInList) : matches

    return (
        <main className="min-h-screen bg-muted px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Watched Media Importer</CardTitle>
                        <CardDescription>
                            Import watched titles from Netflix, Disney+, and other export formats, then bulk-add matched
                            TMDB results into one list.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Target TMDB List ID</p>
                                <Input
                                    value={targetListInput}
                                    onChange={(event) => setTargetListInput(event.target.value)}
                                    placeholder="Example: 8639303"
                                />
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium">Upload Watch History File</p>
                                <Input type="file" accept=".csv,.json,.txt" onChange={handleFileUpload} />
                                {fileName ? <p className="text-xs text-muted-foreground">Loaded file: {fileName}</p> : null}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Paste Titles (one per line)</p>
                            <Textarea
                                value={pasteInput}
                                onChange={(event) => setPasteInput(event.target.value)}
                                placeholder={`The Matrix (1999)\nBreaking Bad\nDune 2021`}
                                className="min-h-36"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button onClick={appendPastedTitles} variant="secondary">
                                Append Pasted Titles
                            </Button>
                            <Button
                                onClick={() => setPreferTvMatches((current) => !current)}
                                variant={preferTvMatches ? "default" : "outline"}
                            >
                                {preferTvMatches ? "Prefer TV Matches: On" : "Prefer TV Matches: Off"}
                            </Button>
                            <Button onClick={runMatchingScript} disabled={isMatching || parsedRows.length === 0}>
                                {isMatching ? "Matching..." : "Run Matching Script"}
                            </Button>
                            <Button
                                onClick={importMatchedToList}
                                disabled={isImporting || matches.length === 0 || !listId}
                                variant="default"
                            >
                                {isImporting ? "Importing..." : "Import Matched To List"}
                            </Button>
                            <Button onClick={clearAll} variant="outline">
                                Clear
                            </Button>
                            <Button
                                onClick={() => setHideAlreadyInList((current) => !current)}
                                variant="outline"
                                disabled={matches.length === 0}
                            >
                                {hideAlreadyInList ? "Show Already In List" : "Hide Already In List"}
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">Parsed: {parsedRows.length}</Badge>
                            <Badge variant="secondary">Matched: {matchedCount}</Badge>
                            <Badge variant="outline">Unmatched: {unmatchedCount}</Badge>
                            <Badge variant="outline">Already In List: {alreadyInListCount}</Badge>
                        </div>

                        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
                        {error ? <p className="text-sm text-red-600">{error}</p> : null}
                        {!sessionId.trim() ? (
                            <p className="text-xs text-amber-700">
                                TMDB session is not set. You can still parse and match, but importing to a list requires
                                signing in on the dashboard first.
                            </p>
                        ) : null}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Match Results</CardTitle>
                        <CardDescription>
                            Review matched items before importing. Unmatched rows are kept so you can edit and retry.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {!visibleMatches.length ? (
                            <p className="text-sm text-muted-foreground">No matches yet. Run the script after loading data.</p>
                        ) : (
                            visibleMatches.map((item, index) => (
                                <div
                                    key={`${item.title}-${item.year ?? "n/a"}-${index}`}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background p-3"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {item.title}
                                            {item.year ? ` (${item.year})` : ""}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Source: {item.source}
                                            {item.watchedAt ? ` • Watched: ${item.watchedAt}` : ""}
                                        </p>
                                    </div>
                                    <div className="text-right text-sm">
                                        {item.status === "matched" ? (
                                            <>
                                                <p className={`font-medium ${item.alreadyInList ? "text-amber-700" : "text-emerald-700"}`}>
                                                    {item.matchedTitle}
                                                    {item.matchedYear ? ` (${item.matchedYear})` : ""}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.mediaType} • TMDB #{item.tmdbId}
                                                </p>
                                                {item.alreadyInList ? (
                                                    <p className="text-xs font-medium text-amber-700">Already in target list</p>
                                                ) : null}
                                            </>
                                        ) : (
                                            <p className="text-red-600">{item.error ?? "No match."}</p>
                                        )}
                                    </div>
                                    <div className="w-full sm:w-auto">
                                        <Button type="button" size="sm" variant="outline" onClick={() => removeRow(item)}>
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
