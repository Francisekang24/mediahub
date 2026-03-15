"use client"

import * as React from "react"

import { useTmdbAuth } from "@/components/tmdb-auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

type MyThoughtCardProps = {
    entityType: "movie" | "tv" | "episode"
    mediaId?: number
    seriesId?: number
    seasonNumber?: number
    episodeNumber?: number
}

function buildParams(input: {
    accountId: string
    entityType: "movie" | "tv" | "episode"
    mediaId?: number
    seriesId?: number
    seasonNumber?: number
    episodeNumber?: number
}) {
    const params = new URLSearchParams({
        accountId: input.accountId,
        entityType: input.entityType,
    })

    if (input.entityType === "episode") {
        params.set("seriesId", String(input.seriesId))
        params.set("seasonNumber", String(input.seasonNumber))
        params.set("episodeNumber", String(input.episodeNumber))
        return params
    }

    params.set("mediaId", String(input.mediaId))
    return params
}

export default function MyThoughtCard({ entityType, mediaId, seriesId, seasonNumber, episodeNumber }: MyThoughtCardProps) {
    const { accountId, isHydrated } = useTmdbAuth()

    const [thought, setThought] = React.useState<string | null>(null)
    const [draft, setDraft] = React.useState("")
    const [isEditing, setIsEditing] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [isSaving, setIsSaving] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const queryParams = React.useMemo(() => {
        return buildParams({
            accountId: accountId.trim() || "guest",
            entityType,
            mediaId,
            seriesId,
            seasonNumber,
            episodeNumber,
        })
    }, [accountId, entityType, mediaId, seriesId, seasonNumber, episodeNumber])

    React.useEffect(() => {
        if (!isHydrated) {
            return
        }

        const controller = new AbortController()

        async function loadThought() {
            setIsLoading(true)
            setError(null)

            try {
                const response = await fetch(`/api/thoughts?${queryParams.toString()}`, {
                    cache: "no-store",
                    signal: controller.signal,
                })
                const payload = await response.json().catch(() => null)

                if (!response.ok) {
                    throw new Error(typeof payload?.error === "string" ? payload.error : "Unable to load your thought.")
                }

                const nextThought = typeof payload?.thought === "string" ? payload.thought : null
                setThought(nextThought)
                setDraft(nextThought ?? "")
            } catch (loadError) {
                if (controller.signal.aborted) {
                    return
                }

                setError(loadError instanceof Error ? loadError.message : "Unable to load your thought.")
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false)
                }
            }
        }

        loadThought()

        return () => controller.abort()
    }, [isHydrated, queryParams])

    async function saveThought() {
        setIsSaving(true)
        setError(null)

        try {
            const response = await fetch("/api/thoughts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    accountId: accountId.trim() || "guest",
                    entityType,
                    mediaId,
                    seriesId,
                    seasonNumber,
                    episodeNumber,
                    text: draft,
                }),
            })
            const payload = await response.json().catch(() => null)

            if (!response.ok) {
                throw new Error(typeof payload?.error === "string" ? payload.error : "Unable to save your thought.")
            }

            const nextThought = typeof payload?.thought === "string" ? payload.thought : null
            setThought(nextThought)
            setDraft(nextThought ?? "")
            setIsEditing(false)
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Unable to save your thought.")
        } finally {
            setIsSaving(false)
        }
    }

    async function clearThought() {
        setIsSaving(true)
        setError(null)

        try {
            const response = await fetch(`/api/thoughts?${queryParams.toString()}`, {
                method: "DELETE",
            })
            const payload = await response.json().catch(() => null)

            if (!response.ok) {
                throw new Error(typeof payload?.error === "string" ? payload.error : "Unable to clear your thought.")
            }

            setThought(null)
            setDraft("")
            setIsEditing(false)
        } catch (clearError) {
            setError(clearError instanceof Error ? clearError.message : "Unable to clear your thought.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Card className="border-white/10 bg-white/5 text-white shadow-none backdrop-blur-sm">
            <CardHeader>
                <CardDescription className="text-white/65">My Thoughts</CardDescription>
                {!isEditing ? (
                    <button
                        type="button"
                        onClick={() => {
                            setError(null)
                            setIsEditing(true)
                        }}
                        className="w-full text-left"
                        disabled={isLoading}
                    >
                        <CardTitle className="line-clamp-3 text-base leading-6 underline decoration-white/15 underline-offset-4 hover:decoration-white/60">
                            {isLoading ? "Loading..." : thought || "N/A"}
                        </CardTitle>
                    </button>
                ) : (
                    <div className="space-y-2">
                        <Textarea
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            rows={4}
                            maxLength={1600}
                            placeholder="Write your thought..."
                            className="border-white/15 bg-black/20 text-white placeholder:text-white/35"
                            disabled={isSaving}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                            <Button type="button" size="sm" onClick={saveThought} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save"}
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                                Cancel
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={clearThought} disabled={isSaving}>
                                Clear
                            </Button>
                        </div>
                    </div>
                )}
            </CardHeader>
            <CardContent className="text-sm text-white/70">
                {error ? <p className="mt-2 text-xs text-amber-300">{error}</p> : null}
            </CardContent>
        </Card>
    )
}