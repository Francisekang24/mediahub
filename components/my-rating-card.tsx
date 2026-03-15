"use client"

import * as React from "react"

import { useTmdbAuth } from "@/components/tmdb-auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type MyRatingCardProps = {
    mediaId: number
    mediaType: "movie" | "tv"
}

function normalizeRating(value: string) {
    const parsed = Number.parseFloat(value)

    if (!Number.isFinite(parsed) || parsed < 0.5 || parsed > 10) {
        return null
    }

    return Math.round(parsed * 2) / 2
}

export default function MyRatingCard({ mediaId, mediaType }: MyRatingCardProps) {
    const { isHydrated, sessionId } = useTmdbAuth()
    const [rating, setRating] = React.useState<number | null>(null)
    const [draft, setDraft] = React.useState("")
    const [isEditing, setIsEditing] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [isSaving, setIsSaving] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        if (!isHydrated) {
            return
        }

        if (!sessionId) {
            setRating(null)
            setDraft("")
            setError(null)
            setIsEditing(false)
            return
        }

        const controller = new AbortController()

        async function loadRating() {
            setIsLoading(true)
            setError(null)

            const params = new URLSearchParams({
                feature: "rating",
                mediaId: String(mediaId),
                mediaType,
                sessionId,
            })

            try {
                const response = await fetch(`/api/tmdb?${params.toString()}`, {
                    cache: "no-store",
                    signal: controller.signal,
                })
                const payload = await response.json().catch(() => null)

                if (!response.ok) {
                    throw new Error(typeof payload?.error === "string" ? payload.error : "Unable to load your TMDB rating.")
                }

                const nextRating = typeof payload?.rated === "number" ? payload.rated : null
                setRating(nextRating)
                setDraft(nextRating !== null ? String(nextRating) : "")
            } catch (loadError) {
                if (controller.signal.aborted) {
                    return
                }

                setError(loadError instanceof Error ? loadError.message : "Unable to load your TMDB rating.")
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false)
                }
            }
        }

        loadRating()

        return () => controller.abort()
    }, [isHydrated, mediaId, mediaType, sessionId])

    function startEditing() {
        if (!sessionId) {
            return
        }

        setError(null)
        setDraft(rating !== null ? String(rating) : "")
        setIsEditing(true)
    }

    async function saveRating() {
        const nextRating = normalizeRating(draft)

        if (nextRating === null) {
            setError("Ratings must be between 0.5 and 10 in 0.5 steps.")
            return
        }

        if (!sessionId) {
            setError("Sign in with TMDB before rating titles.")
            return
        }

        setIsSaving(true)
        setError(null)

        try {
            const response = await fetch(`/api/tmdb?feature=rating`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action: "set",
                    mediaId,
                    mediaType,
                    rating: nextRating,
                    sessionId,
                }),
            })
            const payload = await response.json().catch(() => null)

            if (!response.ok) {
                throw new Error(typeof payload?.error === "string" ? payload.error : "Unable to save your TMDB rating.")
            }

            setRating(nextRating)
            setDraft(String(nextRating))
            setIsEditing(false)
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Unable to save your TMDB rating.")
        } finally {
            setIsSaving(false)
        }
    }

    async function clearRating() {
        if (!sessionId) {
            setError("Sign in with TMDB before rating titles.")
            return
        }

        setIsSaving(true)
        setError(null)

        try {
            const params = new URLSearchParams({
                feature: "rating",
                mediaId: String(mediaId),
                mediaType,
                sessionId,
            })
            const response = await fetch(`/api/tmdb?${params.toString()}`, {
                method: "DELETE",
            })
            const payload = await response.json().catch(() => null)

            if (!response.ok) {
                throw new Error(typeof payload?.error === "string" ? payload.error : "Unable to clear your TMDB rating.")
            }

            setRating(null)
            setDraft("")
            setIsEditing(false)
        } catch (clearError) {
            setError(clearError instanceof Error ? clearError.message : "Unable to clear your TMDB rating.")
        } finally {
            setIsSaving(false)
        }
    }

    const canEdit = Boolean(sessionId)
    const displayValue = isLoading ? "..." : rating !== null ? rating.toFixed(1) : "N/A"

    return (
        <Card className="border-white/10 bg-white/5 text-white shadow-none backdrop-blur-sm">
            <CardHeader>
                <CardDescription className="text-white/65">My Rating</CardDescription>
                {!isEditing ? (
                    <button type="button" onClick={startEditing} className="w-fit text-left disabled:cursor-not-allowed disabled:no-underline" disabled={!canEdit || isLoading}>
                        <CardTitle className="text-3xl underline decoration-white/20 underline-offset-4 hover:decoration-white/60">
                            {displayValue}
                        </CardTitle>
                    </button>
                ) : (
                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            className="h-10 max-w-24 border-white/15 bg-black/20 text-white placeholder:text-white/35"
                            placeholder="0.5-10"
                            disabled={isSaving}
                        />
                        <Button type="button" size="sm" onClick={saveRating} disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                    </div>
                )}
            </CardHeader>
            <CardContent className="text-sm text-white/70">
                {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                        <span>Rate from 0.5 to 10.</span>
                        {rating !== null ? (
                            <button type="button" onClick={clearRating} className="underline underline-offset-4 hover:text-white disabled:text-white/40" disabled={isSaving}>
                                Clear
                            </button>
                        ) : null}
                    </div>
                ) : (
                    <span>
                        {canEdit
                            ? rating !== null
                                ? "Saved to your TMDB account."
                                : "Click N/A to rate this title on TMDB."
                            : "Sign in with TMDB to save ratings to your account."}
                    </span>
                )}
                {error ? <p className="mt-2 text-xs text-amber-300">{error}</p> : null}
            </CardContent>
        </Card>
    )
}