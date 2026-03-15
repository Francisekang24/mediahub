import Link from "next/link"
import Image from "next/image"

import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { posterUrl } from "@/lib/tmdb"
import { cn } from "@/lib/utils"
import type { Documentary, Movie, Series, Anime, TmdbSearchMediaPreview } from "@/lib/types"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Bookmark, View } from "lucide-react"

type MediaKind = "movie" | "series" | "anime" | "documentary"

type MediaCardMdProps = {
    media: Movie | Series | Anime | Documentary | TmdbSearchMediaPreview
    kind?: MediaKind
    href?: string
    className?: string
}

function getTitle(media: MediaCardMdProps["media"]) {
    if ("title" in media) {
        return media.title
    }

    return media.name
}

function getDate(media: MediaCardMdProps["media"]) {
    if ("year" in media) {
        return media.year
    }

    if ("release_date" in media) {
        return media.release_date
    }

    return media.first_air_date
}

function getOriginCountry(media: MediaCardMdProps["media"]) {
    if ("origin_country" in media && Array.isArray(media.origin_country) && media.origin_country.length > 0) {
        return media.origin_country[0].toUpperCase()
    }

    return "Unknown"
}

function getImageUrl(media: MediaCardMdProps["media"]) {
    if ("poster" in media) {
        return media.poster
    }

    return posterUrl(media.poster_path)
}

function getDefaultKind(media: MediaCardMdProps["media"]): MediaKind {
    if ("release_date" in media) {
        return "movie"
    }

    return "series"
}

function getKindLabel(kind: MediaKind) {
    if (kind === "movie") return "Movie"
    if (kind === "series") return "Series"
    if (kind === "anime") return "Anime"
    return "Documentary"
}

function getMediaHref(kind: MediaKind, mediaId: number) {
    if (kind === "movie" || kind === "documentary") {
        return `/movies/${mediaId}`
    }

    if (kind === "anime" || kind === "series") {
        return `/series/${mediaId}`
    }

    return `/movies/${mediaId}`
}

function MediaCardContent({ media, kind, className }: Omit<MediaCardMdProps, "href">) {
    const resolvedKind = kind ?? getDefaultKind(media)
    const title = getTitle(media)
    const country = getOriginCountry(media)
    const posterUrl = getImageUrl(media)

    return (
        <Card className={cn("w-40 overflow-hidden border-0 bg-transparent shadow-none p-0 pb-2", className)}>
            <Link href={getMediaHref(resolvedKind, media.id)} className="block">
                <div className="relative aspect-2/3 w-full overflow-hidden rounded-lg bg-muted">
                    {posterUrl ? (
                        <Image
                            src={posterUrl}
                            alt={`${title} poster`}
                            fill
                            sizes="160px"
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
                            No poster
                        </div>
                    )}
                </div>
                <CardHeader>
                    <CardTitle className="truncate text-sm font-semibold">{title}</CardTitle>
                    <CardDescription className="line-clamp-1 text-xs text-muted-foreground">
                        {country} • {getKindLabel(resolvedKind)}
                    </CardDescription>
                </CardHeader>
            </Link>
        </Card>
    )
}

export function MediaCardMd({ media, kind, href, className }: MediaCardMdProps) {
    if (!href) {
        return <MediaCardContent media={media} kind={kind} className={className} />
    }

    return (
        <Link href={href} className="inline-block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <MediaCardContent media={media} kind={kind} className={cn("transition-transform hover:-translate-y-0.5", className)} />
        </Link>
    )
}

export default MediaCardMd

