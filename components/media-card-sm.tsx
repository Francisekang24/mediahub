import Link from "next/link"
import Image from "next/image"

import { Card, CardContent } from "@/components/ui/card"
import { posterUrl } from "@/lib/tmdb"
import { cn } from "@/lib/utils"
import type { Documentary, Movie, Series, Anime, TmdbSearchMediaPreview } from "@/lib/types"

type MediaKind = "movie" | "series" | "anime" | "documentary"

type MediaCardSmProps = {
	media: Movie | Series | Anime | Documentary | TmdbSearchMediaPreview
	kind?: MediaKind
	href?: string
	className?: string
}

function getTitle(media: MediaCardSmProps["media"]) {
	if ("title" in media && typeof media.title === "string") {
		return media.title
	}

	if ("name" in media && typeof media.name === "string") {
		return media.name
	}

	return "Untitled"
}

function getDate(media: MediaCardSmProps["media"]) {
	if ("year" in media) {
		return media.year
	}

	if ("release_date" in media) {
		return media.release_date
	}

	return media.first_air_date
}

function getImageUrl(media: MediaCardSmProps["media"]) {
	if ("poster" in media) {
		return media.poster
	}

	return posterUrl(media.poster_path)
}

function getDefaultKind(media: MediaCardSmProps["media"]): MediaKind {
	if ("type" in media) {
		return media.type === "movie" ? "movie" : "series"
	}

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

function MediaCardContent({ media, kind, className }: Omit<MediaCardSmProps, "href">) {
	const resolvedKind = kind ?? getDefaultKind(media)
	const title = getTitle(media)
	const date = getDate(media)
	const year = date ? new Date(date).getFullYear() : null
	const posterUrl = getImageUrl(media)

	return (
		<Card className={cn("w-fit overflow-hidden", className)}>
			<CardContent className="p-0">
				<article className="grid grid-cols-[44px_1fr] items-center gap-2 p-2">
					<div className="relative h-16 w-11 overflow-hidden rounded-sm bg-muted">
						{posterUrl ? (
							<Image
								src={posterUrl}
								alt={`${title} poster`}
								fill
								sizes="44px"
								className="object-cover"
							/>
						) : (
							<div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-muted-foreground">
								No poster
							</div>
						)}
					</div>

					<div className="min-w-0 space-y-0.5">
						<h3 className="line-clamp-1 text-xs font-bold leading-tight">{title}</h3>
						<p className="line-clamp-1 text-[11px] text-muted-foreground">
							{getKindLabel(resolvedKind)}
							{year ? ` • ${year}` : ""}
						</p>
					</div>
				</article>
			</CardContent>
		</Card>
	)
}

export function MediaCardSm({ media, kind, href, className }: MediaCardSmProps) {
	if (!href) {
		return <MediaCardContent media={media} kind={kind} className={className} />
	}

	return (
		<Link href={href} className="inline-block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
			<MediaCardContent media={media} kind={kind} className={cn("transition-colors hover:bg-muted/60", className)} />
		</Link>
	)
}

export default MediaCardSm
