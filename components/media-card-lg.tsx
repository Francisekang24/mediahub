import Link from "next/link"
import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { posterUrl } from "@/lib/tmdb"
import { cn } from "@/lib/utils"
import type { Documentary, Movie, Series, Anime } from "@/lib/types"

type MediaKind = "movie" | "series" | "anime" | "documentary"

type MediaCardLgProps = {
	media: Movie | Series | Anime | Documentary
	kind?: MediaKind
	href?: string
	className?: string
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"

function getTitle(media: MediaCardLgProps["media"]) {
	if ("title" in media) {
		return media.title
	}

	return media.name
}

function getDate(media: MediaCardLgProps["media"]) {
	if ("release_date" in media) {
		return media.release_date
	}

	return media.first_air_date
}

function getImageUrl(media: MediaCardLgProps["media"]) {
	return posterUrl(media.poster_path)
}

function getDefaultKind(media: MediaCardLgProps["media"]): MediaKind {
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

function MediaCardContent({ media, kind, className }: Omit<MediaCardLgProps, "href">) {
	const resolvedKind = kind ?? getDefaultKind(media)
	const title = getTitle(media)
	const date = getDate(media)
	const year = date ? new Date(date).getFullYear() : null
	const imageUrl = getImageUrl(media)

	return (
		<Card className={cn("w-full overflow-hidden", className)}>
			<CardContent className="p-0">
				<article className="grid grid-cols-[110px_1fr] gap-4 p-3 md:grid-cols-[140px_1fr] md:gap-5 md:p-4">
					<div className="relative h-41.25 w-27.5 overflow-hidden rounded-lg bg-muted md:h-52.5 md:w-35">
						{imageUrl ? (
							<Image
								src={imageUrl}
								alt={`${title} poster`}
								fill
								sizes="(max-width: 768px) 110px, 140px"
								className="object-cover"
							/>
						) : (
							<div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
								No poster
							</div>
						)}
					</div>

					<div className="flex min-w-0 flex-col gap-3">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">{getKindLabel(resolvedKind)}</Badge>
							{year ? <Badge variant="outline">{year}</Badge> : null}
							<Badge variant="outline">{media.original_language.toUpperCase()}</Badge>
							<Badge>{media.vote_average.toFixed(1)}</Badge>
						</div>

						<div className="space-y-2">
							<h3 className="line-clamp-2 text-lg font-semibold leading-tight md:text-xl">
								{title}
							</h3>
							<p className="line-clamp-4 text-sm text-muted-foreground md:line-clamp-5">
								{media.overview || "No overview available."}
							</p>
						</div>
					</div>
				</article>
			</CardContent>
		</Card>
	)
}

export function MediaCardLg({ media, kind, href, className }: MediaCardLgProps) {
	if (!href) {
		return <MediaCardContent media={media} kind={kind} className={className} />
	}

	return (
		<Link href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
			<MediaCardContent media={media} kind={kind} className={cn("transition-shadow hover:shadow-lg", className)} />
		</Link>
	)
}

export default MediaCardLg
