import Image from "next/image"
import Link from "next/link"

import DetailCarousel, { type DetailCarouselItem } from "@/components/detail-carousel"
import MediaCardMd from "@/components/media-card-md"
import MyRatingCard from "@/components/my-rating-card"
import MyThoughtCard from "@/components/my-thought-card"
import PersonCreditCard from "@/components/person-credit-card"
import WatchlistButton from "@/components/watchlist-button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    backdropUrl,
    posterUrl,
    profileUrl,
    type TmdbContentRatingResult,
    type TmdbMediaDetail,
    type TmdbReleaseDateResult,
} from "@/lib/tmdb"

type MediaDetailPageProps = {
    detail: TmdbMediaDetail
    mediaType: "movie" | "tv"
}

function yearLabel(detail: TmdbMediaDetail) {
    const source = detail.release_date ?? detail.first_air_date ?? ""
    return source.split("-")[0] || null
}

function runtimeLabel(detail: TmdbMediaDetail, mediaType: "movie" | "tv") {
    if (mediaType === "movie") {
        return detail.runtime ? `${detail.runtime} min` : null
    }

    const runtime = detail.episode_run_time?.[0]
    return runtime ? `${runtime} min / ep` : null
}

function certificationFromMovie(results?: TmdbReleaseDateResult[]) {
    const preferredRegions = ["US", "GB", "CA", "AU"]
    for (const region of preferredRegions) {
        const match = results?.find((entry) => entry.iso_3166_1 === region)
        const certification = match?.release_dates.find((entry) => entry.certification)?.certification
        if (certification) return `${region} ${certification}`
    }

    return results?.flatMap((entry) => entry.release_dates).find((entry) => entry.certification)?.certification ?? null
}

function certificationFromTv(results?: TmdbContentRatingResult[]) {
    const preferredRegions = ["US", "GB", "CA", "AU"]
    for (const region of preferredRegions) {
        const match = results?.find((entry) => entry.iso_3166_1 === region && entry.rating)
        if (match?.rating) return `${region} ${match.rating}`
    }

    return results?.find((entry) => entry.rating)?.rating ?? null
}

function recommendationHref(item: { id: number; media_type?: string }) {
    return item.media_type === "tv" ? `/series/${item.id}` : `/movies/${item.id}`
}

function personHref(personId: number) {
    return `/person/${personId}`
}

export default function MediaDetailPage({ detail, mediaType }: MediaDetailPageProps) {
    const background = backdropUrl(detail.backdrop_path, "w1280") ?? posterUrl(detail.poster_path, "w780")
    const poster = posterUrl(detail.poster_path, "w500")
    const castItems = (detail.credits?.cast ?? []).slice(0, 12).map<DetailCarouselItem>((person) => ({
        id: `cast-${person.id}`,
        title: person.name,
        subtitle: person.character || person.known_for_department || "Cast",
        imageUrl: profileUrl(person.profile_path, "w185"),
        badge: person.order !== undefined ? `#${person.order + 1}` : undefined,
        href: personHref(person.id),
    }))
    const videoItems = (detail.videos?.results ?? [])
        .filter((video) => video.site === "YouTube")
        .slice(0, 10)
        .map<DetailCarouselItem>((video) => ({
            id: video.id,
            title: video.name,
            subtitle: video.type,
            imageUrl: `https://i.ytimg.com/vi/${video.key}/hqdefault.jpg`,
            externalHref: `https://www.youtube.com/watch?v=${video.key}`,
            badge: video.official ? "Official" : undefined,
        }))
    const imageItems = [...(detail.images?.backdrops ?? []).slice(0, 8), ...(detail.images?.posters ?? []).slice(0, 4)].map<DetailCarouselItem>((image, index) => ({
        id: `image-${index}-${image.file_path}`,
        title: image.iso_639_1 ? image.iso_639_1.toUpperCase() : "Image",
        subtitle: `${image.width} × ${image.height}`,
        imageUrl: backdropUrl(image.file_path, "w780") ?? posterUrl(image.file_path, "w780"),
        externalHref: backdropUrl(image.file_path, "original") ?? posterUrl(image.file_path, "original") ?? undefined,
    }))
    const crew = Array.from(new Map((detail.credits?.crew ?? []).map((person) => [`${person.department}:${person.job}`, person])).values()).slice(0, 12)
    const recommendations = (detail.recommendations?.results ?? []).filter((item) => item.media_type === "movie" || item.media_type === "tv").slice(0, 8)
    const certification = mediaType === "movie"
        ? certificationFromMovie(detail.release_dates?.results)
        : certificationFromTv(detail.content_ratings?.results)

    return (
        <main className="min-h-screen bg-muted pb-16">
            <section className="relative overflow-hidden border-b border-border">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={background ? { backgroundImage: `url(${background})` } : undefined}
                />
                <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/70 to-muted" />
                <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8 lg:py-16">
                    <div className="mx-auto w-full max-w-70 lg:mx-0">
                        <div className="relative aspect-2/3 overflow-hidden rounded-3xl border border-white/15 bg-card/10 shadow-2xl backdrop-blur-sm">
                            {poster ? (
                                <Image src={poster} alt={`${detail.title ?? detail.name} poster`} fill sizes="280px" className="object-cover" priority />
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-white/70">No poster</div>
                            )}
                        </div>
                    </div>

                        <div className="space-y-6 text-white">
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary">{mediaType === "movie" ? "Movie" : "Series"}</Badge>
                                {yearLabel(detail) ? <Badge variant="secondary">{yearLabel(detail)}</Badge> : null}
                                {runtimeLabel(detail, mediaType) ? <Badge variant="secondary">{runtimeLabel(detail, mediaType)}</Badge> : null}
                                {detail.status ? <Badge variant="secondary">{detail.status}</Badge> : null}
                                {certification ? <Badge variant="secondary">{certification}</Badge> : null}
                            </div>
                            <div>
                                <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{detail.title ?? detail.name}</h1>
                                {detail.tagline ? <p className="mt-2 text-lg text-white/75">{detail.tagline}</p> : null}
                            </div>
                        </div>

                        <p className="max-w-3xl text-base leading-7 text-white/85 md:text-lg">{detail.overview || "No overview available."}</p>

                        <div className="flex flex-wrap gap-2">
                            {detail.genres.map((genre) => (
                                <Badge key={genre.id} variant="secondary">{genre.name}</Badge>
                            ))}
                        </div>

                        <WatchlistButton mediaId={detail.id} mediaType={mediaType} size="sm" />

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <MyRatingCard mediaId={detail.id} mediaType={mediaType} />
                            <Card className="border-white/10 bg-white/5 text-white shadow-none backdrop-blur-sm">
                                <CardHeader>
                                    <CardDescription className="text-white/65">Language</CardDescription>
                                    <CardTitle className="text-2xl">{detail.original_language.toUpperCase()}</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-white/70">Original release language</CardContent>
                            </Card>
                            <Card className="border-white/10 bg-white/5 text-white shadow-none backdrop-blur-sm">
                                <CardHeader>
                                    <CardDescription className="text-white/65">Production</CardDescription>
                                    <CardTitle className="text-lg">{detail.production_companies?.[0]?.name ?? "Unknown"}</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-white/70">Lead production company</CardContent>
                            </Card>
                            <Card className="border-white/10 bg-white/5 text-white shadow-none backdrop-blur-sm">
                                <CardHeader>
                                    <CardDescription className="text-white/65">Scope</CardDescription>
                                    <CardTitle className="text-lg">
                                        {mediaType === "movie"
                                            ? `${detail.runtime ?? "?"} min`
                                            : `${detail.number_of_seasons ?? 0} season${detail.number_of_seasons === 1 ? "" : "s"}`}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-white/70">
                                    {mediaType === "movie"
                                        ? "Total runtime"
                                        : `${detail.number_of_episodes ?? 0} episode${detail.number_of_episodes === 1 ? "" : "s"}`}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="max-w-3xl">
                            <MyThoughtCard mediaId={detail.id} entityType={mediaType} />
                        </div>
                    </div>
                </div>
            </section>

            <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
                <section className="flex flex-col gap-6 xl:flex-row xl:items-start">
                    <Card className="xl:min-w-0 xl:flex-1">
                        <CardHeader>
                            <CardTitle>Cast</CardTitle>
                            <CardDescription>Top billed cast from TMDB credits.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DetailCarousel title="Featured Cast" items={castItems} emptyText="No cast data available." aspect="poster" itemSize="sm" externalIndicator="none" />
                        </CardContent>
                    </Card>

                    <Card className="xl:w-95 xl:flex-none">
                        <CardHeader>
                            <CardTitle>Crew</CardTitle>
                            <CardDescription>Key crew roles and departments.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2">
                            {crew.length ? crew.map((person) => (
                                <PersonCreditCard key={`${person.id}-${person.job}`} personId={person.id} name={person.name} role={person.job} department={person.department} profilePath={person.profile_path} />
                            )) : <p className="text-sm text-muted-foreground">No crew data available.</p>}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Videos</CardTitle>
                            <CardDescription>Trailers, teasers, and clips.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DetailCarousel title="Videos" items={videoItems} emptyText="No videos available." aspect="video" externalIndicator="play" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Images</CardTitle>
                            <CardDescription>Backdrops and posters from TMDB.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DetailCarousel title="Images" items={imageItems} emptyText="No images available." aspect="wide" externalIndicator="none" />
                        </CardContent>
                    </Card>
                </section>

                {mediaType === "tv" ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Seasons</CardTitle>
                            <CardDescription>Browse seasons and drill into episodes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DetailCarousel
                                title="Seasons"
                                items={(detail.seasons ?? []).filter((season) => season.season_number >= 0).map((season) => ({
                                    id: `season-${season.id}`,
                                    title: season.name,
                                    subtitle: `${season.episode_count} episode${season.episode_count === 1 ? "" : "s"}${season.air_date ? ` • ${season.air_date.split("-")[0]}` : ""}`,
                                    imageUrl: posterUrl(season.poster_path, "w500"),
                                    href: `/series/${detail.id}/seasons/${season.season_number}`,
                                    badge: `Season ${season.season_number}`,
                                }))}
                                emptyText="No seasons available."
                                aspect="poster"
                            />
                        </CardContent>
                    </Card>
                ) : null}

                <Card>
                    <CardHeader>
                        <CardTitle>Recommendations</CardTitle>
                        <CardDescription>Related titles suggested by TMDB.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {recommendations.length ? recommendations.map((item) => (
                            <MediaCardMd
                                key={item.id}
                                media={{
                                    id: item.id,
                                    title: item.title ?? item.name ?? "Untitled",
                                    year: (item.release_date ?? item.first_air_date ?? "").split("-")[0],
                                    poster: posterUrl(item.poster_path),
                                    type: item.media_type === "tv" ? "tv" : "movie",
                                }}
                                href={recommendationHref(item)}
                            />
                        )) : <p className="text-sm text-muted-foreground">No recommendations available.</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Ratings</CardTitle>
                        <CardDescription>Audience score and available content ratings.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-border bg-muted/30 p-4">
                            <p className="text-sm text-muted-foreground">TMDB Score</p>
                            <p className="mt-1 text-3xl font-semibold">{detail.vote_average.toFixed(1)}</p>
                            <p className="mt-2 text-sm text-muted-foreground">from {detail.vote_count ?? 0} ratings</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-muted/30 p-4">
                            <p className="text-sm text-muted-foreground">Certification</p>
                            <p className="mt-1 text-3xl font-semibold">{certification ?? "N/A"}</p>
                            <p className="mt-2 text-sm text-muted-foreground">Preferred region-based rating</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-muted/30 p-4">
                            <p className="text-sm text-muted-foreground">Homepage</p>
                            {detail.homepage ? (
                                <Link href={detail.homepage} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-lg font-semibold underline underline-offset-4">
                                    Visit official site
                                </Link>
                            ) : (
                                <p className="mt-1 text-3xl font-semibold">N/A</p>
                            )}
                            <p className="mt-2 text-sm text-muted-foreground">External official link</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}