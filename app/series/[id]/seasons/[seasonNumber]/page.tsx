import { notFound } from "next/navigation"

import SeasonDetailPage from "@/components/season-detail-page"
import { getTmdbSeason, getTmdbTv } from "@/lib/tmdb"

type SeriesSeasonPageProps = {
    params: Promise<{
        id: string
        seasonNumber: string
    }>
}

export default async function SeriesSeasonPage({ params }: SeriesSeasonPageProps) {
    const { id, seasonNumber } = await params
    const seriesId = Number.parseInt(id, 10)
    const parsedSeasonNumber = Number.parseInt(seasonNumber, 10)

    if (!Number.isFinite(seriesId) || seriesId <= 0 || !Number.isFinite(parsedSeasonNumber) || parsedSeasonNumber < 0) {
        notFound()
    }

    const [series, season] = await Promise.all([
        getTmdbTv(seriesId),
        getTmdbSeason(seriesId, parsedSeasonNumber),
    ])

    if (!series || !season) {
        notFound()
    }

    return <SeasonDetailPage series={series} season={season} />
}