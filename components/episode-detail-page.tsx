import Image from "next/image"

import DetailCarousel from "@/components/detail-carousel"
import MyThoughtCard from "@/components/my-thought-card"
import PersonCreditCard from "@/components/person-credit-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { backdropUrl, profileUrl, type TmdbEpisodeDetail, type TmdbMediaDetail } from "@/lib/tmdb"

type EpisodeDetailPageProps = {
    series: TmdbMediaDetail
    episode: TmdbEpisodeDetail
}

export default function EpisodeDetailPage({ series, episode }: EpisodeDetailPageProps) {
    const still = backdropUrl(episode.still_path, "w1280") ?? backdropUrl(series.backdrop_path, "w1280")

    return (
        <main className="min-h-screen bg-muted pb-16">
            <section className="relative overflow-hidden border-b border-border">
                <div className="absolute inset-0 bg-cover bg-center" style={still ? { backgroundImage: `url(${still})` } : undefined} />
                <div className="absolute inset-0 bg-linear-to-b from-black/55 via-black/70 to-muted" />

                <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8 lg:py-16">
                    <div className="relative aspect-video overflow-hidden rounded-3xl border border-white/15 bg-card/10 shadow-2xl backdrop-blur-sm">
                        {episode.still_path ? (
                            <Image src={backdropUrl(episode.still_path, "w780")!} alt={episode.name} fill sizes="320px" className="object-cover" priority />
                        ) : null}
                    </div>

                    <div className="space-y-5 text-white">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">Episode</Badge>
                            <Badge variant="secondary">S{episode.season_number}E{episode.episode_number}</Badge>
                            {episode.runtime ? <Badge variant="secondary">{episode.runtime} min</Badge> : null}
                            {episode.air_date ? <Badge variant="secondary">{episode.air_date}</Badge> : null}
                        </div>
                        <div>
                            <p className="text-sm uppercase tracking-[0.24em] text-white/60">{series.name}</p>
                            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{episode.name}</h1>
                        </div>
                        <p className="max-w-3xl text-base leading-7 text-white/85">{episode.overview || "No episode overview available."}</p>
                        <div className="max-w-xl">
                            <MyThoughtCard
                                entityType="episode"
                                seriesId={series.id}
                                seasonNumber={episode.season_number}
                                episodeNumber={episode.episode_number}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
                <section className="flex flex-col gap-6 xl:flex-row xl:items-start">
                    <Card className="xl:min-w-0 xl:flex-1">
                        <CardHeader>
                            <CardTitle>Guest Stars</CardTitle>
                            <CardDescription>Special appearances in this episode.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DetailCarousel
                                title="Guest Stars"
                                items={episode.guest_stars.map((person) => ({
                                    id: `guest-${person.id}`,
                                    title: person.name,
                                    subtitle: person.character || "Guest star",
                                    imageUrl: profileUrl(person.profile_path, "w185"),
                                    href: `/person/${person.id}`,
                                }))}
                                emptyText="No guest stars available."
                                aspect="poster"
                                itemSize="sm"
                                externalIndicator="none"
                            />
                        </CardContent>
                    </Card>

                    <Card className="xl:w-95 xl:flex-none">
                        <CardHeader>
                            <CardTitle>Crew</CardTitle>
                            <CardDescription>Episode-specific crew credits.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2">
                            {episode.crew.length ? episode.crew.slice(0, 12).map((person) => (
                                <PersonCreditCard key={`${person.id}-${person.job}`} personId={person.id} name={person.name} role={person.job} department={person.department} profilePath={person.profile_path} />
                            )) : <p className="text-sm text-muted-foreground">No crew data available.</p>}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Videos</CardTitle>
                            <CardDescription>Clips and promos for this episode.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DetailCarousel
                                title="Videos"
                                items={(episode.videos?.results ?? []).filter((video) => video.site === "YouTube").slice(0, 8).map((video) => ({
                                    id: video.id,
                                    title: video.name,
                                    subtitle: video.type,
                                    imageUrl: `https://i.ytimg.com/vi/${video.key}/hqdefault.jpg`,
                                    externalHref: `https://www.youtube.com/watch?v=${video.key}`,
                                }))}
                                emptyText="No videos available."
                                aspect="video"
                                externalIndicator="play"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Stills</CardTitle>
                            <CardDescription>Episode still images from TMDB.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DetailCarousel
                                title="Stills"
                                items={(episode.images?.stills ?? []).slice(0, 8).map((image, index) => ({
                                    id: `still-${index}`,
                                    title: image.iso_639_1 ? image.iso_639_1.toUpperCase() : "Still",
                                    subtitle: `${image.width} × ${image.height}`,
                                    imageUrl: backdropUrl(image.file_path, "w780"),
                                    externalHref: backdropUrl(image.file_path, "original") ?? undefined,
                                }))}
                                emptyText="No still images available."
                                aspect="video"
                                externalIndicator="none"
                            />
                        </CardContent>
                    </Card>
                </section>
            </div>
        </main>
    )
}