import Image from "next/image"
import Link from "next/link"

import MediaCardMd from "@/components/media-card-md"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { backdropUrl, posterUrl, profileUrl, type TmdbPersonCredit, type TmdbPersonDetail } from "@/lib/tmdb"

type PersonDetailPageProps = {
    detail: TmdbPersonDetail
}

function lifeLabel(detail: TmdbPersonDetail) {
    if (detail.birthday && detail.deathday) {
        return `${detail.birthday} - ${detail.deathday}`
    }

    return detail.birthday ?? detail.deathday ?? null
}

function genderLabel(gender?: number) {
    if (gender === 1) return "Female"
    if (gender === 2) return "Male"
    if (gender === 3) return "Non-binary"
    return "Not specified"
}

function creditHref(credit: TmdbPersonCredit) {
    return credit.media_type === "tv" ? `/series/${credit.id}` : `/movies/${credit.id}`
}

function creditLabel(credit: TmdbPersonCredit) {
    return credit.character ?? credit.job ?? credit.department ?? (credit.media_type === "tv" ? "TV" : "Movie")
}

function sortCredits(credits: TmdbPersonCredit[]) {
    return [...credits].sort((left, right) => {
        const posterScore = Number(Boolean(right.poster_path)) - Number(Boolean(left.poster_path))
        if (posterScore !== 0) return posterScore

        return (right.vote_average ?? 0) - (left.vote_average ?? 0)
    })
}

export default function PersonDetailPage({ detail }: PersonDetailPageProps) {
    const profile = profileUrl(detail.profile_path, "h632")
    const background = backdropUrl(detail.images?.profiles?.[0]?.file_path ?? detail.profile_path, "w1280") ?? profile
    const actingCredits = sortCredits((detail.combined_credits?.cast ?? []).filter((credit) => credit.media_type === "movie" || credit.media_type === "tv")).slice(0, 12)
    const crewCredits = sortCredits((detail.combined_credits?.crew ?? []).filter((credit) => credit.media_type === "movie" || credit.media_type === "tv")).slice(0, 12)
    const tmdbHref = `https://www.themoviedb.org/person/${detail.id}`

    return (
        <main className="min-h-screen bg-muted pb-16">
            <section className="relative overflow-hidden border-b border-border">
                <div className="absolute inset-0 bg-cover bg-center" style={background ? { backgroundImage: `url(${background})` } : undefined} />
                <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/75 to-muted" />

                <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8 lg:py-16">
                    <div className="relative aspect-2/3 overflow-hidden rounded-3xl border border-white/15 bg-card/10 shadow-2xl backdrop-blur-sm">
                        {profile ? (
                            <Image src={profile} alt={detail.name} fill sizes="280px" className="object-cover" priority />
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-white/70">No profile image</div>
                        )}
                    </div>

                    <div className="space-y-6 text-white">
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {detail.known_for_department ? <Badge variant="secondary">{detail.known_for_department}</Badge> : null}
                                {lifeLabel(detail) ? <Badge variant="secondary">{lifeLabel(detail)}</Badge> : null}
                                {detail.place_of_birth ? <Badge variant="secondary">{detail.place_of_birth}</Badge> : null}
                                <Badge variant="secondary">{genderLabel(detail.gender)}</Badge>
                            </div>

                            <div>
                                <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{detail.name}</h1>
                                {detail.also_known_as.length ? (
                                    <p className="mt-2 text-lg text-white/75">Also known as {detail.also_known_as.slice(0, 3).join(", ")}</p>
                                ) : null}
                            </div>
                        </div>

                        <p className="max-w-3xl text-base leading-7 text-white/85">{detail.biography || "No biography available on TMDB."}</p>

                        <div className="flex flex-wrap gap-3">
                            <a href={tmdbHref} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90">
                                Open on TMDB
                            </a>
                            {detail.external_ids?.imdb_id ? (
                                <a href={`https://www.imdb.com/name/${detail.external_ids.imdb_id}/`} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10">
                                    Open on IMDb
                                </a>
                            ) : null}
                            {detail.homepage ? (
                                <a href={detail.homepage} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10">
                                    Official site
                                </a>
                            ) : null}
                        </div>
                    </div>
                </div>
            </section>

            <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
                <section className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Known For</CardTitle>
                            <CardDescription>Selected acting credits linked back into MediaHub.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {actingCredits.length ? actingCredits.map((credit) => (
                                <MediaCardMd
                                    key={`cast-${credit.media_type}-${credit.id}-${credit.character ?? credit.title ?? credit.name}`}
                                    media={{
                                        id: credit.id,
                                        title: credit.title ?? credit.name ?? "Untitled",
                                        year: (credit.release_date ?? credit.first_air_date ?? "").split("-")[0],
                                        poster: posterUrl(credit.poster_path, "w500"),
                                        type: credit.media_type === "tv" ? "tv" : "movie",
                                    }}
                                    href={creditHref(credit)}
                                    className="w-full"
                                />
                            )) : <p className="text-sm text-muted-foreground">No acting credits available.</p>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Facts</CardTitle>
                            <CardDescription>TMDB profile details and alternate names.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5 text-sm">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Known For Department</p>
                                <p className="mt-1 font-medium">{detail.known_for_department ?? "Unknown"}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Born</p>
                                <p className="mt-1 font-medium">{detail.birthday ?? "Unknown"}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Place of Birth</p>
                                <p className="mt-1 font-medium">{detail.place_of_birth ?? "Unknown"}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Also Known As</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {detail.also_known_as.length ? detail.also_known_as.map((alias) => (
                                        <Badge key={alias} variant="outline">{alias}</Badge>
                                    )) : <span className="text-muted-foreground">No aliases listed.</span>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <Card>
                    <CardHeader>
                        <CardTitle>Behind the Camera</CardTitle>
                        <CardDescription>Selected crew credits from TMDB combined credits.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {crewCredits.length ? crewCredits.map((credit) => (
                            <Link key={`crew-${credit.media_type}-${credit.id}-${credit.job ?? credit.department ?? credit.title ?? credit.name}`} href={creditHref(credit)} className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/30">
                                <p className="font-semibold">{credit.title ?? credit.name}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{creditLabel(credit)}</p>
                                <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground/80">{credit.media_type === "tv" ? "Series" : "Movie"}</p>
                            </Link>
                        )) : <p className="text-sm text-muted-foreground">No crew credits available.</p>}
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}