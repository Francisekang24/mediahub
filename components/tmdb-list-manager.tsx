"use client"

import * as React from "react"
import { Plus, Search } from "lucide-react"

import MediaCardMd from "@/components/media-card-md"
import MediaCardSm from "@/components/media-card-sm"
import MediaRow from "@/components/media-row"
import WatchlistButton from "@/components/watchlist-button"
import { useTmdbAuth } from "@/components/tmdb-auth-provider"
import { useWatchlist } from "@/components/watchlist-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { TmdbSearchMediaPreview, TmdbSearchPreview } from "@/lib/types"

type FeatureItem = {
    id: number
    title: string
    year: string
    poster: string | null
    type: "movie" | "tv"
}

type TmdbListManagerProps = {
    pageTitle: string
    pageDescription: string
    mediaType: "movie" | "tv"
    mediaKind: "movie" | "series"
    defaultListId?: number
    listStorageKey: string
}

function isMediaPreview(item: TmdbSearchPreview): item is TmdbSearchMediaPreview {
    return item.type === "movie" || item.type === "tv"
}

function parseListId(value: string): number | null {
    const parsed = Number.parseInt(value.trim(), 10)
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return null
    }
    return parsed
}

export default function TmdbListManager({
    pageTitle,
    pageDescription,
    mediaType,
    mediaKind,
    defaultListId,
    listStorageKey,
}: TmdbListManagerProps) {
    const { accountId, isHydrated, sessionId } = useTmdbAuth()
    const { revision: watchlistRevision } = useWatchlist()

    const [listIdInput, setListIdInput] = React.useState(defaultListId ? String(defaultListId) : "")
    const [watchlistItems, setWatchlistItems] = React.useState<FeatureItem[]>([])
    const [items, setItems] = React.useState<FeatureItem[]>([])
    const [query, setQuery] = React.useState("")
    const [searchQuery, setSearchQuery] = React.useState("")
    const [popoverOpen, setPopoverOpen] = React.useState(false)
    const [isListLoading, setIsListLoading] = React.useState(false)
    const [isWatchlistLoading, setIsWatchlistLoading] = React.useState(false)
    const [isMutating, setIsMutating] = React.useState(false)
    const [isSearching, setIsSearching] = React.useState(false)
    const [isSearchBarSearching, setIsSearchBarSearching] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [status, setStatus] = React.useState<string | null>(null)
    const [searchResults, setSearchResults] = React.useState<TmdbSearchMediaPreview[]>([])
    const [searchBarResults, setSearchBarResults] = React.useState<TmdbSearchMediaPreview[]>([])

    const deferredQuery = React.useDeferredValue(query.trim())
    const deferredSearchQuery = React.useDeferredValue(searchQuery.trim())

    const listId = React.useMemo(() => parseListId(listIdInput), [listIdInput])
    const canMutate = isHydrated && listId !== null && sessionId.trim().length > 0

    const buildListUrl = React.useCallback(
        (targetListId: number) => {
            const params = new URLSearchParams({ feature: "lists", listId: String(targetListId) })

            if (sessionId.trim()) {
                params.set("sessionId", sessionId.trim())
            }

            return `/api/tmdb?${params.toString()}`
        },
        [sessionId]
    )

    React.useEffect(() => {
        if (!isHydrated) return

        const storedValue = window.localStorage.getItem(listStorageKey)
        if (storedValue && parseListId(storedValue)) {
            setListIdInput(storedValue)
            return
        }

        if (defaultListId) {
            setListIdInput(String(defaultListId))
        }
    }, [defaultListId, isHydrated, listStorageKey])

    React.useEffect(() => {
        if (!isHydrated) return

        if (listIdInput.trim()) {
            window.localStorage.setItem(listStorageKey, listIdInput.trim())
            return
        }

        window.localStorage.removeItem(listStorageKey)
    }, [isHydrated, listIdInput, listStorageKey])

    const loadWatchlist = React.useCallback(async () => {
        if (!accountId.trim() || !sessionId.trim()) {
            setWatchlistItems([])
            return
        }

        setIsWatchlistLoading(true)

        const params = new URLSearchParams({
            feature: "watchlist",
            accountId: accountId.trim(),
            sessionId: sessionId.trim(),
            mediaType,
        })

        try {
            const response = await fetch(`/api/tmdb?${params.toString()}`, {
                cache: "no-store",
            })
            const payload = await response.json()

            if (!response.ok) {
                throw new Error(payload?.error ?? "Unable to load watchlist.")
            }

            setWatchlistItems(Array.isArray(payload?.results) ? payload.results : [])
        } catch {
            setWatchlistItems([])
        } finally {
            setIsWatchlistLoading(false)
        }
    }, [accountId, mediaType, sessionId])

    const loadList = React.useCallback(
        async (targetId?: number) => {
            const nextListId = targetId ?? listId
            if (!nextListId) {
                setError("Enter a valid TMDB list id first.")
                return
            }

            setIsListLoading(true)
            setError(null)
            setStatus(null)

            const response = await fetch(buildListUrl(nextListId), {
                cache: "no-store",
            })
            const payload = await response.json()
            setIsListLoading(false)

            if (!response.ok) {
                setError(payload.error ?? "Unable to load list detail.")
                return
            }

            setItems(payload.results ?? [])
            setStatus("List loaded.")
        },
        [buildListUrl, listId]
    )

    const addToList = React.useCallback(
        async (mediaId: number) => {
            if (!listId) {
                setError("Enter a valid TMDB list id first.")
                return
            }

            if (!sessionId.trim()) {
                setError("Create a TMDB session first. V4 list writes require a user session id.")
                return
            }

            setIsMutating(true)
            setError(null)
            setStatus(null)

            const response = await fetch("/api/tmdb?feature=lists", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "add",
                    listId,
                    mediaId,
                    mediaType,
                    sessionId,
                }),
            })
            const payload = await response.json()
            setIsMutating(false)

            if (!response.ok) {
                setError(payload.error ?? "Unable to add item.")
                return
            }

            setStatus("Item added successfully.")
            setPopoverOpen(false)
            setQuery("")
            await loadList(listId)
        },
        [listId, loadList, mediaType, sessionId]
    )

    const removeFromList = React.useCallback(
        async (mediaId: number) => {
            if (!listId) {
                setError("Enter a valid TMDB list id first.")
                return
            }

            if (!sessionId.trim()) {
                setError("Create a TMDB session first. V4 list writes require a user session id.")
                return
            }

            setIsMutating(true)
            setError(null)
            setStatus(null)

            const response = await fetch("/api/tmdb?feature=lists", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "remove",
                    listId,
                    mediaId,
                    mediaType,
                    sessionId,
                }),
            })
            const payload = await response.json()
            setIsMutating(false)

            if (!response.ok) {
                setError(payload.error ?? "Unable to remove item.")
                return
            }

            setStatus("Item removed successfully.")
            await loadList(listId)
        },
        [listId, loadList, mediaType, sessionId]
    )

    React.useEffect(() => {
        if (!deferredQuery || deferredQuery.length < 2) {
            setSearchResults([])
            return
        }

        const controller = new AbortController()
        let isMounted = true

        async function search() {
            try {
                setIsSearching(true)

                const response = await fetch(`/api/tmdb?q=${encodeURIComponent(deferredQuery)}&mode=media`, {
                    signal: controller.signal,
                })
                const payload = (await response.json()) as TmdbSearchPreview[] | { error?: string }

                if (!response.ok) {
                    throw new Error("error" in payload ? payload.error ?? "Search failed." : "Search failed.")
                }

                if (!isMounted) return

                const mediaResults = (payload as TmdbSearchPreview[])
                    .filter(isMediaPreview)
                    .filter((item) => item.type === mediaType)

                setSearchResults(mediaResults)
            } catch (requestError) {
                if (!isMounted || controller.signal.aborted) return
                setSearchResults([])
                setError(requestError instanceof Error ? requestError.message : "Unable to search TMDB.")
            } finally {
                if (isMounted) setIsSearching(false)
            }
        }

        void search()

        return () => {
            isMounted = false
            controller.abort()
        }
    }, [deferredQuery, mediaType])

    React.useEffect(() => {
        if (!deferredSearchQuery || deferredSearchQuery.length < 2) {
            setSearchBarResults([])
            return
        }

        const controller = new AbortController()
        let isMounted = true

        async function searchBar() {
            try {
                setIsSearchBarSearching(true)

                const response = await fetch(`/api/tmdb?q=${encodeURIComponent(deferredSearchQuery)}&mode=media`, {
                    signal: controller.signal,
                })
                const payload = (await response.json()) as TmdbSearchPreview[] | { error?: string }

                if (!response.ok) {
                    throw new Error("error" in payload ? payload.error ?? "Search failed." : "Search failed.")
                }

                if (!isMounted) return

                const mediaResults = (payload as TmdbSearchPreview[])
                    .filter(isMediaPreview)
                    .filter((item) => item.type === mediaType)

                setSearchBarResults(mediaResults)
            } catch {
                if (!isMounted || controller.signal.aborted) return
                setSearchBarResults([])
            } finally {
                if (isMounted) setIsSearchBarSearching(false)
            }
        }

        void searchBar()

        return () => {
            isMounted = false
            controller.abort()
        }
    }, [deferredSearchQuery, mediaType])

    React.useEffect(() => {
        if (!listId) return
        void loadList(listId)
    }, [listId, loadList])

    React.useEffect(() => {
        if (!isHydrated) {
            return
        }

        void loadWatchlist()
    }, [isHydrated, loadWatchlist, watchlistRevision])

    return (
        <main className="min-h-screen bg-muted px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">{pageTitle}</CardTitle>
                        <CardDescription>{pageDescription}</CardDescription>
                    </CardHeader>
                </Card>

                <div className="hidden">
                    <Input
                        value={listIdInput}
                        onChange={(event) => setListIdInput(event.target.value)}
                        placeholder="TMDB list id"
                    />
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Search {pageTitle}
                        </CardTitle>
                        <CardDescription>Find a {mediaKind} to add to your list or watchlist.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder={`Search by title, TMDB URL or id...`}
                            className="max-w-lg"
                        />
                        {deferredSearchQuery.length >= 2 && isSearchBarSearching ? (
                            <p className="text-sm text-muted-foreground">Searching...</p>
                        ) : null}
                        {deferredSearchQuery.length >= 2 && !isSearchBarSearching && searchBarResults.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No results found.</p>
                        ) : null}
                        {searchBarResults.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {searchBarResults.map((item) => (
                                    <div key={item.id} className="space-y-2">
                                        <MediaCardMd media={item} kind={mediaKind} className="w-full" />
                                        <div className="flex flex-col gap-1.5">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                className="w-full"
                                                onClick={() => void addToList(item.id)}
                                                disabled={!canMutate || isMutating}
                                            >
                                                <Plus className="mr-1 h-3.5 w-3.5" />
                                                Add to List
                                            </Button>
                                            <WatchlistButton
                                                mediaId={item.id}
                                                mediaType={item.type}
                                                className="w-full"
                                                size="sm"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>My TMDB Watchlist</CardTitle>
                        <CardDescription>
                            {isWatchlistLoading
                                ? "Loading watchlist..."
                                : watchlistItems.length
                                ? `${watchlistItems.length} item(s)`
                                : "No watchlist items found."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {watchlistItems.length ? (
                            <MediaRow title={`${pageTitle} Watchlist`} items={watchlistItems} />
                        ) : (
                            <p className="text-sm text-muted-foreground">Sign in and add items in TMDB watchlist to see them here.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle>My {pageTitle} List</CardTitle>
                            <CardDescription>{items.length} item(s)</CardDescription>
                        </div>
                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button type="button" variant="outline" size="icon" disabled={!canMutate || isMutating}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96">
                                <div className="space-y-3">
                                    <Input
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        placeholder={`Search ${mediaKind} by title, URL, or TMDB id`}
                                        className="h-10"
                                    />

                                    {deferredQuery.length < 2 ? (
                                        <p className="text-sm text-muted-foreground">Enter at least 2 characters to search.</p>
                                    ) : null}

                                    {isSearching ? <p className="text-sm text-muted-foreground">Searching TMDB...</p> : null}

                                    {!isSearching && deferredQuery.length >= 2 && searchResults.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No matching results.</p>
                                    ) : null}

                                    <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                                        {searchResults.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => void addToList(item.id)}
                                                className="w-full rounded-xl p-1 text-left transition-colors hover:bg-muted/50"
                                                disabled={isMutating}
                                            >
                                                <MediaCardSm media={item} kind={mediaKind} className="w-full" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-4 lg:grid-cols-8">
                        {items.map((item) => (
                            <div key={item.id} className="space-y-2">
                                <MediaCardMd media={item} kind={mediaKind} className="w-full" />
                                <div className="flex flex-col gap-1.5">
                                    <WatchlistButton
                                        mediaId={item.id}
                                        mediaType={item.type as "movie" | "tv"}
                                        className="w-full"
                                        size="sm"
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        className="w-full"
                                        onClick={() => void removeFromList(item.id)}
                                        disabled={!canMutate || isMutating}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {!items.length ? (
                            <p className="text-sm text-muted-foreground">No items loaded. Set a list id and load list.</p>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
