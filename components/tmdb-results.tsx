"use client"

import * as React from "react"
import Image from "next/image"

import MediaCardLg from "@/components/media-card-lg"
import MediaCardSm from "@/components/media-card-sm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type {
    Movie,
    Series,
    TmdbMediaDetailPayload,
    TmdbPersonDetailPayload,
    TmdbSearchMediaPreview,
    TmdbSearchPersonPreview,
    TmdbSearchPreview,
} from "@/lib/types"

type SearchMode = "media" | "person"
type DetailPayload = TmdbMediaDetailPayload | TmdbPersonDetailPayload

function isPersonPreview(item: TmdbSearchPreview): item is TmdbSearchPersonPreview {
    return item.type === "person"
}

function isPersonDetail(payload: DetailPayload | null): payload is TmdbPersonDetailPayload {
    return payload?.type === "person"
}

function getMediaKind(type: "movie" | "tv") {
    return type === "movie" ? "movie" : "series"
}

export function TmdbResults() {
    const [query, setQuery] = React.useState("Dune")
    const deferredQuery = React.useDeferredValue(query.trim())
    const [mode, setMode] = React.useState<SearchMode>("media")
    const [results, setResults] = React.useState<TmdbSearchPreview[]>([])
    const [selectedId, setSelectedId] = React.useState<number | null>(null)
    const [detail, setDetail] = React.useState<DetailPayload | null>(null)
    const [isSearching, setIsSearching] = React.useState(false)
    const [isLoadingDetail, setIsLoadingDetail] = React.useState(false)
    const [searchError, setSearchError] = React.useState<string | null>(null)
    const [detailError, setDetailError] = React.useState<string | null>(null)

    const loadDetail = React.useCallback(async (item: TmdbSearchPreview) => {
        setSelectedId(item.id)
        setIsLoadingDetail(true)
        setDetailError(null)

        try {
            const url = isPersonPreview(item)
                ? `/api/tmdb?id=${item.id}&mode=person`
                : `/api/tmdb?id=${item.id}&type=${item.type}`

            const response = await fetch(url)
            const payload = await response.json()

            if (!response.ok) {
                throw new Error(payload.error ?? "Unable to load TMDB detail.")
            }

            setDetail(payload)
        } catch (requestError) {
            setDetail(null)
            setDetailError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to load TMDB detail."
            )
        } finally {
            setIsLoadingDetail(false)
        }
    }, [])

    React.useEffect(() => {
        if (deferredQuery.length < 2) {
            setResults([])
            setSelectedId(null)
            setDetail(null)
            setSearchError(null)
            setIsSearching(false)
            return
        }

        const controller = new AbortController()
        let isMounted = true

        async function search() {
            try {
                setIsSearching(true)
                setSearchError(null)

                const response = await fetch(
                    `/api/tmdb?q=${encodeURIComponent(deferredQuery)}&mode=${mode}`,
                    { signal: controller.signal }
                )
                const payload = (await response.json()) as TmdbSearchPreview[] | { error?: string }

                if (!response.ok) {
                    throw new Error(
                        "error" in payload ? payload.error ?? "Search failed." : "Search failed."
                    )
                }

                if (!isMounted) {
                    return
                }

                const nextResults = payload as TmdbSearchPreview[]
                setResults(nextResults)

                if (nextResults.length === 0) {
                    setSelectedId(null)
                    setDetail(null)
                    return
                }

                void loadDetail(nextResults[0])
            } catch (requestError) {
                if (!isMounted || controller.signal.aborted) {
                    return
                }

                setResults([])
                setSelectedId(null)
                setDetail(null)
                setSearchError(
                    requestError instanceof Error
                        ? requestError.message
                        : "Unable to search TMDB."
                )
            } finally {
                if (isMounted) {
                    setIsSearching(false)
                }
            }
        }

        void search()

        return () => {
            isMounted = false
            controller.abort()
        }
    }, [deferredQuery, loadDetail, mode])

    return (
        <main className="min-h-screen bg-muted px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <Card>
                    <CardHeader className="gap-4">
                        <div className="space-y-1">
                            <CardTitle>TMDB Search Sandbox</CardTitle>
                            <CardDescription>
                                Search media titles, people, a TMDB URL, or a raw TMDB id through the local route.
                            </CardDescription>
                        </div>

                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <Input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search Dune, Arcane, a TMDB url, or an id"
                                className="h-10"
                            />

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant={mode === "media" ? "default" : "outline"}
                                    onClick={() => setMode("media")}
                                >
                                    Media
                                </Button>
                                <Button
                                    type="button"
                                    variant={mode === "person" ? "default" : "outline"}
                                    onClick={() => setMode("person")}
                                >
                                    People
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary">Mode: {mode}</Badge>
                            <Badge variant="outline">Live route: /api/tmdb</Badge>
                            {deferredQuery.length >= 2 ? <Badge variant="outline">Query: {deferredQuery}</Badge> : null}
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle>Results</CardTitle>
                            <CardDescription>
                                {mode === "media"
                                    ? "Small-card previews now match the new TMDB search route output."
                                    : "People results come from the dedicated TMDB person search."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {deferredQuery.length < 2 ? (
                                <p className="text-sm text-muted-foreground">Enter at least 2 characters to search.</p>
                            ) : null}

                            {isSearching ? <p className="text-sm text-muted-foreground">Searching TMDB...</p> : null}

                            {searchError ? (
                                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                    {searchError}
                                </div>
                            ) : null}

                            {!isSearching && deferredQuery.length >= 2 && results.length === 0 && !searchError ? (
                                <p className="text-sm text-muted-foreground">No results found.</p>
                            ) : null}

                            <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                                {results.map((item) => {
                                    const isActive = selectedId === item.id

                                    if (isPersonPreview(item)) {
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => void loadDetail(item)}
                                                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                                                    isActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/60"
                                                }`}
                                            >
                                                <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md bg-muted">
                                                    {item.image ? (
                                                        <Image
                                                            src={item.image}
                                                            alt={item.name}
                                                            fill
                                                            sizes="44px"
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                                                            No image
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold">{item.name}</p>
                                                    <p className="truncate text-xs text-muted-foreground">{item.known || "Person"}</p>
                                                </div>
                                            </button>
                                        )
                                    }

                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => void loadDetail(item)}
                                            className={`w-full rounded-xl p-1 text-left transition-colors ${
                                                isActive ? "bg-primary/5" : "hover:bg-muted/50"
                                            }`}
                                        >
                                            <MediaCardSm
                                                media={item as TmdbSearchMediaPreview}
                                                kind={getMediaKind(item.type)}
                                                className={isActive ? "w-full border-primary/40" : "w-full"}
                                            />
                                        </button>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Detail</CardTitle>
                                <CardDescription>
                                    Selecting a result now calls the detail branch of your updated route.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isLoadingDetail ? <p className="text-sm text-muted-foreground">Loading detail...</p> : null}

                                {detailError ? (
                                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                        {detailError}
                                    </div>
                                ) : null}

                                {!detail && !isLoadingDetail && !detailError ? (
                                    <p className="text-sm text-muted-foreground">Select a result to inspect the route payload.</p>
                                ) : null}

                                {detail && !isPersonDetail(detail) ? (
                                    <div className="space-y-4">
                                        <MediaCardLg media={detail.detail as Movie | Series} kind={getMediaKind(detail.type)} />

                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary">{detail.type}</Badge>
                                            <Badge variant="outline">{detail.normalized.year || "Unknown year"}</Badge>
                                            <Badge variant="outline">{detail.normalized.country || "Unknown country"}</Badge>
                                            <Badge variant="outline">{detail.normalized.language.toUpperCase()}</Badge>
                                            {detail.normalized.runtime ? <Badge variant="outline">{detail.normalized.runtime} min</Badge> : null}
                                        </div>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Normalized payload</CardTitle>
                                            </CardHeader>
                                            <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                                                <div>
                                                    <p className="font-medium text-foreground">Original title</p>
                                                    <p>{detail.normalized.originalTitle || "Not provided"}</p>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">IMDb</p>
                                                    <p>{detail.normalized.imdbId || "Not linked"}</p>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <p className="font-medium text-foreground">Genres</p>
                                                    <p>{detail.normalized.genres.join(", ") || "No genres"}</p>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <p className="font-medium text-foreground">Description</p>
                                                    <p>{detail.normalized.description || "No description."}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ) : null}

                                {isPersonDetail(detail) ? (
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row">
                                            <div className="relative h-40 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                                                {detail.normalized.image ? (
                                                    <Image
                                                        src={detail.normalized.image}
                                                        alt={detail.normalized.name}
                                                        fill
                                                        sizes="112px"
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <h3 className="text-xl font-semibold">{detail.normalized.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{detail.detail.known_for_department || detail.normalized.gender}</p>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {detail.normalized.birthDate ? <Badge variant="outline">Born {detail.normalized.birthDate}</Badge> : null}
                                                    {detail.normalized.birthCountry ? <Badge variant="outline">{detail.normalized.birthCountry}</Badge> : null}
                                                    {detail.normalized.imdbId ? <Badge variant="secondary">{detail.normalized.imdbId}</Badge> : null}
                                                </div>

                                                <p className="text-sm leading-6 text-muted-foreground">{detail.normalized.bio || "No biography available."}</p>
                                            </div>
                                        </div>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Also known as</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-muted-foreground">{detail.normalized.alsoKnownAs.join(", ") || "No alternate names."}</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    )
}