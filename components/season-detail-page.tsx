import Image from "next/image"
import Link from "next/link"

import DetailCarousel from "@/components/detail-carousel"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { backdropUrl, posterUrl, profileUrl, type TmdbMediaDetail, type TmdbSeasonDetail } from "@/lib/tmdb"

type SeasonDetailPageProps = {
    series: TmdbMediaDetail
    season: TmdbSeasonDetail
}

export default function SeasonDetailPage({ series, season }: SeasonDetailPageProps) {
    const background = backdropUrl(series.backdrop_path, "w1280") ?? posterUrl(season.poster_path, "w780")

    return (
        <main className="min-h-screen bg-muted pb-16">
            <section className="relative overflow-hidden border-b border-border">
                <div className="absolute inset-0 bg-cover bg-center" style={background ? { backgroundImage: `url(${background})` } : undefined} />
                <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/70 to-muted" />

                <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8 lg:py-16">
                    <div className="relative aspect-2/3 overflow-hidden rounded-3xl border border-white/15 bg-card/10 shadow-2xl backdrop-blur-sm">
                        {season.poster_path ? (
                            <Image src={posterUrl(season.poster_path, "w500")!} alt={`${season.name} poster`} fill sizes="240px" className="object-cover" />
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-white/70">No poster</div>
                        )}
                    </div>

                    <div className="space-y-5 text-white">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">Series Season</Badge>
                            <Badge variant="secondary">Season {season.season_number}</Badge>
                            <Badge variant="secondary">{season.episode_count} episodes</Badge>
                            {season.air_date ? <Badge variant="secondary">{season.air_date.split("-")[0]}</Badge> : null}
                        </div>
                        <div>
                            <p className="text-sm uppercase tracking-[0.24em] text-white/60">{series.name}</p>
                            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{season.name}</h1>
                        </div>
                        <p className="max-w-3xl text-base leading-7 text-white/85">{season.overview || "No season overview available."}</p>
                    </div>
                </div>
            </section>

            <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Episodes</CardTitle>
                        <CardDescription>Each episode has its own detail page.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {season.episodes.length ? season.episodes.map((episode) => (
                            <Link
                                key={episode.id}
                                href={`/series/${series.id}/seasons/${season.season_number}/episodes/${episode.episode_number}`}
                                className="grid gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/30 md:grid-cols-[220px_1fr]"
                            >
                                <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted">
                                    {episode.still_path ? (
                                        <Image src={backdropUrl(episode.still_path, "w780")!} alt={episode.name} fill sizes="220px" className="object-cover" />
                                    ) : null}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary">Episode {episode.episode_number}</Badge>
                                        {episode.runtime ? <Badge variant="outline">{episode.runtime} min</Badge> : null}
                                        {episode.air_date ? <Badge variant="outline">{episode.air_date}</Badge> : null}
                                    </div>
                                    <h3 className="text-xl font-semibold">{episode.name}</h3>
                                    <p className="text-sm text-muted-foreground">{episode.overview || "No episode overview available."}</p>
                                </div>
                            </Link>
                        )) : <p className="text-sm text-muted-foreground">No episodes available.</p>}
                    </CardContent>
                </Card>

                <section className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Season Cast</CardTitle>
                            <CardDescription>Featured cast for this season.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DetailCarousel
                                title="Cast"
                                items={(season.credits?.cast ?? []).slice(0, 12).map((person) => ({
                                    id: `cast-${person.id}`,
                                    title: person.name,
                                    subtitle: person.character || "Cast",
                                    imageUrl: profileUrl(person.profile_path, "w185"),
                                    href: `/person/${person.id}`,
                                }))}
                                emptyText="No season cast available."
                                aspect="poster"
                                itemSize="sm"
                                externalIndicator="none"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Season Media</CardTitle>
                            <CardDescription>Posters and videos for this season.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <DetailCarousel
                                title="Videos"
                                items={(season.videos?.results ?? []).filter((video) => video.site === "YouTube").slice(0, 8).map((video) => ({
                                    id: video.id,
                                    title: video.name,
                                    subtitle: video.type,
                                    imageUrl: `https://i.ytimg.com/vi/${video.key}/hqdefault.jpg`,
                                    externalHref: `https://www.youtube.com/watch?v=${video.key}`,
                                }))}
                                emptyText="No season videos available."
                                aspect="video"
                                externalIndicator="play"
                            />

                            <DetailCarousel
                                title="Posters"
                                items={(season.images?.posters ?? []).slice(0, 8).map((image, index) => ({
                                    id: `poster-${index}`,
                                    title: image.iso_639_1 ? image.iso_639_1.toUpperCase() : "Poster",
                                    subtitle: `${image.width} × ${image.height}`,
                                    imageUrl: posterUrl(image.file_path, "w500"),
                                    externalHref: posterUrl(image.file_path, "original") ?? undefined,
                                }))}
                                emptyText="No season posters available."
                                aspect="poster"
                                externalIndicator="none"
                            />
                        </CardContent>
                    </Card>
                </section>
            </div>
        </main>
    )
}