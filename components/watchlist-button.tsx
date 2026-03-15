"use client"

import * as React from "react"
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react"

import { useWatchlist } from "@/components/watchlist-provider"
import { showAppToast } from "@/components/ui/app-toast"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type WatchlistButtonProps = {
    mediaId: number
    mediaType: "movie" | "tv"
    className?: string
    size?: "sm" | "default" | "icon" | "icon-sm"
    variant?: "default" | "outline" | "ghost" | "secondary"
}

export default function WatchlistButton({
    mediaId,
    mediaType,
    className,
    size = "sm",
    variant = "outline",
}: WatchlistButtonProps) {
    const { isOnWatchlist, addToWatchlist, removeFromWatchlist, isAuthenticated } = useWatchlist()
    const [isPending, setIsPending] = React.useState(false)

    if (!isAuthenticated) return null

    const onList = isOnWatchlist(mediaId, mediaType)

    async function toggle() {
        setIsPending(true)

        try {
            if (onList) {
                await removeFromWatchlist(mediaId, mediaType)
                showAppToast({
                    title: "Removed from watchlist",
                    description: "The title was removed successfully.",
                    variant: "success",
                })
            } else {
                await addToWatchlist(mediaId, mediaType)
                showAppToast({
                    title: "Added to watchlist",
                    description: "The title is now on your watchlist.",
                    variant: "success",
                })
            }
        } catch (error) {
            showAppToast({
                title: "Watchlist update failed",
                description: error instanceof Error ? error.message : "Please try again.",
                variant: "error",
            })
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Button
            type="button"
            variant={onList ? "secondary" : variant}
            size={size}
            onClick={toggle}
            disabled={isPending}
            className={cn(className)}
            title={onList ? "Remove from watchlist" : "Add to watchlist"}
        >
            {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : onList ? (
                <BookmarkCheck className="h-3.5 w-3.5" />
            ) : (
                <Bookmark className="h-3.5 w-3.5" />
            )}
            <span>{onList ? "On Watchlist" : "Watchlist"}</span>
        </Button>
    )
}
