import { notFound } from "next/navigation"

import EpisodeDetailPage from "@/components/episode-detail-page"
import { getTmdbEpisode, getTmdbTv } from "@/lib/tmdb"

type SeriesEpisodePageProps = {
    params: Promise<{
        id: string
        seasonNumber: string
        episodeNumber: string
    }>
}

export default async function SeriesEpisodePage({ params }: SeriesEpisodePageProps) {
    const { id, seasonNumber, episodeNumber } = await params
    const seriesId = Number.parseInt(id, 10)
    const parsedSeasonNumber = Number.parseInt(seasonNumber, 10)
    const parsedEpisodeNumber = Number.parseInt(episodeNumber, 10)

    if (
        !Number.isFinite(seriesId) ||
        seriesId <= 0 ||
        !Number.isFinite(parsedSeasonNumber) ||
        parsedSeasonNumber < 0 ||
        !Number.isFinite(parsedEpisodeNumber) ||
        parsedEpisodeNumber <= 0
    ) {
        notFound()
    }

    const [series, episode] = await Promise.all([
        getTmdbTv(seriesId),
        getTmdbEpisode(seriesId, parsedSeasonNumber, parsedEpisodeNumber),
    ])

    if (!series || !episode) {
        notFound()
    }

    return <EpisodeDetailPage series={series} episode={episode} />
}