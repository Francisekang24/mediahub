"use client"

import * as React from "react"

import { useTmdbAuth } from "@/components/tmdb-auth-provider"

type WatchlistContextValue = {
    movieIds: ReadonlySet<number>
    tvIds: ReadonlySet<number>
    isOnWatchlist: (id: number, type: "movie" | "tv") => boolean
    addToWatchlist: (id: number, type: "movie" | "tv") => Promise<void>
    removeFromWatchlist: (id: number, type: "movie" | "tv") => Promise<void>
    refreshWatchlists: () => Promise<void>
    revision: number
    isLoading: boolean
    isAuthenticated: boolean
}

const WatchlistContext = React.createContext<WatchlistContextValue>({
    movieIds: new Set(),
    tvIds: new Set(),
    isOnWatchlist: () => false,
    addToWatchlist: async () => {},
    removeFromWatchlist: async () => {},
    refreshWatchlists: async () => {},
    revision: 0,
    isLoading: false,
    isAuthenticated: false,
})

export function useWatchlist() {
    return React.useContext(WatchlistContext)
}

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
    const { accountId, sessionId, isHydrated } = useTmdbAuth()
    const [movieIds, setMovieIds] = React.useState<Set<number>>(new Set())
    const [tvIds, setTvIds] = React.useState<Set<number>>(new Set())
    const [isLoading, setIsLoading] = React.useState(false)
    const [revision, setRevision] = React.useState(0)

    const isAuthenticated = isHydrated && accountId.trim().length > 0 && sessionId.trim().length > 0

    const refreshWatchlists = React.useCallback(async () => {
        if (!isAuthenticated) {
            setMovieIds(new Set())
            setTvIds(new Set())
            return
        }

        setIsLoading(true)

        try {
            const accountParam = encodeURIComponent(accountId.trim())
            const sessionParam = encodeURIComponent(sessionId.trim())

            const [movieRes, tvRes] = await Promise.all([
                fetch(
                    `/api/tmdb?feature=watchlist&accountId=${accountParam}&sessionId=${sessionParam}&mediaType=movie`,
                    { cache: "no-store" }
                ),
                fetch(
                    `/api/tmdb?feature=watchlist&accountId=${accountParam}&sessionId=${sessionParam}&mediaType=tv`,
                    { cache: "no-store" }
                ),
            ])

            const [moviePayload, tvPayload] = await Promise.all([
                movieRes.json().catch(() => ({ results: [] })),
                tvRes.json().catch(() => ({ results: [] })),
            ])

            if (!movieRes.ok || !tvRes.ok) {
                throw new Error("Unable to load watchlists.")
            }

            setMovieIds(
                new Set(
                    (moviePayload.results ?? []).map((item: { id: number }) => item.id)
                )
            )
            setTvIds(
                new Set(
                    (tvPayload.results ?? []).map((item: { id: number }) => item.id)
                )
            )
            setRevision((prev) => prev + 1)
        } catch {
            setMovieIds(new Set())
            setTvIds(new Set())
        } finally {
            setIsLoading(false)
        }
    }, [accountId, isAuthenticated, sessionId])

    React.useEffect(() => {
        void refreshWatchlists()
    }, [refreshWatchlists])

    function isOnWatchlist(id: number, type: "movie" | "tv") {
        return type === "movie" ? movieIds.has(id) : tvIds.has(id)
    }

    async function addToWatchlist(id: number, type: "movie" | "tv") {
        const response = await fetch("/api/tmdb?feature=watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                accountId: accountId.trim(),
                sessionId: sessionId.trim(),
                mediaId: id,
                mediaType: type,
            }),
        })

        if (!response.ok) {
            const payload = await response.json().catch(() => null)
            const message = typeof payload?.error === "string" ? payload.error : "Unable to add item to watchlist."
            throw new Error(message)
        }

        if (type === "movie") {
            setMovieIds((prev) => new Set([...prev, id]))
        } else {
            setTvIds((prev) => new Set([...prev, id]))
        }
        setRevision((prev) => prev + 1)
    }

    async function removeFromWatchlist(id: number, type: "movie" | "tv") {
        const response = await fetch("/api/tmdb?feature=watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                accountId: accountId.trim(),
                sessionId: sessionId.trim(),
                mediaId: id,
                mediaType: type,
                remove: true,
            }),
        })

        if (!response.ok) {
            const payload = await response.json().catch(() => null)
            const message = typeof payload?.error === "string" ? payload.error : "Unable to remove item from watchlist."
            throw new Error(message)
        }

        if (type === "movie") {
            setMovieIds((prev) => {
                const next = new Set(prev)
                next.delete(id)
                return next
            })
        } else {
            setTvIds((prev) => {
                const next = new Set(prev)
                next.delete(id)
                return next
            })
        }
        setRevision((prev) => prev + 1)
    }

    return (
        <WatchlistContext.Provider
            value={{
                movieIds,
                tvIds,
                isOnWatchlist,
                addToWatchlist,
                removeFromWatchlist,
                refreshWatchlists,
                revision,
                isLoading,
                isAuthenticated,
            }}
        >
            {children}
        </WatchlistContext.Provider>
    )
}
