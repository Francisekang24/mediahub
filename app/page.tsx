"use client"

import * as React from "react"
import Link from "next/link"

import MediaCardSm from "@/components/media-card-sm"
import { useTmdbAuth } from "@/components/tmdb-auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import MediaRow from "@/components/media-row"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

type FeatureItem = {
    id: number
    title: string
    year: string
    poster: string | null
    type: "movie" | "tv"
}

type FeatureResponse = {
    results: FeatureItem[]
}

export default function Home() {

    const { accountId, sessionId, isHydrated } = useTmdbAuth()
    const [trendingMovies, setTrendingMovies] = React.useState<FeatureItem[]>([])
    const [discoveryMovies, setDiscoveryMovies] = React.useState<FeatureItem[]>([])
    const [trendingSeries, setTrendingSeries] = React.useState<FeatureItem[]>([])
    const [discoverySeries, setDiscoverySeries] = React.useState<FeatureItem[]>([])
    const [watchlist, setWatchlist] = React.useState<FeatureItem[]>([])
    const [error, setError] = React.useState<string | null>(null)

    const canUseWatchlist = isHydrated && accountId.trim().length > 0 && sessionId.trim().length > 0


    async function loadTrendingMovies() {
        const response = await fetch("/api/tmdb?feature=trending&mediaType=movie&timeWindow=week")
        const payload = await response.json()
        if (!response.ok) {
            setError(payload?.error ?? "Failed to load trending.")
            return
        }
        setTrendingMovies(payload.results ?? [])
    }

    async function loadDiscoveryMovies() {
        const response = await fetch("/api/tmdb?feature=discover&mediaType=movie&watchRegion=US")
        const payload = await response.json()
        if (!response.ok) {
            setError(payload?.error ?? "Failed to load discovery.")
            return
        }
        setDiscoveryMovies(payload.results ?? [])
    }

    async function loadTrendingSeries() {
        const response = await fetch("/api/tmdb?feature=trending&mediaType=tv&timeWindow=week")
        const payload = await response.json()
        if (!response.ok) {
            setError(payload?.error ?? "Failed to load trending.")
            return
        }
        setTrendingSeries(payload.results ?? [])
    }

    async function loadDiscoverySeries() {
        const response = await fetch("/api/tmdb?feature=discover&mediaType=tv&watchRegion=US")
        const payload = await response.json()
        if (!response.ok) {
            setError(payload?.error ?? "Failed to load discovery.")
            return
        }
        setDiscoverySeries(payload.results ?? [])
    }

    React.useEffect(() => {
        let isMounted = true

        async function load() {
            try {
                setError(null)
                await Promise.all([loadTrendingMovies(), loadDiscoveryMovies(), loadTrendingSeries(), loadDiscoverySeries()])
            } catch (requestError) {
                if (!isMounted) return
                setError(requestError instanceof Error ? requestError.message : "Failed to load movie features.")
            }
        }

        void load()

        return () => {
            isMounted = false
        }
    }, [])


    return (
        <main className="min-h-screen bg-muted px-2 py-10 sm:px-6 lg:px-8">

            <div className="flex flex-col gap-6">
                <div className="mx-auto max-w-3xl rounded-lg bg-white/80 p-6 text-center shadow-lg">
                    This website is a hub where I track all the movies, series, Animes I have watched. I'll try to keep it updated as much as possible. You can check out the source code on{" "}
                    <Link href="https://github.com/Francisekang24/mediahub" className="text-blue-500 hover:underline">
                        GitHub
                    </Link>                . If you have any suggestions or want to contribute, feel free to open an issue or a pull request!
                </div>

                <Tabs defaultValue="movies">
                    <TabsList className="mx-auto w-max rounded-lg bg-white/80 p-1 shadow-lg" aria-label="Select media type">
                        <TabsTrigger value="movies">Movies</TabsTrigger>
                        <TabsTrigger value="series">Series</TabsTrigger>
                    </TabsList>
                    <TabsContent value="movies">
                        <div className="mx-auto flex max-w-6xl flex-col gap-6">
                            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                                <Card>
                                    <CardContent className="">
                                        <MediaRow items={trendingMovies} title="Trending Movies" showWatchlistButton />
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                                <Card>
                                    <CardContent className="">
                                        <MediaRow items={discoveryMovies} title="Discovery Movies" showWatchlistButton />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="series">
                        <div className="mx-auto flex max-w-6xl flex-col gap-6">
                            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                                <Card>
                                    <CardContent className="">
                                        <MediaRow items={trendingSeries} title="Trending Series" showWatchlistButton />
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                                <Card>
                                    <CardContent className="">
                                        <MediaRow items={discoverySeries} title="Discovery Series" showWatchlistButton />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

            </div>
        </main>
    );
}
